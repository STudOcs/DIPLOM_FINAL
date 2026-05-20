from django.db import models
from django.conf import settings


class Document(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="documents"
    )
    title = models.CharField("Название документа", max_length=255)

    # Поля для титульника (из твоей преамбулы)
    course_name = models.CharField("Дисциплина", max_length=255, blank=True)
    lab_number = models.IntegerField("Номер работы", default=1)
    record_book_number = models.CharField("№ зачетки", max_length=50, blank=True)

    # Основной контент в формате JSON (массив блоков)
    content_json = models.JSONField("Структура блоков", default=list)

    # Кеш для RAW LaTeX (код с маркерами для синхронизации)
    raw_latex = models.TextField("Сгенерированный код", blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def str(self):
        return self.title
