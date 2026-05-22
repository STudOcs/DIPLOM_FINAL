import os
import subprocess
import uuid
from jinja2 import Environment, FileSystemLoader
from django.conf import settings
from django.utils import timezone

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

    def render_to_string(self, document):
        """Собирает полный код документа из JSON-блоков"""
        
        # 1. Рендер титуль листа
        title_template = self.env.get_template('title.tex')
        title_page_content = title_template.render(doc=document, user=document.owner)

        # 2. Рендер контент блоков
        blocks_tex = []
        for index, block in enumerate(document.content_json):
            try:
                block_template = self.env.get_template(f"blocks/{block['type']}.tex")
                ctx = {
                    'block_id': block.get('id', str(uuid.uuid4())[:8]),
                    **block.get('content', {})
                }
                # Экранирование текста в текстовых блоках
                if block['type'] == 'text' and 'text' in ctx:
                    ctx['text'] = self.escape_latex(ctx['text'])
                
                blocks_tex.append(block_template.render(**ctx))
            except Exception as e:
                blocks_tex.append(f"\n% Ошибка рендеринга блока {block['type']}: {str(e)}\n")

        # 3. Собираем всё в основной каркас base.tex
        base_template = self.env.get_template('base.tex')
        full_latex = base_template.render(
            title_page_content=title_page_content,
            blocks_content="\n".join(blocks_tex),
            doc=document
        )
        
        return full_latex

    def compile_pdf(self, document):
        """Процесс компиляции .tex -> .pdf"""
        latex_code = self.render_to_string(document)
        
        # Генерируем уникальное имя файла
        file_id = f"doc_{document.id}_{uuid.uuid4().hex[:6]}"
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'latex_temp', file_id)
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