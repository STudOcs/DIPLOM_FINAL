from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from django.core.files.storage import default_storage
from django.http import FileResponse
from urllib.parse import quote
from django.http import HttpResponse

from .models import Document, Template
from .serializers import DocumentSerializer, TemplateSerializer
from .services import LatexService
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
        return Document.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        template_id = serializer.validated_data.pop("template_id", None)
        content_json = []

        if template_id:
            try:
                template = Template.objects.get(id=template_id)
                content_json = template.content_json
            except Template.DoesNotExist:
                pass

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
    
    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        document = self.get_object()

        if document.compilation_status != "SUCCESS" or not document.pdf_file:
            return Response({"error": "PDF ещё не готов"}, status=400)

        if not default_storage.exists(document.pdf_file):
            return Response({"error": "PDF не найден"}, status=404)

        with default_storage.open(document.pdf_file, "rb") as f:
            data = f.read()

        if not data.startswith(b"%PDF-") or b"%%EOF" not in data[-2048:]:
            return Response(
                {
                    "error": "Файл в хранилище повреждён или не является PDF",
                    "size": len(data),
                    "head": data[:20].decode("latin1", errors="replace"),
                    "tail": data[-80:].decode("latin1", errors="replace"),
                },
                status=500,
            )

        filename = f"{document.title or f'document_{document.id}'}.pdf"

        response = HttpResponse(data, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'inline; filename="document_{document.id}.pdf"; '
            f"filename*=UTF-8''{quote(filename)}"
        )
        response["Content-Length"] = str(len(data))

        return response

    @action(detail=True, methods=["get"], url_path="raw_code")
    def raw_code(self, request, pk=None):
        document = self.get_object()
        service = LatexService()
        code = service.get_raw_code(document)

        return Response({"raw_latex": code})

    @action(detail=True, methods=["post"], url_path="sync_code")
    def sync_code(self, request, pk=None):
        document = self.get_object()
        raw_latex = request.data.get("raw_latex")

        if not raw_latex:
            return Response(
                {"error": "No code provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = LatexService()
        document = service.sync_raw_to_json(document, raw_latex)
        document.save()

        serializer = self.get_serializer(document)
        return Response(serializer.data)