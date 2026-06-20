import os
import subprocess
import uuid
import shutil
import copy
from urllib.parse import urlparse, unquote
from jinja2 import Environment, FileSystemLoader
from django.conf import settings
from django.core.files.storage import default_storage

class LatexService:
    def __init__(self):
        self.template_base_path = os.path.join(settings.BASE_DIR, 'latex_core', 'templates')
        self.env = Environment(
            loader=FileSystemLoader(self.template_base_path),
            block_start_string='[#',
            block_end_string='#]',
            variable_start_string='[[',
            variable_end_string=']]'
        )
        self.env.filters['escape_latex'] = self.escape_latex

    def escape_latex(self, text):
        if not isinstance(text, str): return text
        conv = {
            '&': r'\&', '%': r'\%', '$': r'\$', '#': r'\#', '_': r'\_',
            '{': r'\{', '}': r'\}', '~': r'\textasciitilde{}',
            '^': r'\textasciicircum{}', '\\': r'\textbackslash{}',
        }
        return "".join(conv.get(c, c) for c in text)

    def render_blocks(self, document, blocks=None):
        """Превращает JSON-блоки в одну строку LaTeX кода"""
        blocks_tex = []
        # Используем переданные блоки (подготовленные с локальными путями) 
        # или блоки напрямую из документа
        source_blocks = blocks if blocks is not None else document.content_json

        for index, block in enumerate(source_blocks):
            try:
                template_name = f"blocks/{block['type']}.j2"
                ctx = {
                    'block_id': block.get('id', index),
                    **block.get('content', {})
                }
                # Экранируем текст для обычных блоков
                if block['type'] == 'text' and 'text' in ctx:
                    ctx['text'] = self.escape_latex(ctx['text'])
                
                blocks_tex.append(self.env.get_template(template_name).render(**ctx))
            except Exception as e:
                blocks_tex.append(f"\n% Ошибка блока {block.get('type')}: {str(e)}\n")
        
        return "\n".join(blocks_tex)

    def compile_pdf(self, document):
        """Сборка многофайлового проекта с поддержкой S3 изображений"""
        # 1. Подготовка путей
        file_id = f"doc_{document.id}_{uuid.uuid4().hex[:6]}"
        build_dir = os.path.join(settings.MEDIA_ROOT, 'latex_temp', file_id)
        os.makedirs(build_dir, exist_ok=True)

        # 2. ПОДГОТОВКА ИЗОБРАЖЕНИЙ (Логика напарника)
        # Скачиваем картинки из S3 в build_dir и получаем обновленный список блоков
        prepared_content_json = self._prepare_images_for_latex(
            document.content_json, 
            build_dir
        )

        # 3. Копируем статические файлы преподавателя
        vkr_tpl_path = os.path.join(self.template_base_path, 'vkr_sfu')
        static_files = ['common.tex', 'dop.tex', 'mybibliography.bib']
        for f_name in static_files:
            src = os.path.join(vkr_tpl_path, f_name)
            if os.path.exists(src):
                shutil.copy(src, build_dir)

        # 4. Рендерим динамические части проекта (.j2 -> .tex)
        dynamic_parts = ['title.j2', 'main.j2']
        
        context = {
            'doc': document,
            'user': document.owner,
            # Рендерим блоки, используя подготовленный JSON с локальными путями картинок
            'blocks_content': self.render_blocks(document, blocks=prepared_content_json)
        }

        for tpl_name in dynamic_parts:
            content = self.env.get_template(f"vkr_sfu/{tpl_name}").render(**context)
            target_name = tpl_name.replace('.j2', '.tex')
            with open(os.path.join(build_dir, target_name), 'w', encoding='utf-8') as f:
                f.write(content)

        # 5. Процесс компиляции (XeLaTeX -> Biber -> XeLaTeX x2)
        try:
            run_cmd = {
                'cwd': build_dir,
                'capture_output': True,
                'text': True,
                'timeout': 80  # Увеличил таймаут, так как скачивание + 3 прогона требуют времени
            }

            subprocess.run(['xelatex', '-interaction=nonstopmode', 'main.tex'], **run_cmd)
            subprocess.run(['biber', 'main'], **run_cmd)
            subprocess.run(['xelatex', '-interaction=nonstopmode', 'main.tex'], **run_cmd)
            result = subprocess.run(['xelatex', '-interaction=nonstopmode', 'main.tex'], **run_cmd)

            pdf_path = os.path.join(build_dir, 'main.pdf')
            
            if os.path.exists(pdf_path):
                relative_path = os.path.join('latex_temp', file_id, 'main.pdf')
                return relative_path, None
            else:
                return None, f"LaTeX Error:\n{result.stdout}"

        except subprocess.TimeoutExpired:
            return None, "Превышено время ожидания компиляции (80 сек)."
        except Exception as e:
            return None, str(e)

    # --- СЛУЖЕБНЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С S3 (Интеграция) ---

    def _find_image_blocks(self, blocks):
        images = []
        def walk(value):
            if isinstance(value, list):
                for item in value: walk(item)
            elif isinstance(value, dict):
                if value.get("type") == "image":
                    images.append(value)
                for child in value.values(): walk(child)
        walk(blocks)
        return images

    def _storage_name_from_url(self, url):
        if not url: return ""
        parsed = urlparse(url)
        path = unquote(parsed.path).lstrip("/")
        bucket = getattr(settings, "AWS_STORAGE_BUCKET_NAME", "")
        if bucket and path.startswith(f"{bucket}/"):
            path = path[len(bucket) + 1:]
        return path

    def _prepare_images_for_latex(self, blocks, temp_dir):
        """Скачивает изображения из S3 локально для компилятора"""
        prepared_blocks = copy.deepcopy(blocks)
        image_blocks = self._find_image_blocks(prepared_blocks)

        for index, block in enumerate(image_blocks, start=1):
            content = block.setdefault("content", {})
            
            # Определяем путь к файлу в хранилище
            source = content.get("image_path") or content.get("url") or content.get("src")
            storage_name = content.get("file") or self._storage_name_from_url(source)

            if not storage_name:
                continue

            ext = os.path.splitext(storage_name)[1] or ".png"
            local_name = f"img_{index}{ext}"
            local_path = os.path.join(temp_dir, local_name)

            try:
                # Скачиваем из MinIO/S3 во временную папку компиляции
                with default_storage.open(storage_name, "rb") as src:
                    with open(local_path, "wb") as dst:
                        dst.write(src.read())
                
                # ВАЖНО: Подменяем путь на локальный для шаблона .j2
                content["image_path"] = local_name
            except Exception as e:
                content["image_path"] = ""
                content["caption"] = f"Ошибка загрузки: {str(e)}"
        
        return prepared_blocks