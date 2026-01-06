
import logging
import traceback
import os
from django.http import JsonResponse
from django.conf import settings

logger = logging.getLogger(__name__)

class ErrorTrappingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # DEBUG PRINT TO VERIFY MIDDLEWARE IS ALIVE
        print(f"DEBUG: ErrorTrappingMiddleware handling {request.path} | X-Tenant: {request.headers.get('X-Tenant')}")
        try:
            response = self.get_response(request)
            return response
        except Exception as e:
            # Log to console
            logger.error("!!! TRAPPED EXCEPTION IN ErrorTrappingMiddleware !!!")
            logger.error(f"Request Path: {request.path}")
            logger.error(f"Error: {str(e)}")
            tb = traceback.format_exc()
            logger.error(tb)
            
            # Log to file
            try:
                log_file = os.path.join(settings.BASE_DIR, 'critical_error_log.txt')
                with open(log_file, 'a', encoding='utf-8') as f:
                    f.write(f"\n{'='*50}\n")
                    f.write(f"TIMESTAMP: {logging.Formatter('%(asctime)s').format(logging.LogRecord('', 0, '', 0, '', None, None))}\n")
                    f.write(f"PATH: {request.path}\n")
                    f.write(f"ERROR: {str(e)}\n\n")
                    f.write(tb)
                    f.write(f"\n{'='*50}\n")
            except:
                pass

            # Always return JSON for API paths
            if request.path.startswith('/api/'):
                return JsonResponse({
                    'error': 'Trapped Internal Server Error',
                    'detail': str(e),
                    'path': request.path
                }, status=500)
            
            # Re-raise for non-API paths if we want standard behavior
            raise e
