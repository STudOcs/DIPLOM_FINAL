import os
import logging
from celery import shared_task
from django.core.files.base import ContentFile
from django.db import transaction
from .models import Document, CompilationTask
from .services import LatexService

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=15)
def compile_document_task(self, document_id, compilation_task_id):
    """
    Асинхронная задача Celery для безопасной компиляции PDF-документа 
    с использованием XeLaTeX в изолированном воркере.
    """
    logger.info(f"Запуск компиляции для документа ID: {document_id}")
    
    try:
        comp_task = CompilationTask.objects.get(id=compilation_task_id)
        document = Document.objects.get(id=document_id)
        
        comp_task.status = CompilationTask.Status.PROCESSING
        comp_task.save()
    except (Document.DoesNotExist, CompilationTask.DoesNotExist) as e:
        logger.error(f"Ошибка инициализации задачи: {str(e)}")
        return False

    latex_service = LatexService()
    
    try:
        # 1. Запускаем рендеринг шаблона Jinja2 и компиляцию XeLaTeX
        # Метод возвращает путь к временному PDF и лог stdout компилятора
        pdf_temp_path, stdout_log = latex_service.generate_and_compile(document)
        
        # 2. Сохраняем сгенерированный PDF в S3-бакет MinIO через Django-storages
        with open(pdf_temp_path, 'rb') as pdf_file:
            # Использование транзакции гарантирует атомарность обновления
            with transaction.atomic():
                document.pdf_file.save(
                    f"{document.uuid}.pdf", 
                    ContentFile(pdf_file.read()), 
                    save=False
                )
                # Сохраняем сгенерированный код LaTeX в кэш для RAW-редактора
                document.raw_latex = latex_service.get_last_generated_latex()
                document.save()
        
        # 3. Обновляем статус задачи компиляции на успешный
        comp_task.status = CompilationTask.Status.SUCCESS
        comp_task.error_log = stdout_log  # Лог успешного прохода для отладки
        comp_task.save()
        
        logger.info(f"Документ {document_id} успешно скомпилирован.")
        return True

    except Exception as exc:
        logger.error(f"Сбой компиляции документа {document_id}: {str(exc)}")
        
        # 4. В случае ошибки фиксируем статус FAILURE и лог ошибок LaTeX
        comp_task.status = CompilationTask.Status.FAILURE
        # Перехватываем вывод компилятора (stdout/stderr) из исключения, если доступен
        comp_task.error_log = getattr(exc, 'output', str(exc))
        comp_task.save()
        
        # 5. Делаем попытку перезапуска задачи при временных сетевых или системных сбоях
        try:
            self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error(f"Превышено максимальное число попыток компиляции ID: {document_id}")
            
        return False