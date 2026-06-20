from rest_framework import serializers
from .models import Document, Template


class DocumentSerializer(serializers.ModelSerializer):
    owner = serializers.HiddenField(default=serializers.CurrentUserDefault())
    template_id = serializers.IntegerField(
        write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Document
        fields = (
            "id",
            "owner",
            "title",
            "template_id",
            "lab_number",
            "content_json",
            "raw_latex",
            "institute_name",
            "chair_name",
            "chair_head_initials",
            "chair_head_surname",
            "direction_code",
            "direction_name",
            "supervisor_initials",
            "supervisor_surname",
            "supervisor_degree",
            "controller_initials",
            "controller_surname",
            "controller_degree",
            "year",
            "updated_at",
            "compilation_status",
            "compilation_task_id",
            "compilation_log",
            "pdf_file",
            "compiled_at",
        )
        read_only_fields = (
            "id",
            "updated_at",
            "raw_latex",
            "compilation_status",
            "compilation_task_id",
            "compilation_log",
            "pdf_file",
            "compiled_at",
        )


class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ("id", "name", "description", "content_json")
