from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from .models import Document, Template
from .serializers import DocumentSerializer, TemplateSerializer
from .services import LatexService
from django.core.files.storage import default_storage
from .tasks import compile_pdf_task

class TemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Эндпоинт для получения списка доступных шаблонов (только чтение)
    GET /api/v1/templates/
    """

    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
    permission_classes = [permissions.IsAuthenticated]


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Пользователь видит только свои документы
        return Document.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        # 1. Смотрим, прислал ли фронт template_id
        template_id = serializer.validated_data.pop('template_id', None)
        content_json = []

        if template_id:
            try:
                template = Template.objects.get(id=template_id)
                content_json = template.content_json
            except Template.DoesNotExist:
                pass

        # 4. Сохраняем документ, принудительно подставляя владельца и контент
        serializer.save(owner=self.request.user, content_json=content_json)

    @action(detail=True, methods=["post"])
    def compile(self, request, pk=None):
        document = self.get_object()

        task = compile_pdf_task.delay(document.id)

        document.compilation_status = "PENDING"
        document.compilation_task_id = task.id
        document.compilation_log = ""
        document.save(
            update_fields=[
                "compilation_status",
                "compilation_task_id",
                "compilation_log",
                "updated_at",
            ]
        )

        return Response(
            {
                "status": "PENDING",
                "task_id": task.id,
                "document_id": document.id,
            },
            status=status.HTTP_202_ACCEPTED,
        )
    
    @action(detail=True, methods=["get"], url_path="status")
    def compile_status(self, request, pk=None):
        document = self.get_object()

        pdf_url = None
        if document.pdf_file:
            pdf_url = None
            if document.pdf_file:
                pdf_url = default_storage.url(document.pdf_file)

                internal = getattr(settings, "AWS_S3_ENDPOINT_URL", "")
                public = getattr(settings, "AWS_S3_PUBLIC_ENDPOINT_URL", internal)

                if internal and public and pdf_url.startswith(internal):
                    pdf_url = pdf_url.replace(internal, public, 1)

        return Response(
            {
                "document_id": document.id,
                "status": document.compilation_status,
                "task_id": document.compilation_task_id,
                "log": document.compilation_log,
                "pdf_url": pdf_url,
                "compiled_at": document.compiled_at,
            }
        )
