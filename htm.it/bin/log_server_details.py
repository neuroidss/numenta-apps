#!/usr/bin/env python
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

"""Script to log server details from AWS"""

from optparse import OptionParser
import requests

import logging


_LOGGER = logging.getLogger(__name__)


def logServerDetails():
  """ Log instance details from the AWS Instance API
  """
  r = requests.get("http://169.254.169.254/latest/dynamic/instance-identity/document")
  _LOGGER.info("Instance info: %s", r.text)


if __name__ == "__main__":
  helpString = "This script logs details about the AWS instance. \n" \
    "It should be run at startup to ensure that support information is logged."

  parser = OptionParser(helpString)
  
  _options, posArgs = parser.parse_args()
  
  if len(posArgs) != 0:
    parser.error("Expected no positional args, but got %s" % (
                 len(posArgs),))

  try:
    logServerDetails()
  except Exception:
    _LOGGER.exception("logServerDetails failed")
    raise
