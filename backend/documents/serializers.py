from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    owner = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Document
        fields = (
            "id",
            "owner",
            "title",
            "course_name",
            "lab_number",
            "record_book_number",
            "content_json",
            "raw_latex",
            "updated_at",
        )
        read_only_fields = ("id", "updated_at", "raw_latex")
