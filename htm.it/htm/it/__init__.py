import os
from pkg_resources import resource_filename

from htm.it import __version__
from nta.utils import logging_support_raw



# Needed for nta.utils setup
APP_HOME = os.path.abspath(resource_filename("htm.it", os.path.pardir))
CONF_DIR = os.environ.get("APPLICATION_CONFIG_PATH", os.path.join(APP_HOME,
                                                                  "conf"))

logging_support = logging_support_raw
logging_support.setLogDir(os.environ.get("HTM_IT_LOG_DIR",
                          os.path.join(APP_HOME, "logs")))

