import os
import uuid

from celery import shared_task
from django.conf import settings
from django.core.files.base import File
from django.core.files.storage import default_storage
from django.utils import timezone

from .models import Document
from .services import LatexService


@shared_task(bind=True)
def compile_pdf_task(self, document_id: int):
    document = Document.objects.get(id=document_id)

    document.compilation_status = "RUNNING"
    document.compilation_log = ""
    document.save(update_fields=["compilation_status", "compilation_log", "updated_at"])

    service = LatexService()
    pdf_relative_path, error_log = service.compile_pdf(document)

    if not pdf_relative_path:
        document.compilation_status = "ERROR"
        document.compilation_log = error_log or "Неизвестная ошибка компиляции"
        document.save(update_fields=["compilation_status", "compilation_log", "updated_at"])
        return {"status": "ERROR", "log": document.compilation_log}

    local_pdf_path = os.path.join(settings.MEDIA_ROOT, pdf_relative_path)

    storage_pdf_path = f"pdf/{document.owner_id}/{document.id}/{uuid.uuid4().hex}.pdf"

    with open(local_pdf_path, "rb") as pdf:
        saved_path = default_storage.save(storage_pdf_path, File(pdf))

    document.compilation_status = "SUCCESS"
    document.compilation_log = ""
    document.pdf_file = saved_path
    document.compiled_at = timezone.now()
    document.save(
        update_fields=[
            "compilation_status",
            "compilation_log",
            "pdf_file",
            "compiled_at",
            "updated_at",
        ]
    )

    return {
        "status": "SUCCESS",
        "pdf_file": saved_path,
    }