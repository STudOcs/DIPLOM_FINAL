FROM python:3.11-slim

# 1. Включаем репозиторий contrib (нужен для шрифтов Microsoft)
# Проверяем оба варианта расположения конфигов (для разных версий Debian)
RUN if [ -f /etc/apt/sources.list ]; then \
        sed -i 's/main$/main contrib/g' /etc/apt/sources.list; \
    fi && \
    if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
        sed -i 's/Components: main/Components: main contrib/g' /etc/apt/sources.list.d/debian.sources; \
    fi

# 2. Обновляем списки и ставим зависимости
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    texlive-xetex \
    texlive-lang-cyrillic \
    texlive-fonts-recommended \
    texlive-plain-generic \
    texlive-latex-extra \
    texlive-bibtex-extra \
    biber \
    python3-pygments \
    fontconfig \
    # Автоматическое принятие лицензии MS
    && echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections \
    && apt-get install -y --no-install-recommends ttf-mscorefonts-installer \
    && fc-cache -f -v \
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