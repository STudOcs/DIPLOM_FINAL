import os
import subprocess
import uuid
import shutil
import copy
import re
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
        """Превращает JSON-блоки в одну строку LaTeX кода с МАРКЕРАМИ"""
        blocks_tex = []
        source_blocks = blocks if blocks is not None else document.content_json
        
        if not source_blocks:
            return ""

        for index, block in enumerate(source_blocks):
            try:
                b_type = block.get('type')
                b_id = block.get('id', f"auto_{index}")
                
                template_name = f"blocks/{b_type}.j2"
                # Копируем контент, чтобы не мутировать исходный JSON
                block_content = copy.deepcopy(block.get('content', {}))
                
                # --- ЛОГИКА ДЛЯ КАРТИНОК В RAW РЕДАКТОРЕ ---
                if b_type == 'image' and not block_content.get('image_path'):
                    storage_path = (
                        block_content.get('storage_path')
                        or block_content.get('file')
                        or ""
                    )

                    img_url = block_content.get('url') or block_content.get('src') or ""

                    if storage_path:
                        block_content['image_path'] = storage_path
                    elif img_url:
                        block_content['image_path'] = os.path.basename(
                            urlparse(img_url).path
                        )
                    else:
                        block_content['image_path'] = "placeholder.png"
                
                if b_type == 'table':
                    rows = block_content.get('rows') or []

                    escaped_rows = []
                    for row in rows:
                        escaped_rows.append([
                            self.escape_latex(str(cell)) for cell in row
                        ])

                    column_count = max(
                        [len(row) for row in escaped_rows],
                        default=2,
                    )

                    if not block_content.get('column_spec'):
                        block_content['column_spec'] = (
                            "|" + "|".join(["X"] * column_count) + "|"
                        )

                    if escaped_rows:
                        block_content['header_row'] = " & ".join(escaped_rows[0])

                        if len(escaped_rows) > 1:
                            body_parts = [
                                " & ".join(row) for row in escaped_rows[1:]
                            ]
                            block_content['body_rows'] = (
                                " \\\\\n        ".join(body_parts) + " \\\\"
                            )
                        else:
                            block_content['body_rows'] = ""
                    else:
                        block_content['header_row'] = ""
                        block_content['body_rows'] = ""

                if b_type == 'list':
                    raw_items = block_content.get('items', [])

                    block_content['items'] = [
                        self.escape_latex(str(item)) for item in raw_items
                    ]

                    block_content['environment'] = (
                        'enumerate' if block_content.get('ordered') else 'itemize'
                    )

                ctx = {
                    'block_id': b_id,
                    **block_content
                }

                if b_type == 'text' and 'text' in ctx:
                    ctx['text'] = self.escape_latex(ctx['text'])

                # Рендерим
                rendered_content = self.env.get_template(template_name).render(**ctx)

                block_with_markers = (
                    f"\n% [BLOCK_ID:{b_id}:TYPE:{b_type}]\n"
                    f"{rendered_content}"
                    f"\n% [BLOCK_END:{b_id}]\n"
                )
                blocks_tex.append(block_with_markers)
                
            except Exception as e:
                blocks_tex.append(f"\n% Ошибка рендеринга блока {block.get('type', 'unknown')}: {str(e)}\n")
        
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

            if not os.path.exists(pdf_path):
                return None, f"LaTeX Error:\n{result.stdout}\n{result.stderr}"

            if os.path.getsize(pdf_path) == 0:
                return None, f"LaTeX создал пустой PDF:\n{result.stdout}\n{result.stderr}"

            with open(pdf_path, "rb") as pdf_check:
                header = pdf_check.read(5)

            if header != b"%PDF-":
                return None, f"LaTeX создал некорректный PDF:\n{result.stdout}\n{result.stderr}"

            if not os.path.exists(pdf_path):
                return None, f"LaTeX Error:\n{result.stdout}\n{result.stderr}"

            with open(pdf_path, "rb") as f:
                pdf_data = f.read()

            if not pdf_data.startswith(b"%PDF-") or b"%%EOF" not in pdf_data[-2048:]:
                return None, (
                    "LaTeX создал повреждённый PDF\n\n"
                    f"STDOUT:\n{result.stdout}\n\n"
                    f"STDERR:\n{result.stderr}"
    )

            relative_path = os.path.join('latex_temp', file_id, 'main.pdf')
            return relative_path, None

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

    def _storage_name_from_url(self, value):
        if not value:
            return ""

        value = str(value).strip()

        if value.startswith("http://") or value.startswith("https://"):
            parsed = urlparse(value)
            path = parsed.path.lstrip("/")

            bucket_name = getattr(settings, "AWS_STORAGE_BUCKET_NAME", "")

            if bucket_name and path.startswith(f"{bucket_name}/"):
                path = path[len(bucket_name) + 1:]

            return path

        return value.lstrip("/")

    def _prepare_images_for_latex(self, content_json, build_dir):
        prepared_blocks = copy.deepcopy(content_json or [])
        image_index = 1

        for block in self._find_image_blocks(prepared_blocks):
            content = block.get("content", {})

            image_ref = (
                content.get("storage_path")
                or content.get("file")
                or content.get("image_path")
                or content.get("url")
                or content.get("src")
            )

            storage_name = self._storage_name_from_url(image_ref)

            if not storage_name:
                continue

            _, ext = os.path.splitext(storage_name)
            ext = ext or ".png"

            local_name = f"img_{image_index}{ext}"
            local_path = os.path.join(build_dir, local_name)

            try:
                with default_storage.open(storage_name, "rb") as src:
                    with open(local_path, "wb") as dst:
                        shutil.copyfileobj(src, dst)

                content["image_path"] = local_name
                content["file"] = local_name
                content["storage_path"] = storage_name

                block["content"] = content
                image_index += 1

            except Exception as exc:
                raise RuntimeError(
                    f"Не удалось подготовить изображение {storage_name}: {exc}"
                )

        return prepared_blocks
    
    def sync_raw_to_json(self, document, full_raw_latex):
        """
        Принимает полную строку LaTeX и обновляет контент блоков в document.content_json
        """
        pattern = r'% \[BLOCK_ID:(?P<id>.*?):TYPE:(?P<type>.*?)\](?P<inner_content>.*?)% \[BLOCK_END:(?P=id)\]'
        matches = re.finditer(pattern, full_raw_latex, re.DOTALL)
        
        # Создаем словарь существующих блоков для быстрого доступа (чтобы сохранить S3 пути)
        existing_blocks = {str(b['id']): b for b in document.content_json}
        updated_blocks = []
        
        for match in matches:
            b_id = match.group('id')
            b_type = match.group('type')
            inner = match.group('inner_content').strip()
            
            # Достаем старый контент блока (если он был), чтобы не потерять ссылки на S3
            old_block = existing_blocks.get(b_id, {})
            old_content = old_block.get('content', {})
            
            # Вызываем парсер конкретного контента
            block_content = self._parse_block_content(b_type, inner, old_content)
            
            updated_blocks.append({
                "id": b_id,
                "type": b_type,
                "content": block_content
            })
            
        document.content_json = updated_blocks
        return document

    def _parse_block_content(self, b_type, inner, old_content):
        """
        Разбирает внутренний код LaTeX для конкретного типа блока.
        old_content нужен для сохранения путей к файлам, которые нельзя менять из кода.
        """
        if b_type == 'text':
            return {"text": self.unescape_latex(inner).strip()}
            
        elif b_type == 'heading':
            cleaned_inner = re.sub(
                r'\\addcontentsline\s*{toc}\s*{chapter}\s*{.*?}',
                '',
                inner,
                flags=re.DOTALL,
            ).strip()

            kind = "numbered"
            level = 1
            match = None

            if r'\chapter*' in cleaned_inner:
                kind = "structural"
                level = 1
                match = re.search(
                    r'\\chapter\*\s*{(.*?)}',
                    cleaned_inner,
                    re.DOTALL,
                )
            elif r'\subsubsection' in cleaned_inner:
                level = 4
                match = re.search(
                    r'\\subsubsection\s*{(.*?)}',
                    cleaned_inner,
                    re.DOTALL,
                )
            elif r'\subsection' in cleaned_inner:
                level = 3
                match = re.search(
                    r'\\subsection\s*{(.*?)}',
                    cleaned_inner,
                    re.DOTALL,
                )
            elif r'\section' in cleaned_inner:
                level = 2
                match = re.search(
                    r'\\section\s*{(.*?)}',
                    cleaned_inner,
                    re.DOTALL,
                )
            elif r'\chapter' in cleaned_inner:
                level = 1
                match = re.search(
                    r'\\chapter\s*{(.*?)}',
                    cleaned_inner,
                    re.DOTALL,
                )

            text = match.group(1).strip() if match else cleaned_inner.strip()

            return {
                "text": self.unescape_latex(text),
                "level": level,
                "kind": kind,
            }

        elif b_type == 'image':
            width_match = re.search(r'width\s*=\s*([\d.]+)', inner)
            caption_match = re.search(
                r'\\caption\s*{(.*?)}',
                inner,
                re.DOTALL,
            )

            return {
                "url": old_content.get("url", ""),
                "src": old_content.get("src", old_content.get("url", "")),
                "file": old_content.get("file", ""),
                "storage_path": old_content.get("storage_path", ""),
                "image_path": old_content.get("image_path", ""),
                "caption": self.unescape_latex(
                    caption_match.group(1).strip()
                ) if caption_match else old_content.get("caption", ""),
                "width": float(width_match.group(1))
                if width_match
                else old_content.get("width", 0.8),
            }

        elif b_type == 'table':
            caption_match = re.search(
                r'\\caption\s*{(.*?)}',
                inner,
                re.DOTALL,
            )

            col_spec_match = re.search(
                r'\\begin{tabularx}\s*{.*?}\s*{(.*?)}',
                inner,
                re.DOTALL,
            )

            content_match = re.search(
                r'\\toprule(.*?)\\bottomrule',
                inner,
                re.DOTALL,
            )

            rows = []

            if content_match:
                raw_content = content_match.group(1)

                raw_content = raw_content.replace(r'\midrule', '')
                raw_content = raw_content.replace(r'\toprule', '')
                raw_content = raw_content.replace(r'\bottomrule', '')

                raw_rows = [
                    row.strip()
                    for row in raw_content.split(r'\\')
                    if row.strip()
                ]

                for row in raw_rows:
                    cells = [
                        self.unescape_latex(cell.strip())
                        for cell in re.split(r'(?<!\\)&', row)
                    ]

                    if cells:
                        rows.append(cells)

            return {
                "caption": self.unescape_latex(
                    caption_match.group(1).strip()
                ) if caption_match else old_content.get("caption", "Название таблицы"),
                "column_spec": col_spec_match.group(1).strip()
                if col_spec_match
                else old_content.get("column_spec", "|X|X|"),
                "rows": rows,
            }
        
        elif b_type == 'list':
            env_match = re.search(
                r'\\begin{(enumerate|itemize)}(.*?)\\end{\1}',
                inner,
                re.DOTALL,
            )

            if not env_match:
                return old_content if old_content else {
                    "ordered": False,
                    "items": [],
                }

            environment = env_match.group(1)
            list_body = env_match.group(2)

            raw_items = re.findall(
                r'\\item\s+(.*?)(?=\\item|$)',
                list_body,
                re.DOTALL,
            )

            items = [
                self.unescape_latex(item).strip()
                for item in raw_items
                if item.strip()
            ]

            return {
                "ordered": environment == "enumerate",
                "items": items,
            }

        # Для блоков, которые мы еще не реализовали (таблицы и т.д.)
        return old_content if old_content else {"raw_inner": inner}

    def unescape_latex(self, text):
        """Обратное превращение спецсимволов LaTeX в обычные (для текста)"""
        conv = {
            r'\&': '&', r'\%': '%', r'\$': '$', r'\#': '#', r'\_': '_',
            r'\{': '{', r'\}': '}', r'\textasciitilde{}': '~',
            r'\textasciicircum{}': '^', r'\textbackslash{}': '\\',
        }
        # Сортируем ключи по длине, чтобы сначала заменять длинные (типа \textbackslash)
        for key in sorted(conv.keys(), key=len, reverse=True):
            text = text.replace(key, conv[key])
        return text

    def render_to_string(self, document, blocks=None):
        """Собирает весь проект в одну строку для RAW-редактора или отладки"""
        # 1. Рендерим блоки (используем переданные или из документа)
        blocks_content = self.render_blocks(document, blocks=blocks) or ""

        # 2. Рендерим титульный лист
        title_template = self.env.get_template('vkr_sfu/title.j2')
        title_page_code = title_template.render(doc=document, user=document.owner)

        # 3. Сборка финального кода
        main_template = self.env.get_template('vkr_sfu/main.j2')
        full_code = main_template.render(
            doc=document,
            user=document.owner,
            blocks_content=blocks_content,
            title_page_content=title_page_code
        )
        
        if r'\input{title.tex}' in full_code:
            full_code = full_code.replace(r'\input{title.tex}', title_page_code)
            
        return full_code

    def get_raw_code(self, document):
        """Возвращает полную строку LaTeX кода для RAW-редактора"""
        return self.render_to_string(document)