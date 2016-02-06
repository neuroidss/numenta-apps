import os
from functools import wraps
from pkg_resources import get_distribution

from nta.utils.config import Config

from htmengine.exceptions import ApplicationNotConfiguredError



distribution = get_distribution(__name__)



__version__ = distribution.version # See setup.py for constant



HTMENGINE_HOME = distribution.location


_APPLICATION_CONFIG_PATH_ENV_VAR = "APPLICATION_CONFIG_PATH"


def raiseExceptionOnMissingRequiredApplicationConfigPath(fn):
  """ Decorator to explicitly raise an ApplicationNotConfiguredError exception
  in the event that the required APPLICATION_CONFIG_PATH environment variable
  is not set.

  :param fn: Function
  :returns: Wrapped function
  """
  @wraps(fn)
  def wrapper(*args, **kwargs):
    if _APPLICATION_CONFIG_PATH_ENV_VAR not in os.environ:
      raise ApplicationNotConfiguredError(
        "Required `{}` not set in environment.  See {} for details".format(
          _APPLICATION_CONFIG_PATH_ENV_VAR,
          os.path.join(HTMENGINE_HOME, "README.md")))

    return fn(*args, **kwargs)

  return wrapper



# The htmengine client application's configuration that includes htmengine
# configuration values
APP_CONFIG = raiseExceptionOnMissingRequiredApplicationConfigPath(Config)(
  "application.conf",
  os.environ.get(_APPLICATION_CONFIG_PATH_ENV_VAR))
