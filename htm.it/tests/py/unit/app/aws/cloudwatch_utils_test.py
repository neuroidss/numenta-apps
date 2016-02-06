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
Unit tests for htm.it.app.aws.cloudwatch_utils
"""

from datetime import datetime, timedelta
import json
import logging

import unittest

from boto.exception import (AWSConnectionError, BotoServerError)

from mock import Mock, patch

from htm.it import logging_support

from htm.it.app.aws import cloudwatch_utils
from htm.it.app.aws.cloudwatch_utils import retryOnCloudWatchTransientError



def setUpModule():
  logging_support.LoggingSupport.initTestApp()



class CloudWatchUtilsTestCase(unittest.TestCase):

  class ExitRetry(Exception):
    pass


  def testNoRetryOnUserError(self):
    # retryOnCloudWatchTransientError with no retry on user error
    accumulator = dict(value=0)

    @retryOnCloudWatchTransientError()
    def testMe():
      accumulator["value"] += 1
      raise BotoServerError(
        400,
        "",
        json.dumps(dict(Error=(dict(Code="InvalidAction")))))

    with self.assertRaises(BotoServerError):
      testMe()

    self.assertEqual(accumulator["value"], 1)


  @patch.multiple("htm.it.app.aws.cloudwatch_utils",
                  INITIAL_RETRY_BACKOFF_SEC=0.001)
  def _testRetryCommon(self, ex):
    accumulator = dict(value=0)

    @retryOnCloudWatchTransientError(logger=logging.getLogger())
    def testMe():
      accumulator["value"] += 1

      if accumulator["value"] < 2:
        raise ex
      else:
        raise self.ExitRetry

    with self.assertRaises(self.ExitRetry):
      testMe()

    self.assertEqual(accumulator["value"], 2)


  def testRetryOnInternalFailure(self):
    # retryOnCloudWatchTransientError with retry on InternalFailure
    self._testRetryCommon(
      BotoServerError(
        500,
        "",
        json.dumps(dict(Error=(dict(Code="InternalFailure")))))
    )


  def testRetryOnRequestExpired(self):
    # retryOnCloudWatchTransientError with retry on RequestExpired
    self._testRetryCommon(
      BotoServerError(
        400,
        "",
        json.dumps(dict(Error=(dict(Code="RequestExpired")))))
    )


  def testRetryOnServiceUnavailable(self):
    # retryOnCloudWatchTransientError with retry on ServiceUnavailable
    self._testRetryCommon(
      BotoServerError(
        503,
        "",
        json.dumps(dict(Error=(dict(Code="ServiceUnavailable")))))
    )


  def testRetryOnThrottling(self):
    # retryOnCloudWatchTransientError with retry on Throttling
    self._testRetryCommon(
      BotoServerError(
        400,
        "",
        json.dumps(dict(Error=(dict(Code="Throttling")))))
    )


  def testRetryOnConnectionError(self):
    # retryOnCloudWatchTransientError with retry on AWSConnectionError
    self._testRetryCommon(AWSConnectionError("Error Message"))


  def testNormalizeMetricCollectionTimeRangeWithDefaultStartAndEnd(self):

    fakeUtcnow = datetime(2015, 11, 1, 12, 0, 0)

    datetimePatch = patch("datetime.datetime",
                          new=Mock(wraps=datetime,
                                   utcnow=Mock(side_effect=[fakeUtcnow])))

    period = 300

    with datetimePatch as datetimeMock:
      rangeStart, rangeEnd = (
        cloudwatch_utils.normalizeMetricCollectionTimeRange(
          startTime=None,
          endTime=None,
          period=period)
      )


    self.assertEqual(datetimeMock.utcnow.call_count, 1)

    self.assertEqual(
      rangeStart,
      fakeUtcnow - cloudwatch_utils.CLOUDWATCH_DATA_MAX_STORAGE_TIMEDELTA)

    # The next verification assumes this relationship
    self.assertLessEqual(
      cloudwatch_utils.CLOUDWATCH_MAX_DATA_RECORDS,
      (cloudwatch_utils.CLOUDWATCH_DATA_MAX_STORAGE_TIMEDELTA.total_seconds() /
       period)
    )

    self.assertEqual(
      rangeEnd,
      rangeStart + timedelta(
        seconds=period * cloudwatch_utils.CLOUDWATCH_MAX_DATA_RECORDS))


  def testNormalizeMetricCollectionTimeRangeWithFixedStartAndDefaultEnd(self):

    fakeUtcnow = datetime(2015, 11, 1, 12, 0, 0)

    fixedStartTime = datetime(2015, 11, 1, 9, 0, 0)

    period = 300

    datetimePatch = patch("datetime.datetime",
                          new=Mock(wraps=datetime,
                                   utcnow=Mock(side_effect=[fakeUtcnow])))

    with datetimePatch as datetimeMock:
      rangeStart, rangeEnd = (
        cloudwatch_utils.normalizeMetricCollectionTimeRange(
          startTime=fixedStartTime,
          endTime=None,
          period=period)
      )


    # Fixed start should be honored
    self.assertEqual(rangeStart, fixedStartTime)

    # Default end should be at an integral number of periods, not to exceed
    # the empirically-determine backoff from now and also limited by
    # CLOUDWATCH_MAX_DATA_RECORDS

    self.assertEqual(datetimeMock.utcnow.call_count, 1)

    rangeEndLimit = (
      fakeUtcnow -
      timedelta(seconds=cloudwatch_utils.getMetricCollectionBackoffSeconds(
        period))
    )

    expectedRangeEnd = min(
      (fixedStartTime +
       timedelta(seconds=(rangeEndLimit - fixedStartTime).total_seconds() //
                 period * period)),
      (fixedStartTime +
       timedelta(seconds=cloudwatch_utils.CLOUDWATCH_MAX_DATA_RECORDS * period))
    )

    self.assertEqual(rangeEnd, expectedRangeEnd)



if __name__ == '__main__':
  unittest.main()
