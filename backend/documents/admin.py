from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    # Убираем 'template', так как этого поля нет в модели Document
    list_display = ("title", "owner", "lab_number", "updated_at")
    search_fields = ("title", "owner__username")
    # Оставляем только те поля, которые реально есть в models.py
    list_filter = ("created_at", "updated_at")
