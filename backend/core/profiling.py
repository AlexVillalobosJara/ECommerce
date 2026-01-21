import time
import logging
from contextlib import contextmanager

logger = logging.getLogger(__name__)

@contextmanager
def profile_block(name):
    start = time.time()
    try:
        yield
    finally:
        end = time.time()
        duration = end - start
        logger.info(f"[PERFORMANCE] {name} took {duration:.4f} seconds")
