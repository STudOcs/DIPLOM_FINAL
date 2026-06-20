import os
import subprocess
import uuid
from jinja2 import Environment, FileSystemLoader
from django.conf import settings
from django.utils import timezone
import copy
from urllib.parse import urlparse, unquote
from django.core.files.storage import default_storage

class LatexService:
    def __init__(self):
        # Jinja2 для поиска шаблонов
        template_path = os.path.join(settings.BASE_DIR, 'latex_core', 'templates')
        self.env = Environment(
            loader=FileSystemLoader(template_path),
            # Настройки Jinja2 с синтаксисом LaTeX
            block_start_string='[#',
            block_end_string='#]',
            variable_start_string='[[',
            variable_end_string=']]'
        )
        self.env.filters['escape_latex'] = self.escape_latex

    def escape_latex(self, text):
        """Экранирование спецсимволов LaTeX"""
        if not isinstance(text, str): return text
        conv = {
            '&': r'\&', '%': r'\%', '$': r'\$', '#': r'\#', '_': r'\_',
            '{': r'\{', '}': r'\}', '~': r'\textasciitilde{}',
            '^': r'\textasciicircum{}', '\\': r'\textbackslash{}',
        }
        return "".join(conv.get(c, c) for c in text)

    def render_to_string(self, document, content_json=None):
        title_template = self.env.get_template('title.tex')
        title_page_content = title_template.render(doc=document, user=document.owner)

        blocks_tex = []
        blocks = content_json if content_json is not None else document.content_json

        for index, block in enumerate(blocks):
            try:
                block_template = self.env.get_template(f"blocks/{block['type']}.tex")
                ctx = {
                    'block_id': block.get('id', str(uuid.uuid4())[:8]),
                    **block.get('content', {})
                }

                if block['type'] == 'text' and 'text' in ctx:
                    ctx['text'] = self.escape_latex(ctx['text'])

                blocks_tex.append(block_template.render(**ctx))
            except Exception as e:
                blocks_tex.append(f"\n% Ошибка рендеринга блока {block.get('type')}: {str(e)}\n")

        base_template = self.env.get_template('base.tex')
        return base_template.render(
            title_page_content=title_page_content,
            blocks_content="\n".join(blocks_tex),
            doc=document
        )

    def compile_pdf(self, document):
        """Процесс компиляции .tex -> .pdf"""
        file_id = f"doc_{document.id}_{uuid.uuid4().hex[:6]}"
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'latex_temp', file_id)
        os.makedirs(temp_dir, exist_ok=True)

        prepared_content_json = self._prepare_images_for_latex(
            document.content_json,
            temp_dir,
        )

        latex_code = self.render_to_string(
            document,
            content_json=prepared_content_json,
        )
        
        os.makedirs(temp_dir, exist_ok=True)
        
        tex_file_path = os.path.join(temp_dir, 'document.tex')
        
        # Сохраняем код в файл
        with open(tex_file_path, 'w', encoding='utf-8') as f:
            f.write(latex_code)

        # Запуск XeLaTeX (нужно 2 прогона для оглавления)
        try:
            for _ in range(2):
                result = subprocess.run(
                    ['xelatex', '-interaction=nonstopmode', 'document.tex'],
                    cwd=temp_dir,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
            
            pdf_path = os.path.join(temp_dir, 'document.pdf')
            
            if os.path.exists(pdf_path):
                # Возвращаем путь относительно MEDIA_ROOT для сохранения в БД
                relative_path = os.path.join('latex_temp', file_id, 'document.pdf')
                return relative_path, None
            else:
                return None, result.stdout # Возвращаем лог ошибки LaTeX
                
        except subprocess.TimeoutExpired:
            return None, "Превышено время ожидания компиляции (30 сек)."
        except Exception as e:
            return None, str(e)
        
    def _find_image_blocks(self, blocks):
        images = []

        def walk(value):
            if isinstance(value, list):
                for item in value:
                    walk(item)

            elif isinstance(value, dict):
                block_type = value.get("type")
                content = value.get("content", {})

                if block_type == "image":
                    image_path = (
                        content.get("image_path")
                        or content.get("src")
                        or content.get("url")
                    )

                    if image_path:
                        images.append(value)

                for child in value.values():
                    walk(child)

        walk(blocks)
        return images

    def _storage_name_from_url(self, url):
        if not url:
            return ""

        parsed = urlparse(url)
        path = unquote(parsed.path).lstrip("/")

        bucket = getattr(settings, "AWS_STORAGE_BUCKET_NAME", "")

        if bucket and path.startswith(f"{bucket}/"):
            path = path[len(bucket) + 1:]

        return path

    def _prepare_images_for_latex(self, blocks, temp_dir):
        prepared_blocks = copy.deepcopy(blocks)
        image_blocks = self._find_image_blocks(prepared_blocks)

        for index, block in enumerate(image_blocks, start=1):
            content = block.setdefault("content", {})

            source = (
                content.get("image_path")
                or content.get("src")
                or content.get("url")
            )

            storage_name = content.get("file") or self._storage_name_from_url(source)

            ext = os.path.splitext(storage_name)[1] or ".png"
            local_name = f"img_{index}{ext}"
            local_path = os.path.join(temp_dir, local_name)

            try:
                with default_storage.open(storage_name, "rb") as src:
                    with open(local_path, "wb") as dst:
                        dst.write(src.read())

                content["image_path"] = local_name

            except Exception as e:
                content["image_path"] = ""
                content["caption"] = content.get("caption", "Ошибка загрузки изображения")
                content["download_error"] = str(e)

        return prepared_blocks