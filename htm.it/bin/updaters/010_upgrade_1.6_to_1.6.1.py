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

"""Migrate from HTM-IT 1.6 to 1.6.1"""

import logging
import os
import subprocess

from htm.it import logging_support
from htm.it.app import HTM_IT_HOME



g_log = logging.getLogger(__name__)



def regenerateBaselineConfigObjects():
  """ Regenerate baseline configurations. This operation is idempotent. It
  should typically be the first step of a HTM-IT upgrade.
  """
  g_log.info("******* REGENERATING BASELINE CONFIG OBJECTS *******")
  os.chdir(HTM_IT_HOME)
  subprocess.check_call(["python", "setup.py", "gen_base_configs"])
  g_log.info("******* BASELINE CONFIG OBJECTS REGENERATED *******")



if __name__ == "__main__":
  logging_support.LoggingSupport.initTool()

  try:
    # Regenerate baseline configuraiton objects
    regenerateBaselineConfigObjects()

  except:
    g_log.exception("Updater script failed")
    raise
  else:
    g_log.info("Updater script completed successfully")
