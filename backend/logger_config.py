from loguru import logger 
import sys
def setup_logger():
    logger.remove()
    logger.add("logs/current_logs.log",level="INFO",rotation="50 MB", retention="10 days",compression="zip", filter=lambda record: record["level"].name == "INFO")
    logger.add(sys.stderr, DEBUG="INFO")
    logger.add("logs/error_logs.logs",level="ERROR" ,rotation="100 MB", retention="10 days" , compression="zip" )


