from loguru import logger 
import sys
def setup_logger():
    logger.remove()
    logger.add("logs/log.log",level="INFO",rotation="50 MB", retention="10 days",compression="zip")
    logger.add(sys.stderr, level="DEBUG")
    logger.add("logs/errors.log",level="ERROR" ,rotation="100 MB", retention="10 days" , compression="zip" )


