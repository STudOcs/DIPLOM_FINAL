from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'lab_number', 'year', 'updated_at')
    
    fieldsets = (
        (None, {'fields': ('owner', 'title', 'lab_number', 'content_json', 'raw_latex')}),
        ('Титульный лист', {'fields': (
            'institute_name', 'chair_name', 
            ('chair_head_initials', 'chair_head_surname'),
            ('direction_code', 'direction_name'),
            'year'
        )}),
        ('Проверка', {'fields': (
            ('supervisor_initials', 'supervisor_surname', 'supervisor_degree'),
            ('controller_initials', 'controller_surname', 'controller_degree'),
        )}),
    )