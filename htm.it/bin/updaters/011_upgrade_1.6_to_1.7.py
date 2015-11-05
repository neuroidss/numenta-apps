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

"""Migrate from HTM-IT 1.6 to 1.7"""

import logging
import os
import subprocess

from htm.it import logging_support
from htm.it.app import HTM_IT_HOME
from htm.it.app import repository



g_log = logging.getLogger(__name__)



def regenerateBaselineConfigObjects():
  """ Regenerate baseline configurations. This operation is idempotent. It
  should typically be the first step of a HTM-IT upgrade.
  """
  g_log.info("******* REGENERATING BASELINE CONFIG OBJECTS *******")
  os.chdir(HTM_IT_HOME)
  subprocess.check_call(["python", "setup.py", "gen_base_configs"])
  g_log.info("******* BASELINE CONFIG OBJECTS REGENERATED *******")



def fixUpHTMItDB():
  g_log.info("******* UPDATING HTM-ITDB *******")

  # Perform manual db migration to switch to sqlalchemy
  engine = repository.engineFactory()
  with engine.connect() as connection:
    connection.execute("DROP TABLE IF EXISTS DATABASECHANGELOG")
    connection.execute("DROP TABLE IF EXISTS DATABASECHANGELOGLOCK")
    connection.execute(
        "CREATE TABLE `alembic_version` (`version_num` varchar(32) NOT NULL) "
        "ENGINE=InnoDB DEFAULT CHARSET=utf8;")
    # This fools Alembic into thinking the first migration, which goes from an
    # empty database to the 1.6 setup, has already been completed so it doesn't
    # attempt to perform it.
    connection.execute(
        "INSERT INTO alembic_version (version_num) VALUES('3a7e06671df4');")

  # Now we can run the migration script to upgrade from 1.6 to 1.7.
  repository.migrate("2f1ee984f978")

  g_log.info("******* HTM-ITDB UPDATED *******")


if __name__ == "__main__":
  logging_support.LoggingSupport.initTool()

  try:
    # First, regenerate baseline configuraiton objects
    regenerateBaselineConfigObjects()

    fixUpHTMItDB()

  except:
    g_log.exception("Updater script failed")
    raise
  else:
    g_log.info("Updater script completed successfully")
