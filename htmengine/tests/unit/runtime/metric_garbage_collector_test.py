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

"""Unit test for
htmengine.runtime.metric_garbage_collector.purgeOldMetricDataRows
"""

# Suppress pylint warnings concerning access to protected member
# pylint: disable=W0212


import itertools
import unittest

import mock
from mock import patch

from nta.utils.logging_support_raw import LoggingSupport

import htmengine.repository
from htmengine.runtime import metric_garbage_collector



def setUpModule():
  LoggingSupport.initTestApp()



@patch("htmengine.runtime.metric_garbage_collector"
       "._deleteRows", autospec=True)
@patch("htmengine.runtime.metric_garbage_collector"
       "._queryCandidateRows", autospec=True)
@patch("htmengine.runtime.metric_garbage_collector"
       "._estimateNumRowsToDelete", autospec=True)
@patch("htmengine.runtime.metric_garbage_collector"
       ".htmengine.repository",
       new=mock.Mock(spec_set=htmengine.repository))
class PurgeOldMetricDataRowsUnitTestCase(unittest.TestCase):



  def testPurgeOldMetricDataRowsWithoutOldRecords(self,
                                                  estimateNumRowsToDeleteMock,
                                                  queryCandidateRowsMock,
                                                  deleteRowsMock):
    estimateNumRowsToDeleteMock.return_value = 0

    # These should not be called in this test
    queryCandidateRowsMock.side_effect = []
    deleteRowsMock.side_effect = []

    numDeleted = metric_garbage_collector.purgeOldMetricDataRows(
      thresholdDays=90)

    self.assertEqual(numDeleted, 0)

    self.assertEqual(estimateNumRowsToDeleteMock.call_count, 1)

    self.assertEqual(queryCandidateRowsMock.call_count, 0)
    self.assertEqual(deleteRowsMock.call_count, 0)


  def testPurgeOldMetricDataRowsDeletedLessThanExpected(
      self,
      estimateNumRowsToDeleteMock,
      queryCandidateRowsMock,
      deleteRowsMock):

    estimate = metric_garbage_collector._MAX_DELETE_BATCH_SIZE * 3

    estimateNumRowsToDeleteMock.return_value = estimate


    candidatesIter = iter(zip(["ABCDEF"] * estimate, xrange(estimate)))

    queryCandidateRowsMock.side_effect = (
      lambda limit, **kwargs: tuple(itertools.islice(candidatesIter, limit)))

    deletedCounts = [
      metric_garbage_collector._MAX_DELETE_BATCH_SIZE,
      metric_garbage_collector._MAX_DELETE_BATCH_SIZE // 2,
      metric_garbage_collector._MAX_DELETE_BATCH_SIZE
    ]

    deleteRowsMock.side_effect = iter(deletedCounts)

    # Execute
    numDeleted = metric_garbage_collector.purgeOldMetricDataRows(
      thresholdDays=90)

    self.assertEqual(numDeleted, sum(deletedCounts))

    self.assertEqual(estimateNumRowsToDeleteMock.call_count, 1)

    self.assertEqual(queryCandidateRowsMock.call_count, 4)
    self.assertEqual(deleteRowsMock.call_count, 3)


  def testPurgeOldMetricDataRowsFewerCandidatesThanExpected(
      self,
      estimateNumRowsToDeleteMock,
      queryCandidateRowsMock,
      deleteRowsMock):

    estimate = metric_garbage_collector._MAX_DELETE_BATCH_SIZE * 2

    estimateNumRowsToDeleteMock.return_value = estimate


    candidatesIter = iter(zip(["ABCDEF"] * (estimate // 2),
                              xrange(estimate // 2)))

    queryCandidateRowsMock.side_effect = (
      lambda limit, **kwargs: tuple(itertools.islice(candidatesIter, limit)))

    deleteRowsMock.side_effect = (
      lambda uidRowidPairs, **kwargs: len(uidRowidPairs))

    # Execute
    numDeleted = metric_garbage_collector.purgeOldMetricDataRows(
      thresholdDays=90)

    self.assertEqual(numDeleted, estimate // 2)

    self.assertEqual(estimateNumRowsToDeleteMock.call_count, 1)

    self.assertEqual(queryCandidateRowsMock.call_count, 2)
    self.assertEqual(deleteRowsMock.call_count, 1)


  def testPurgeOldMetricDataRowsStopAtEstimated(
      self,
      estimateNumRowsToDeleteMock,
      queryCandidateRowsMock,
      deleteRowsMock):

    estimate = metric_garbage_collector._MAX_DELETE_BATCH_SIZE * 2

    estimateNumRowsToDeleteMock.return_value = estimate


    candidatesIter = iter(zip(["ABCDEF"] * (estimate + 1),
                              xrange(estimate + 1)))

    queryCandidateRowsMock.side_effect = (
      lambda limit, **kwargs: tuple(itertools.islice(candidatesIter, limit)))

    deleteRowsMock.side_effect = (
      lambda uidRowidPairs, **kwargs: len(uidRowidPairs))

    # Execute
    numDeleted = metric_garbage_collector.purgeOldMetricDataRows(
      thresholdDays=90)

    self.assertEqual(numDeleted, estimate)

    self.assertEqual(estimateNumRowsToDeleteMock.call_count, 1)

    self.assertEqual(queryCandidateRowsMock.call_count, 2)
    self.assertEqual(deleteRowsMock.call_count, 2)

    # Make sure it didn't try to retrieve candidates beyond estimated number
    self.assertEqual(len(tuple(candidatesIter)), 1)
