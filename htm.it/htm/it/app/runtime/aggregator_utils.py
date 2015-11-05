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
Common aggregator utilitities shared by all Aggregator sub-modules
"""

from collections import namedtuple

import htm.it.app


# start/end: datetime.datetime (usually UTC)
TimeRange = namedtuple("TimeRange", "start end")



def getAWSCredentials():
  # Reload config, if it changed
  htm.it.app.config.loadConfig()

  return dict(
    aws_access_key_id=htm.it.app.config.get("aws", "aws_access_key_id"),
    aws_secret_access_key=htm.it.app.config.get("aws", 'aws_secret_access_key')
  )
