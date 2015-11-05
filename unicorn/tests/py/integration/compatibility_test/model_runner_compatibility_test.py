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
Compatibility test of the unicorn_backend.model_runner module

To add data for tests, convert data from NAB using
unicorn/scripts/convert_data.py and place in the DATA_DIR.
"""

import json
import logging
import os
import subprocess
import sys
import unittest


from nta.utils.logging_support_raw import LoggingSupport
from nta.utils import test_utils



_LOGGER = logging.getLogger("unicorn_model_runner_test")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")



def setUpModule():
  LoggingSupport.initTestApp()



class ModelRunnerCompatibilityTest(unittest.TestCase):


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


  @staticmethod
  def _load(path):
    data = []

    with open(path, 'r') as infile:
      for line in infile:
        data.append(json.loads(line))

    return data


  def _testModelRunner(self, name, stats):
    data = self._load(os.path.join(DATA_DIR, name))
    results = self._load(os.path.join(RESULTS_DIR, name))

    modelId = "test"

    with self._startModelRunnerSubprocess(modelId, stats) as mrProcess:
      for i, rec in enumerate(data):
        # Send row for processing
        mrProcess.stdin.write("%s\n" % (json.dumps(rec),))
        mrProcess.stdin.flush()

        # Read output row and validate
        outputRecord = mrProcess.stdout.readline()
        rowIndex, anomalyLikelihood = json.loads(outputRecord)

        self.assertEqual(rowIndex, i)
        self.assertAlmostEqual(
          anomalyLikelihood,
          results[i][1],
          msg=("Row: {0}\t"
               "Timestamp: {1}\t"
               "Value: {2}\t"
               "Expected anomaly score: {3}\t"
               "Result anomaly score: {4}").format(
                 i, rec[0], rec[1], results[i][1], anomalyLikelihood))

      # Close the subprocess's stdin and wait for it to terminate
      mrProcess.stdin.close()
      mrProcess.wait()
      stdoutData = mrProcess.stdout.read()
      stderrData = mrProcess.stderr.read()

      self.assertEqual(stdoutData, "")
      self.assertEqual(stderrData, "")

      self.assertEqual(mrProcess.returncode, 0)


  def testAmbientTemperatureSystemFailure(self):
    name = 'ambient_temperature_system_failure.json'
    stats = {"min": 57, "max": 87}
    self._testModelRunner(name, stats)


  def testNYCTaxi(self):
    name = 'nyc_taxi.json'
    stats = {"min": 8, "max": 39197}
    self._testModelRunner(name, stats)



if __name__ == "__main__":
  unittest.main()
