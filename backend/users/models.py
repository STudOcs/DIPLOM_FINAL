from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Добавляем поля для СФУ
    middle_name = models.CharField("Отчество", max_length=150, blank=True)
    student_group = models.CharField("Группа", max_length=20, blank=True)
    student_card = models.CharField("Номер зачетки", max_length=50, blank=True)
    department = models.CharField("Кафедра", max_length=255, blank=True)
    
    # Сделаем email обязательным
    email = models.EmailField("Email", unique=True)

    USERNAME_FIELD = 'email'      
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    def __str__(self):
        return f"{self.last_name} {self.first_name} ({self.student_group})"