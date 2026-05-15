FROM python:3.11-slim

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    # Устанавливаем XeTeX и поддержку кириллицы (~1 Гб)
    texlive-xetex \
    texlive-lang-cyrillic \
    texlive-fonts-recommended \
    texlive-plain-generic \
    # Пакеты для сложных таблиц и графики
    texlive-latex-extra \
    # Если будем использовать minted для листингов кода (нужен python-pygments)
    python3-pygments \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Устанавливаем зависимости Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Создаем папки для временных файлов LaTeX
RUN mkdir -p /app/temp_latex && chmod 777 /app/temp_latex

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]