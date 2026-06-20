from django.db import models
from django.conf import settings
from datetime import datetime

class Document(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='documents'
    )
    # Основное
    title = models.CharField("Тема работы", max_length=500)
    lab_number = models.IntegerField("Номер работы", default=1) 
    content_json = models.JSONField("Структура блоков", default=list)
    raw_latex = models.TextField("RAW код с маркерами", blank=True)
    
    # Данные титульного листа
    institute_name = models.CharField("Институт", max_length=255, default="ИНСТИТУТ КОСМИЧЕСКИХ И ИНФОРМАЦИОННЫХ ТЕХНОЛОГИЙ")
    chair_name = models.CharField("Кафедра", max_length=255, default="«ПРИКЛАДНАЯ ИТ»")
    
    # Зав. кафедрой
    chair_head_initials = models.CharField("Инициалы зав. каф.", max_length=10, default="И. И.")
    chair_head_surname = models.CharField("Фамилия зав. каф.", max_length=100, default="Иванов")
    
    # Код и название направления
    direction_code = models.CharField("Код направления", max_length=50, default="09.03.04")
    direction_name = models.CharField("Название направления", max_length=255, default="Программная инженерия")
    
    # Руководитель
    supervisor_initials = models.CharField("Инициалы рук.", max_length=10, blank=True)
    supervisor_surname = models.CharField("Фамилия рук.", max_length=100, blank=True)
    supervisor_degree = models.CharField("Степень рук.", max_length=255, blank=True)
    
    # Нормоконтролер
    controller_initials = models.CharField("Инициалы н/контр.", max_length=10, default="А. А.")
    controller_surname = models.CharField("Фамилия н/контр.", max_length=100, default="Петров")
    controller_degree = models.CharField("Степень н/контр.", max_length=255, default="канд. техн. наук, доцент")
    
    year = models.IntegerField("Год", default=datetime.now().year)
    
    COMPILATION_STATUS_CHOICES = [
        ("IDLE", "Ожидает компиляции"),
        ("PENDING", "В очереди"),
        ("RUNNING", "Компилируется"),
        ("SUCCESS", "Успешно"),
        ("ERROR", "Ошибка"),
    ]

    compilation_status = models.CharField(
        max_length=20,
        choices=COMPILATION_STATUS_CHOICES,
        default="IDLE",
    )
    compilation_task_id = models.CharField(max_length=255, blank=True)
    compilation_log = models.TextField(blank=True)
    pdf_file = models.CharField(max_length=500, blank=True)
    compiled_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} ({self.owner.username})"
    
class Template(models.Model):
    name = models.CharField("Название шаблона", max_length=255)
    description = models.TextField("Описание", blank=True)
    
    # "скелет" из блоков
    content_json = models.JSONField("Структура блоков по умолчанию", default=list)
    
    # Можно попробовать добавить картинку-превью, чтобы фронт её рисовал
    # preview_image = models.ImageField(upload_to='templates/', null=True, blank=True)

    def __str__(self):
        return self.name
