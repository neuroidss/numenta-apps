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

"""Unit test of the unicorn_backend.param_finder module"""

import datetime
from dateutil import tz
import logging
import unittest

import numpy

from nta.utils.logging_support_raw import LoggingSupport
from unicorn_backend import param_finder

_LOGGER = logging.getLogger("unicorn_param_finder_test")



def setUpModule():
  LoggingSupport.initTestApp()



class ParamFinderTestCase(unittest.TestCase):
  def testGetMedianSamplingInterval(self):
    timeStamps = numpy.array([datetime.datetime(2000, 1, 1) +
                              datetime.timedelta(hours=i) for i in xrange(24)])
    (medianSamplingInterval,
     medianAbsoluteDev) = param_finder._getMedianSamplingInterval(timeStamps)
    self.assertAlmostEqual(medianSamplingInterval,
                           numpy.timedelta64(3600, 's'))
    self.assertAlmostEqual(medianAbsoluteDev,
                           numpy.timedelta64(0, 's'))


  def testGetAggregationFunction(self):
    aggFunc = param_finder._getAggregationFunction(numpy.timedelta64(300, 's'),
                                                  numpy.timedelta64(0, 's'))
    self.assertEqual(aggFunc, 'mean')

    aggFunc = param_finder._getAggregationFunction(numpy.timedelta64(300, 's'),
                                                  numpy.timedelta64(100, 's'))
    self.assertEqual(aggFunc, 'sum')


  def testResampleData(self):
    # test upsampling by a factor of 2
    timeStamps = numpy.array([numpy.datetime64(
      datetime.datetime(2000, 1, 1, tzinfo=tz.tzlocal()) +
      datetime.timedelta(hours=i)) for i in xrange(8)])
    values = numpy.linspace(0, 7, 8)
    newSamplingInterval = numpy.timedelta64(1800, 's')
    (newTimeStamps, newValues) = param_finder._resampleData(timeStamps,
                                                           values,
                                                           newSamplingInterval)

    trueNewTimeStamps = numpy.array([numpy.datetime64(
      datetime.datetime(2000, 1, 1, tzinfo=tz.tzlocal()) +
      datetime.timedelta(hours=0.5 * i)) for i in xrange(15)])
    self.assertTrue(numpy.allclose(newValues, numpy.linspace(0, 7, 15)))
    self.assertAlmostEqual(numpy.sum(newTimeStamps - trueNewTimeStamps), 0)

    # test down-sampling by a factor of 2
    newSamplingInterval = numpy.timedelta64(7200, 's')
    (newTimeStamps, newValues) = param_finder._resampleData(timeStamps,
                                                           values,
                                                           newSamplingInterval)
    trueNewTimeStamps = numpy.array([numpy.datetime64(
      datetime.datetime(2000, 1, 1, tzinfo=tz.tzlocal()) +
      datetime.timedelta(hours=2 * i)) for i in xrange(4)])
    self.assertTrue(numpy.allclose(newValues, numpy.linspace(0, 6, 4)))
    self.assertAlmostEqual(numpy.sum(newTimeStamps - trueNewTimeStamps), 0)


  def testCalculateContinuousWaveletTransform(self):
    """
    Verify that the periodicity can be correctly identified with CWT
    """
    samplingInterval = numpy.timedelta64(300, 's')
    values = numpy.sin(numpy.linspace(0, 100, 101) * 2 * numpy.pi / 10.0)
    targetPeriod = 3000.0

    (cwtVar, timeScale) = param_finder._calculateContinuousWaveletTransform(
      samplingInterval, values)

    calculatedPeriod = timeScale[numpy.where(cwtVar == max(cwtVar))[0][0]]
    calculatedPeriod = calculatedPeriod.astype('float32')
    self.assertTrue(abs(targetPeriod - calculatedPeriod) / targetPeriod < .1)


  def testDetermineEncoderTypes(self):
    # daily and weekly periodicity in units of seconds
    dayPeriod = 86400.0
    weekPeriod = 604800.0

    samplingInterval = numpy.timedelta64(300, 's')
    widths = numpy.logspace(0, numpy.log10(40000 / 20), 50)
    timeScale = widths * samplingInterval * 4
    timeScale = timeScale.astype('float64')

    # a flat cwtVar distribution, no encoder should be used
    cwtVar = numpy.ones(shape=timeScale.shape)
    (useTimeOfDay,
     useDayOfWeek) = param_finder._determineEncoderTypes(cwtVar, timeScale)
    self.assertFalse(useTimeOfDay)
    self.assertFalse(useDayOfWeek)

    # make a peak around daily period
    cwtVar = numpy.exp(-(timeScale - dayPeriod) ** 2 / (2 * 100000.0 ** 2))
    (useTimeOfDay,
     useDayOfWeek) = param_finder._determineEncoderTypes(cwtVar, timeScale)
    self.assertTrue(useTimeOfDay)
    self.assertFalse(useDayOfWeek)

    # make a peak around weekly period
    cwtVar = numpy.exp(-(timeScale - weekPeriod) ** 2 / (2 * 100000.0 ** 2))
    (useTimeOfDay,
     useDayOfWeek) = param_finder._determineEncoderTypes(cwtVar, timeScale)
    self.assertFalse(useTimeOfDay)
    self.assertTrue(useDayOfWeek)

    # a double peaked function
    cwtVar = (numpy.exp(-(timeScale - dayPeriod) ** 2 / (2 * 100000.0 ** 2)) +
              numpy.exp(-(timeScale - weekPeriod) ** 2 / (2 * 100000.0 ** 2)))
    (useTimeOfDay,
     useDayOfWeek) = param_finder._determineEncoderTypes(cwtVar, timeScale)
    self.assertTrue(useTimeOfDay)
    self.assertTrue(useDayOfWeek)


  def testDetermineAggregationWindow(self):
    """
    Verify aggregation window can be determined from the cwtVar distribution
    """
    dayPeriod = 86400.0
    weekPeriod = 604800.0
    samplingInterval = numpy.timedelta64(300, 's')
    widths = numpy.logspace(0, numpy.log10(40000 / 20), 50)
    timeScale = widths * samplingInterval * 4
    timeScale = timeScale.astype('float64')
    cwtVar = numpy.exp(-(timeScale - weekPeriod) ** 2 / (2 * 100000.0 ** 2))
    numDataPts = 40000

    maxSamplingInterval = (float(numDataPts) / 1000.0 * samplingInterval)

    aggregationTimeScale = param_finder._determineAggregationWindow(
      timeScale=timeScale,
      cwtVar=cwtVar,
      thresh=0.2,
      samplingInterval=samplingInterval,
      numDataPts=40000
    )
    self.assertLessEqual(aggregationTimeScale, maxSamplingInterval)
    self.assertGreater(aggregationTimeScale, samplingInterval.astype('float64'))


