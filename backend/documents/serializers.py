from rest_framework import serializers
from .models import Document

class DocumentSerializer(serializers.ModelSerializer):
    owner = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Document
        fields = (
            'id', 'owner', 'title', 'lab_number', 'content_json', 'raw_latex',
            'institute_name', 'chair_name', 
            'chair_head_initials', 'chair_head_surname',
            'direction_code', 'direction_name',
            'supervisor_initials', 'supervisor_surname', 'supervisor_degree',
            'controller_initials', 'controller_surname', 'controller_degree',
            'year', 'updated_at'
        )
        read_only_fields = ('id', 'updated_at', 'raw_latex')
