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

"""
Sets HTM-IT product edition in product configuration.

As of HTM-IT 1.5, only "standard" edition is permitted. This value is used to
drive logic at runtime, such as instance quota configuration/enforcement.

It's expected that the product edition will be set by the build process.

MUST BE CALLED AFTER INITIALIZATION OF HTM-IT CONFIGURATION, BUT BEFORE
update_quota.py

NOTE: Assumes HTM-IT's configuration system has already been initialized (i.e.,
HTM-IT's `setup.py init` has run)
"""

import logging
from optparse import OptionParser
import sys


from nupic.support.decorators import logEntryExit

from htm.it import logging_support
from htm.it.app import HTMItProductConfig



def _getLogger():
  return logging.getLogger("htm.it.set_edition")



@logEntryExit(_getLogger, entryExitLogLevel=logging.INFO)
def setEdition(args):
  supportedEditions = ["standard"]

  helpString = (
    "This script updates HTM-IT production edition in %s.\n"
    "%%prog %s\n\n"
    "IT MUST BE CALLED AFTER INITIALIZATION OF HTM-IT CONFIGURATION, BUT BEFORE "
    "update_quota.py"
    ) % (HTMItProductConfig.CONFIG_NAME, "|".join(supportedEditions),)

  parser = OptionParser(helpString)

  (_options, posArgs) = parser.parse_args(args)

  if len(posArgs) != 1:
    parser.error("Expected exactly one positional arg, but got %s" % (
                 len(posArgs),))

  editionType = posArgs[0]
  if editionType not in supportedEditions:
    parser.error("Got unsupported HTM-IT product edition string %r; expected one "
                 "of %s" % (editionType, supportedEditions,))

  config = HTMItProductConfig(mode=HTMItProductConfig.MODE_OVERRIDE_ONLY)
  if not config.has_section("edition"):
    config.add_section("edition")
  config.set("edition", "type", editionType)
  config.save()



if __name__ == "__main__":
  logging_support.LoggingSupport.initTool()

  logger = _getLogger()
  try:
    setEdition(sys.argv[1:])
  except:
    e = sys.exc_info()[1]
    if not (isinstance(e, SystemExit) and e.code == 0):
      logger.exception("setEdition failed")
    raise
  else:
    logger.info("setEdition completed successfully")
