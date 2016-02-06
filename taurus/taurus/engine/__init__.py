import os
from pkg_resources import get_distribution

from nta.utils import logging_support_raw
from nta.utils.config import Config

import htmengine



# TODO: TAUR-1209 use __name__ or "taurus.engine"
distribution = get_distribution("taurus")

# See setup.py for constant
__version__ = distribution.version  # pylint: disable=E1101

TAURUS_HOME = distribution.location  # pylint: disable=E1101

logging_support = logging_support_raw  # pylint: disable=C0103
logging_support.setLogDir(os.environ.get("APPLICATION_LOG_DIR",
                                         os.path.join(TAURUS_HOME, "logs")))

config = htmengine.APP_CONFIG
