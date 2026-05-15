from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    # Добавляем наши поля в интерфейс админки
    # fieldsets — это то, как поля разбиты по блокам при редактировании
    fieldsets = UserAdmin.fieldsets + (
        ('Дополнительная информация СФУ', {'fields': ('middle_name', 'student_group')}),
    )
    # add_fieldsets — это поля при создании пользователя через админку
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Дополнительная информация СФУ', {'fields': ('middle_name', 'student_group')}),
    )
    # Что отображать в списке пользователей
    list_display = ['username', 'email', 'last_name', 'first_name', 'student_group', 'is_staff']

# Регистрируем модель
admin.site.register(User, CustomUserAdmin)