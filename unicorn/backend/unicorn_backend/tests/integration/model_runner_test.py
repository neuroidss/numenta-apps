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

"""Intergration test of the unicorn_backend.model_runner module"""

import json
import logging
import subprocess
import sys
import time
import types
import unittest
import uuid


from nta.utils.logging_support_raw import LoggingSupport
from nta.utils import test_utils



_LOGGER = logging.getLogger("unicorn_model_runner_test")



def setUpModule():
  LoggingSupport.initTestApp()



class ModelRunnerTestCase(unittest.TestCase):


  @staticmethod
  def _startModelRunnerSubprocess(modelId, stats):
    """Start the unicorn model_runner subprocess

    :param str modelId: model identifier
    :param dict stats: Metric data stats per stats_schema.json in the
      unicorn_backend package
    :returns: the started subprocess.Popen object wrapped in
      ManagedSubprocessTerminator
    :rtype: nta.utils.test_utils.ManagedSubprocessTerminator
    """
    process = subprocess.Popen(
      args=[sys.executable,
            "-m", "unicorn_backend.model_runner",
            "--model=%s" % modelId,
            "--stats=%s" % (json.dumps(stats),)],
      stdin=subprocess.PIPE,
      stdout=subprocess.PIPE,
      stderr=subprocess.PIPE,
      close_fds=True)

    _LOGGER.info("Started unicorn model_runner subprocess=%s", process)
    return test_utils.ManagedSubprocessTerminator(process)


  def testStartAndStopModelRunner(self):
    modelId = uuid.uuid1().hex
    stats = {"min": 0, "max": 100}

    with self._startModelRunnerSubprocess(modelId, stats) as mrProcess:
      # Close the subprocess's stdin and wait for it to terminate
      mrProcess.stdin.close()
      mrProcess.wait()

      stdoutData = mrProcess.stdout.read()
      stderrData = mrProcess.stderr.read()

      self.assertEqual(stdoutData, "")
      self.assertEqual(stderrData, "")

      self.assertEqual(mrProcess.returncode, 0)


  def testModelRunnerFailsWithEmptyModelId(self):
    modelId = ""
    stats = {"min": 0, "max": 100}

    with self._startModelRunnerSubprocess(modelId, stats) as mrProcess:
      # Wait for it to terminate with error
      stdoutData, stderrData = mrProcess.communicate()

      self.assertEqual(mrProcess.returncode, 1)

      self.assertEqual(stdoutData, "")

      # Validate error info
      try:
        errorInfo = json.loads(stderrData)
      except ValueError:
        _LOGGER.exception("Failed while decoding model-runner's stderr=%s",
                          stderrData)
        raise

      self.assertIn("errorText", errorInfo)
      self.assertIsInstance(errorInfo["errorText"], types.StringTypes)
      self.assertGreater(len(errorInfo["errorText"]), 0)

      self.assertIn("diagnosticInfo", errorInfo)
      self.assertIsInstance(errorInfo["diagnosticInfo"], types.StringTypes)
      self.assertGreater(len(errorInfo["diagnosticInfo"]), 0)


  def testModelRunnerFailsWithInvalidStats(self):
    modelId = uuid.uuid1().hex
    stats = {"min": 0, "maxFooInvalid": 100}

    with self._startModelRunnerSubprocess(modelId, stats) as mrProcess:
      # Wait for it to terminate with error
      stdoutData, stderrData = mrProcess.communicate()

      self.assertEqual(stdoutData, "")

      # Validate error info
      try:
        errorInfo = json.loads(stderrData)
      except ValueError:
        _LOGGER.exception("Failed while decoding model-runner's stderr=%s",
                          stderrData)
        raise

      self.assertIn("errorText", errorInfo)
      self.assertIsInstance(errorInfo["errorText"], types.StringTypes)
      self.assertGreater(len(errorInfo["errorText"]), 0)

      self.assertIn("diagnosticInfo", errorInfo)
      self.assertIsInstance(errorInfo["diagnosticInfo"], types.StringTypes)
      self.assertGreater(len(errorInfo["diagnosticInfo"]), 0)

      self.assertEqual(mrProcess.returncode, 1)


  def testModelRunnerFailsWithInvalidInputRecord(self):
    modelId = uuid.uuid1().hex
    stats = {"min": 0, "max": 100}

    with self._startModelRunnerSubprocess(modelId, stats) as mrProcess:
      # Wait for it to terminate with error
      stdoutData, stderrData = mrProcess.communicate(input="[]\n")

      self.assertEqual(mrProcess.returncode, 1)

      self.assertEqual(stdoutData, "")

      # Validate error info
      try:
        errorInfo = json.loads(stderrData)
      except ValueError:
        _LOGGER.exception("Failed while decoding model-runner's stderr=%s",
                          stderrData)
        raise

      self.assertIn("errorText", errorInfo)
      self.assertIsInstance(errorInfo["errorText"], types.StringTypes)
      self.assertGreater(len(errorInfo["errorText"]), 0)

      self.assertIn("diagnosticInfo", errorInfo)
      self.assertIsInstance(errorInfo["diagnosticInfo"], types.StringTypes)
      self.assertGreater(len(errorInfo["diagnosticInfo"]), 0)


  def testFeedInputGetOutput(self):
    modelId = uuid.uuid1().hex
    stats = {"min": 0, "max": 100}

    inputRecords = [[time.time(), i + 0.599] for i in xrange(10)]

    with self._startModelRunnerSubprocess(modelId, stats) as mrProcess:
      for i, rec in enumerate(inputRecords):
        # Send row for processing
        mrProcess.stdin.write("%s\n" % (json.dumps(rec),))
        mrProcess.stdin.flush()

        # Read output row and validate
        outputRecord = mrProcess.stdout.readline()
        rowIndex, anomalyLikelihood = json.loads(outputRecord)

        self.assertEqual(rowIndex, i)
        self.assertIsInstance(anomalyLikelihood, float)


      # Close the subprocess's stdin and wait for it to terminate
      mrProcess.stdin.close()
      mrProcess.wait()
      stdoutData = mrProcess.stdout.read()
      stderrData = mrProcess.stderr.read()

      self.assertEqual(stdoutData, "")
      self.assertEqual(stderrData, "")

      self.assertEqual(mrProcess.returncode, 0)
