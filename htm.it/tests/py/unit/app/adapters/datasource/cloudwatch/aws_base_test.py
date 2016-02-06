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

""" Unit tests for htm.it.app.adapters.cloudwatch.aws_base.py
"""

from datetime import datetime, timedelta
import unittest

import mock
from mock import Mock, patch

from htm.it.app.adapters.datasource.cloudwatch import aws_base



class AwsBaseTest(unittest.TestCase):


  def testGetMetricDataWithDefaultStartEndAndHasSamples(self):

    class MyResourceAdapter(aws_base.AWSResourceAdapterBase): # pylint: disable=W0223
      METRIC_PERIOD = 300
      STATISTIC = "Average"

    # Intentionally out of order to confirm that result is sorted
    rawData = [
      dict(Timestamp=datetime(2015, 11, 6, 12, 0, 0), Average=9.0),
      dict(Timestamp=datetime(2015, 11, 5, 12, 0, 0), Average=2)
    ]

    adapterBase = MyResourceAdapter(
      region=Mock(name="region"), dimensions=Mock(name="dimensions"))

    queryPatch = patch.object(adapterBase, "_queryCloudWatchMetricStats",
                              autospec=True, side_effect=[rawData])

    normalizePatch = patch(
      "htm.it.app.aws.cloudwatch_utils.normalizeMetricCollectionTimeRange",
      autospec=True,
      side_effect=[(datetime(2015, 11, 2, 12, 0, 0),
                    datetime(2015, 11, 7, 12, 0, 0))]
    )

    # Execute
    with queryPatch as queryMock, normalizePatch as normalizeMock:
      samples, nextStartTime = adapterBase.getMetricData(start=None, end=None)

    # Check sample sort order and values
    expectedSamples = [
      (datetime(2015, 11, 5, 12, 0, 0), 2),
      (datetime(2015, 11, 6, 12, 0, 0), 9.0)
    ]

    self.assertEqual(samples, expectedSamples)

    # Check nextStartTime matches last sample's timestamp
    self.assertEqual(nextStartTime,
                     expectedSamples[-1][0] + timedelta(seconds=300))

    # Make sure the implementation didn't make unexpected additional calls
    normalizeMock.assert_called_once_with(startTime=None,
                                          endTime=None,
                                          period=300)

    queryMock.assert_called_once_with(period=300,
                                      start=datetime(2015, 11, 2, 12, 0, 0),
                                      end=datetime(2015, 11, 7, 12, 0, 0),
                                      stats=["Average"])


  def testGetMetricDataWithFixedStartAndNoSamplesInRange(self):

    class MyResourceAdapter(aws_base.AWSResourceAdapterBase): # pylint: disable=W0223
      METRIC_PERIOD = 300
      STATISTIC = "Average"

    startTime = datetime(2015, 11, 2, 12, 0, 0)

    rangeEndTime = datetime(2015, 11, 7, 12, 0, 0)

    adapterBase = MyResourceAdapter(
      region=Mock(name="region"), dimensions=Mock(name="dimensions"))

    queryPatch = patch.object(adapterBase, "_queryCloudWatchMetricStats",
                              autospec=True, side_effect=[[]])

    normalizePatch = patch(
      "htm.it.app.aws.cloudwatch_utils.normalizeMetricCollectionTimeRange",
      autospec=True,
      side_effect=[(startTime, rangeEndTime),
                   (rangeEndTime, rangeEndTime)]
    )

    # Execute
    with queryPatch as queryMock, normalizePatch as normalizeMock:
      samples, nextStartTime = adapterBase.getMetricData(start=startTime,
                                                         end=None)

    # Check returned samples
    self.assertEqual(samples, [])

    # Check nextStartTime matches end of range
    self.assertEqual(nextStartTime, rangeEndTime)

    # Verify utility calls
    expectedCallsToNormalize = [
      mock.call(startTime=startTime, endTime=None, period=300),
      mock.call(startTime=rangeEndTime, endTime=rangeEndTime, period=300)
    ]

    self.assertEqual(normalizeMock.mock_calls, expectedCallsToNormalize)

    queryMock.assert_called_once_with(period=300,
                                      start=startTime,
                                      end=rangeEndTime,
                                      stats=["Average"])




if __name__ == "__main__":
  unittest.main()
