import os
import subprocess
import uuid
import shutil
from jinja2 import Environment, FileSystemLoader
from django.conf import settings

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

    def render_blocks(self, document):
        """Превращает JSON-блоки в одну строку LaTeX кода"""
        blocks_tex = []
        for index, block in enumerate(document.content_json):
            try:
                # Ищем шаблон в папке blocks/
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
                blocks_tex.append(f"\n% Ошибка блока {block['type']}: {str(e)}\n")
        
        return "\n".join(blocks_tex)

    def compile_pdf(self, document):
        """Сборка многофайлового проекта ВКР"""
        # 1. Подготовка путей
        file_id = f"doc_{document.id}_{uuid.uuid4().hex[:6]}"
        build_dir = os.path.join(settings.MEDIA_ROOT, 'latex_temp', file_id)
        os.makedirs(build_dir, exist_ok=True)

        vkr_tpl_path = os.path.join(self.template_base_path, 'vkr_sfu')

        # 2. Копируем статические файлы (.tex и .bib)
        static_files = ['common.tex', 'dop.tex', 'mybibliography.bib']
        for f_name in static_files:
            src = os.path.join(vkr_tpl_path, f_name)
            if os.path.exists(src):
                shutil.copy(src, build_dir)

        # 2. Список ДИНАМИЧНЫХ файлов (рендерим через Jinja)
        # Мы убрали task, plan, referate из этого списка
        dynamic_parts = ['title.j2', 'main.j2']
        
        context = {
            'doc': document,
            'user': document.owner,
            'blocks_content': self.render_blocks(document)
        }

        for tpl_name in dynamic_parts:
            content = self.env.get_template(f"vkr_sfu/{tpl_name}").render(**context)
            target_name = tpl_name.replace('.j2', '.tex')
            with open(os.path.join(build_dir, target_name), 'w', encoding='utf-8') as f:
                f.write(content)

        # 4. Процесс компиляции (XeLaTeX -> Biber -> XeLaTeX x2)
        try:
            run_cmd = {
                'cwd': build_dir,
                'capture_output': True,
                'text': True,
                'timeout': 60
            }

            # ПОСЛЕДОВАТЕЛЬНОСТЬ ДЛЯ ВКР СФУ:
            # 1. XeLaTeX (создает список цитат для бибера)
            subprocess.run(['xelatex', '-interaction=nonstopmode', 'main.tex'], **run_cmd)
            
            # 2. Biber (собирает список литературы)
            subprocess.run(['biber', 'main'], **run_cmd)
            
            # 3. XeLaTeX (вставляет литературу)
            subprocess.run(['xelatex', '-interaction=nonstopmode', 'main.tex'], **run_cmd)
            
            # 4. XeLaTeX (финализирует оглавление и номера страниц)
            result = subprocess.run(['xelatex', '-interaction=nonstopmode', 'main.tex'], **run_cmd)

            pdf_path = os.path.join(build_dir, 'main.pdf')
            
            if os.path.exists(pdf_path):
                relative_path = os.path.join('latex_temp', file_id, 'main.pdf')
                return relative_path, None
            else:
                return None, f"LaTeX Error:\n{result.stdout}"

        except subprocess.TimeoutExpired:
            return None, "Превышено время ожидания компиляции (60 сек)."
        except Exception as e:
            return None, str(e)