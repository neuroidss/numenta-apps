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
Updates HTM-IT release version by modifying the contents of `htm.it/__version__.py`
to match the specified version.  If no version specified, default to the
results of `git describe --tags`, which will result in a version of the format
"{tag}-{N}-{sha}", where {tag} is the most recent git tag, {N} is the number of
commits since {tag}, and {sha} is an abbreviated git commit sha.

MUST BE CALLED BEFORE .git directory is stripped out of htm-it release AND before
.pyc files are generated.
"""
import logging
from optparse import OptionParser
import re
from pkg_resources import resource_filename
import subprocess
import sys

# pylint: disable=W0611
# Imported htm-it here as _APPLICATION_CONF_DIR in logging_support was always
# setting to None. This hack is required while packaging HTM-IT RPM.
import htm.it
from htm.it import logging_support

from nupic.support.decorators import logEntryExit



def _getLogger():
  return logging.getLogger("htm.it.update_release_version")



@logEntryExit(_getLogger, entryExitLogLevel=logging.INFO)
def updateReleaseVersion(args):
  helpString = (
    "This script updates HTM-IT release version in htm/it/__version__.py.\n"
    "%%prog\n\n")

  parser = OptionParser(helpString)

  (_options, posArgs) = parser.parse_args(args)

  try:
    src = args.pop(0).strip()
    if src == '-':
      # Read from stdin
      release_version = sys.stdin.read().strip()
    else:
      # Use version specified in first arg position
      release_version = src
  except:
    # Default to `git describe --tags`
    release_version = subprocess.check_output("git describe --tags",
                                              shell=True).strip()

  pattern = re.compile(r"__version__\s?=\s?[\'\"](.+)[\'\"]")

  with open(resource_filename("htm/it", "__version__.py"), "r+") as fp:
    lines = fp.readlines() # Read entire file into `lines`
    fp.seek(0) # Seek to beginning
    for line in lines:
      # Write out each line individually
      if pattern.match(line):
        # Replace version where appropriate
        fp.write('__version__ = "%s"\n' % release_version)
      else:
        fp.write(line)

    fp.truncate()



if __name__ == "__main__":
  logging_support.LoggingSupport.initTool()

  logger = _getLogger()
  try:
    updateReleaseVersion(sys.argv[1:])
  except:
    e = sys.exc_info()[1]
    if not (isinstance(e, SystemExit) and e.code == 0):
      logger.exception("updateReleaseVersion failed")
    raise
  else:
    logger.info("updateReleaseVersion completed successfully")
