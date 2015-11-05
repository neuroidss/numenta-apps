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

"""Unit test of the unicorn_backend.model_runner module"""

import logging
from mock import patch
import sys
import unittest

from nta.utils.logging_support_raw import LoggingSupport
from unicorn_backend import model_runner



_LOGGER = logging.getLogger("unicorn_model_runner_test")



def setUpModule():
  LoggingSupport.initTestApp()



class ModelRunnerTestCase(unittest.TestCase):

  def testParseArgs(self):
    """ Invalid CLI arguments are rejected
    """

    def _assertArgumentPatternFails(argumentPattern=None):
      if argumentPattern is None:
        argumentPattern = []

      argumentPattern = ["unicorn_backend/model_runner.py"] + argumentPattern

      with patch.object(sys, "argv", argumentPattern):
        # pylint: disable=W0212
        with self.assertRaises(model_runner._CommandLineArgError):
          model_runner._parseArgs()

    _assertArgumentPatternFails()
    _assertArgumentPatternFails(["--model="])
    _assertArgumentPatternFails(['--model="1"'])
    _assertArgumentPatternFails(["--stats="])
    _assertArgumentPatternFails(['--stats="{}"'])
    _assertArgumentPatternFails(['--stats={"max": 10, "min": 0}'])
    _assertArgumentPatternFails(["--model=", "--stats="])
    _assertArgumentPatternFails(['--model="1"', "--stats="])
    _assertArgumentPatternFails(['--model="1"', "--stats="])
    _assertArgumentPatternFails(["--model=", '--stats={"max": 10, "min": 0}'])
    _assertArgumentPatternFails(["--model=", '--stats={"max": 10, "min": 0'])


  @staticmethod
  @patch("sys.stdout.write", autospec=True)
  @patch("sys.stdout.flush", autospec=True)
  @patch("sys.stdin.readline",
         side_effect=["[1438649711, 835.93679]\n"],
         autospec=True)
  def testModelRunnerAtBoundaries(readlineMock, stdoutFlushMock,
                                  stdoutWriteMock):
    """ _ModelRunner().run() reads from STDIN and writes to STDOUT
    """
    # pylint: disable=W0212
    model_runner._ModelRunner(modelId="1", stats={"max": 10, "min": 0}).run()

    # sys.stdin.readline was called at least once
    readlineMock.assert_any_call()

    # ModelRunner emitted [0, 0.0301029996658834]\n in output given the input
    # [1438649711, 835.93679]\n
    stdoutWriteMock.assert_called_once_with("[0, 0.0301029996658834]\n")

    # _ModelRunner flushed output
    stdoutFlushMock.assert_called_once_with()
