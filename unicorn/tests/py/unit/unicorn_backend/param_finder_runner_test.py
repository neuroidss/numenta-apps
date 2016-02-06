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

"""Unit test of the unicorn_backend.param_finder_runner module"""

import csv
from datetime import datetime
import json
import logging
from mock import patch
import os
import sys
import tempfile
import unittest

from nta.utils.logging_support_raw import LoggingSupport
from unicorn_backend import param_finder_runner



_LOGGER = logging.getLogger("unicorn_param_finder_runner_test")



def setUpModule():
  LoggingSupport.initTestApp()



class ParamFinderRunnerTestCase(unittest.TestCase):

  def testParseArgs(self):
    """ Invalid CLI arguments are rejected
    """

    def _assertArgumentPatternFails(argumentPattern=None):
      if argumentPattern is None:
        argumentPattern = []

      argumentPattern = ["unicorn_backend/param_finder_runner.py"
                         ] + argumentPattern
      with patch.object(sys, "argv", argumentPattern):
        # pylint: disable=W0212)
        with self.assertRaises(param_finder_runner._CommandLineArgError):
          param_finder_runner._parseArgs()

    def _assertArgumentPatternPasses(argumentPattern=None):
      if argumentPattern is None:
        argumentPattern = []

      argumentPattern = ["unicorn_backend/param_finder_runner.py"
                         ] + argumentPattern
      with patch.object(sys, "argv", argumentPattern):
        # pylint: disable=W0212)
        param_finder_runner._parseArgs()


    _assertArgumentPatternFails()
    _assertArgumentPatternFails(["--input="])

    inputInfo = {
       'csv': "file.csv",
       'rowOffset': 4,
       'timestampIndex': 0,
       'valueIndex': 1,
       'datetimeFormat': "%m/%d/%y %H:%M"}
    inputInfo = json.dumps(inputInfo)

    _assertArgumentPatternPasses(['--input='+inputInfo])


  def testReadCSVFile(self):
    """
    Verify CSV file can be correctly read via  _readCSVFile function
    """
    tmpfilepath = os.path.join(tempfile.gettempdir(), "tmp-testfile.csv")
    with open(tmpfilepath, "wb") as file:
      fileWriter = csv.writer(file)
      fileWriter.writerow(['timeStamps', 'values'])
      fileWriter.writerow(['2014-04-01 00:00:00', 20.0])

    (timeStamps, values) = param_finder_runner._readCSVFile(
      fileName=tmpfilepath,
      rowOffset=1,
      timestampIndex=0,
      valueIndex=1,
      datetimeFormat="%Y-%m-%d %H:%M:%S"
    )
    self.assertAlmostEqual(values[0], 20.0)
    self.assertAlmostEqual(str(timeStamps[0]),
                           '2014-04-01 00:00:00+00:00')
    os.remove(tmpfilepath)

if __name__ == "__main__":
  unittest.main()
