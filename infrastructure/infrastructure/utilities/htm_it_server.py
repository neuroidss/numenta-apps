# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
# Numenta, Inc. a separate commercial license for this software code, the
# following terms and conditions apply:
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero Public License version 3 as
# published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU Affero Public License for more details.
#
# You should have received a copy of the GNU Affero Public License
# along with this program.  If not, see http://www.gnu.org/licenses.
#
# http://numenta.org/licenses/
# ----------------------------------------------------------------------

from time import sleep

from fabric.api import run, settings
from grokcli.api import GrokSession

from infrastructure.utilities.exceptions import (
  HTMITConfigError,
  InstanceLaunchError,
  InstanceNotReadyError)

HTM_IT_AWS_CREDENTIALS_SETUP_TRIES = 30
MAX_RETRIES_FOR_READY = 18
SLEEP_DELAY = 10



def checkHTMITServicesStatus(logger):
  """
    Checks to see if all HTM-IT Services are running. Returns True
    if all Services are running and False if any are not running.
    This should be wrapped in retry logic with error handling.

    :param logger: Initialized logger

    :raises: infrastructure.utilities.exceptions.InstanceLaunchError
      If a HTM-IT service fails to startup.

    :returns: True if HTM-ITServices are running properly.
    :rtype: boolean
  """
  cmd = ("source /etc/htm.it/supervisord.vars && "
         "supervisorctl -c /opt/numenta/htm.it/conf/supervisord.conf status")
  htmItServicesState = run(cmd)

  for service in htmItServicesState.split("\r\n"):
    if set(["FATAL", "EXITED"]) & set(service.split(" ")):
      raise InstanceLaunchError("Some HTM-IT services failed to start:\r\n%s" %
                                htmItServicesState.stdout)
    elif set(["STOPPED", "STARTING", "UNKNOWN"]) & set(service.split(" ")):
      logger.debug("Some HTM-IT services are not yet ready: \r\n %s" %
                   htmItServicesState.stdout)
      break
  else:
    return True
  return False


def checkNginxStatus(logger):
  """
    Checks to see if Nginx is running for HTM-IT. Returns True if
    it is and False otherwise. This should be wrapped in retry logic
    with error handling.

    :param logger: Initialized logger

    :raises: infrastructure.utilities.exceptions.InstanceLaunchError
      If Nginx starts up using the error configuration.

    :returns: True if Nginx is running using the correct conf file for HTM-IT.
    :rtype: boolean
  """
  output = run("ps aux | grep -e nginx -e htm-it-api.conf | grep -v grep")

  # If nginx launches with our error config, raise an exception
  if "htm-it-error.conf" in output.stdout:
    raise InstanceLaunchError("Nginx launched in Error state: \r\n %s" %
                              output.stdout)
  # Else if we're still stopped or currently loading HTM-IT, just
  # log a debug msg
  elif ("htm-it-loading.conf" in output.stdout or
        "htm-it-stopped.conf" in output.stdout):
    logger.debug("Nginx has not yet finished loading: \r\n %s" % output.stdout)


  return "htm-it-api.conf" in output.stdout


def waitForHtmItServerToBeReady(publicDnsName, serverKey, user, logger):
  """
    Wait for a pre-determined amount of time for the HTM-IT server to be ready.

    :param publicDnsName: Reachable DNS entry of a HTM-IT server

    :param serverKey: SSH Key to use to connect to the instance

    :param user: Username to use when connecting via SSH (e.g.: ec2-user)

    :param logger: Initialized logger

    :raises infrastructure.utilities.exceptions.InstanceNotReadyError:
      If either HTM-IT or Nginx fails to come up properly in the
      prescribed time.

    :raises infrastructure.utilities.exceptions.InstanceLaunchError:
      If a HTM-IT service fails to startup.
  """
  nginx = htmItServices = False
  with settings(host_string = publicDnsName,
                key_filename = serverKey, user = user,
                connection_attempts = 30, warn_only = True):
    for _ in xrange(MAX_RETRIES_FOR_READY):
      logger.info("Checking to see if nginx and HTM-IT Services are running")
      try:
        nginx = checkNginxStatus(logger)
        htmItServices = checkHTMITServicesStatus(logger)
      except EOFError:
        # If SSH hasn't started completely on the remote system, we may get an
        # EOFError trying to provide a password for the user. Instead, just log
        # a warning and continue to retry
        logger.warning("SSH hasn't started completely on the remote machine")
      if nginx and htmItServices:
        break
      sleep(SLEEP_DELAY)
    else:
      raise InstanceNotReadyError("HTM-IT services not ready on server %s after"
                                  " %d seconds." % (publicDnsName,
                                                    MAX_RETRIES_FOR_READY *
                                                    SLEEP_DELAY))


def setupHTMITAWSCredentials(publicDnsName, config):
  """
    Using the HTM-IT CLI, connect to HTM-IT to obtain the API Key
    for the instance.

    :param publicDnsName: A reachable DNS entry for the HTM-IT
      server that needs to be configured

    :param config: A dict containing values for `AWS_ACCESS_KEY_ID`
      and `AWS_SECRET_ACCESS_KEY`

    :raises infrastructure.utilities.exceptions.HTMITConfigError: if
      it is unable to obtain the API Key

    :returns: The API Key of the HTM-IT server
  """
  credentials = {
    "aws_access_key_id": config["AWS_ACCESS_KEY_ID"],
    "aws_secret_access_key": config["AWS_SECRET_ACCESS_KEY"]
  }
  server = "https://%s" % publicDnsName
  htmIt = GrokSession(server=server)
  htmIt.apikey = htmIt.verifyCredentials(**credentials)
  if htmIt.apikey:
    htmIt.updateSettings(settings=credentials, section="aws")
    return htmIt.apikey
  else:
    raise HTMITConfigError("Unable to obtain HTM-IT API Key")


def getApiKey(instanceId, publicDnsName, config, logger):
  """
    When the API Key is unknown, get the API Key from the server. This should be
    used for newly instantiated HTM-IT servers.

    :param instanceId: The EC2 instance ID of the new server

    :param publicDnsName: The reachable DNS entry for the instance under test

    :param logger: An initialized logger.

    :raises infrastructure.utilities.exceptions.HTMITConfigError: If
      the API Key doesn't get set properly on a new instance.

    :returns: A string value representing the API Key of the new instance.
  """
  for _ in xrange(HTM_IT_AWS_CREDENTIALS_SETUP_TRIES):
    logger.debug("Trying to setup HTM-IT AWS Credentials.")
    try:
      htmItApiKey = setupHTMITAWSCredentials(publicDnsName, config)
    except (HTMITConfigError, AttributeError):
      # We want to retry this, so just keep going on a HTMITConfigError or
      # AttributeError (which probably indicates that the response was empty)
      logger.warning("Unable to get the API Key")
      continue
    if htmItApiKey:
      logger.info("HTM-IT API Key: %s" % htmItApiKey)
      break
    sleep(SLEEP_DELAY)
  else:
    raise HTMITConfigError("Failed to get API Key for instance %s" %
                          instanceId)
  return htmItApiKey
