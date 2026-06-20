from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from .models import Document, Template
from .serializers import DocumentSerializer, TemplateSerializer
from .services import LatexService


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
        print(f"DEBUG: Compiling document ID: {document.id}")
        
        service = LatexService()

        # Генерируем PDF
        pdf_relative_path, error_log = service.compile_pdf(document)

        if pdf_relative_path:
            # Ссылка на файл для фронтенда
            pdf_url = request.build_absolute_uri(settings.MEDIA_URL + pdf_relative_path)
            return Response({"status": "success", "pdf_url": pdf_url})
        else:
            return Response({"status": "error", "log": error_log}, status=400)
    
    @action(detail=True, methods=['get'])
    def raw_code(self, request, pk=None):
        document = self.get_object()
        service = LatexService()
        code = service.get_raw_code(document)
        return Response({"raw_latex": code})

    @action(detail=True, methods=['post'])
    def sync_code(self, request, pk=None):
        document = self.get_object()
        raw_latex = request.data.get('raw_latex')
        
        if not raw_latex:
            return Response({"error": "No code provided"}, status=400)
            
        service = LatexService()
        # Синхронизируем
        document = service.sync_raw_to_json(document, raw_latex)
        document.save()
        
        # Возвращаем обновленный JSON-документа, чтобы фронт обновил блоки
        serializer = self.get_serializer(document)
        return Response(serializer.data)
