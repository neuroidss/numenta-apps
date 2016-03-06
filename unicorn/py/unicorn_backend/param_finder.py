#!/usr/bin/env python
# coding=utf-8
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
Implements param finder, which automatically
1. identify appropriate data aggregation window
2. suggest whether to use TimeOfDay encoder
3. suggest data aggregation type (sum or mean)
"""

import datetime
import numpy

from nupic.frameworks.opf.common_models.cluster_params import (
  getScalarMetricWithTimeOfDayAnomalyParams)

_CORRELATION_MODE_VALID = 0
_CORRELATION_MODE_SAME = 1
_CORRELATION_MODE_FULL = 2

_AGGREGATION_WINDOW_THRESH = 0.2

# Maximum number of rows param_finder will process
# If the input data exceeds MAX_NUM_ROWS, the first MAX_NUM_ROWS will be used
MAX_NUM_ROWS = 20000
# Minimum number of rows. If the number of record in the input data is
# less than MIN_NUM_ROWS, the param_finder will return the default parameters
MIN_NUM_ROWS = 100
# Minimum number of rows after the data aggregation. The suggested aggInfo will
# make sure more than MIN_ROW_AFTER_AGGREGATION number of records after
# aggregation
MIN_ROW_AFTER_AGGREGATION = 1000


def _convolve(vector1, vector2, mode):
  """
  Returns the discrete, linear convolution of two one-dimensional sequences.

  The convolution operator is often seen in signal processing, where it
  models the effect of a linear time-invariant system on a signal [1]_.  In
  probability theory, the sum of two independent random variables is
  distributed according to the convolution of their individual
  distributions.

  If `vector2` is longer than `vector1`, the arrays are swapped before
  computation.

  References
  ----------
  .. [1] Wikipedia, "Convolution", http://en.wikipedia.org/wiki/Convolution.

  @param vector1 (array_like) First one-dimensional input array (N,)

  @param vector2 (array_like) Second one-dimensional input array (M,)

  @param mode (int) Indicates mode of convolution, which takes the value of
      _CORRELATION_MODE_FULL:
        This returns the convolution at each point of overlap, with an output
        shape of (N+M-1,). At the end-points of the convolution, the signals
        do not overlap completely, and boundary effects may be seen.

      _CORRELATION_MODE_SAME:
        Mode `same` returns output of length ``max(M, N)``.  Boundary
        effects are still visible.

      _CORRELATION_MODE_VALID:
        Mode `valid` returns output of length
        ``max(M, N) - min(M, N) + 1``.  The convolution product is only given
        for points where the signals overlap completely.  Values outside
        the signal boundary have no effect.

  @return (ndarray) Discrete, linear convolution of `vector1` and `vector2`

  """
  vector1 = numpy.array(vector1, ndmin=1)
  vector2 = numpy.array(vector2, ndmin=1)

  if len(vector1) == 0:
    raise ValueError("vector1 cannot be empty")
  if len(vector2) == 0:
    raise ValueError("vector2 cannot be empty")

  if len(vector2) > len(vector1):
    vector1, vector2 = vector2, vector1

  return numpy.core.multiarray.correlate(vector1, vector2[::-1], mode)



def _rickerWavelet(numPoints, waveletWidth):
  """
  Return a Ricker wavelet, also known as the "Mexican hat wavelet".

  It models the function:

      ``A (1 - x^2/a^2) exp(-t^2/a^2)``,

  where ``A = 2/sqrt(3a)pi^1/3``, a  is the width parameter of the wavelet

  @param points (int) Number of points in `vector` (centered around 0)

  @param waveletWidth (scalar) Width parameter of the wavelet

  @return (ndarray) Array of length `points` in shape of ricker curve

  """
  normalizeFactor = 2 / (numpy.sqrt(3 * waveletWidth) * (numpy.pi ** 0.25))
  wsq = waveletWidth ** 2
  vec = numpy.arange(0, numPoints) - (numPoints - 1.0) / 2
  tsq = vec ** 2
  mod = (1 - tsq / wsq)
  gauss = numpy.exp(-tsq / (2 * wsq))
  total = normalizeFactor * mod * gauss
  return total



def _cwt(data, wavelet, widths):
  """
  Continuous wavelet transform.

  Performs a continuous wavelet transform on `data`,
  using the `wavelet` function. A CWT performs a convolution
  with `data` using the `wavelet` function, which is characterized
  by a width parameter and length parameter.

  @param data (ndarray) data on which to perform the transform

  @param wavelet Wavelet function, which should take 2 arguments:
      The first argument is the number of points that the returned vector
      will have (len(wavelet(width,length)) == length).
      The second is a width parameter, defining the size of the wavelet
      (e.g. standard deviation of a gaussian). See `ricker`, which
      satisfies these requirements.

  @param widths (sequence) Widths to use for transform

  @return (ndarray) Will have shape of (len(data), len(widths))

  """
  output = numpy.zeros([len(widths), len(data)])
  for ind, width in enumerate(widths):
    waveletData = wavelet(min(10 * width, len(data)), width)
    output[ind, :] = _convolve(data, waveletData, mode=_CORRELATION_MODE_SAME)
  return output



def findParameters(samples):
  """
  Find parameters for a given time series dataset with heuristics.

  @param samples Sequence of two tuples (timestamp, value), where
    timestamp of type datetime.datetime and value is a number (int of float)

  @return: JSON object with the following properties:

    "aggInfo" aggregation information, JSON null if no aggregation is needed
      otherwise, a JSON object contains the folowing properties:
        "windowSize": aggregation window size in seconds (integer)
        "func": A string representation of the aggregation function (string)
          the following values are supported: "sum", "mean"

    "modelInfo": JSON object describing the model configuration that
    contains the following properties:
      "modelConfig": OPF Model Configuration parameters (JSON object) for
      passing to the OPF "ModelFactory.create()" method as the
      "modelConfig" parameter.

      "inferenceArgs": OPF Model Inference parameters (JSON object) for
      passing to the resulting model's `enableInference()` method as the
      inferenceArgs parameter.

      "timestampFieldName": The name of the field in 'modelConfig'
      corresponding to the metric timestamp (string)

      "valueFieldName": The name of the field in 'modelConfig'
      corresponding to the metric value (string)
  """
  (timestamps, values) = zip(*samples)
  numRecords = len(timestamps)

  if not isinstance(timestamps[0], datetime.datetime):
    raise TypeError("timestamps must be datetime type")

  if numRecords > MAX_NUM_ROWS:
    timestamps = timestamps[:MAX_NUM_ROWS]
    values = values[:MAX_NUM_ROWS]

  if numRecords < MIN_NUM_ROWS:
    outputInfo = {
      "aggInfo": None,
      "modelInfo": _getModelParams(True, False, values),
    }
    return outputInfo

  timestamps = numpy.array(timestamps, dtype="datetime64[s]")
  values = numpy.array(values).astype("float64")

  numDataPts = len(values)

  (medianSamplingInterval,
   medianAbsoluteDevSamplingInterval) = _getMedianSamplingInterval(timestamps)

  (timestamps, values) = _resampleData(timestamps,
                                       values,
                                       medianSamplingInterval)

  (cwtVar, timeScale) = _calculateContinuousWaveletTransform(
    medianSamplingInterval, values)

  suggestedSamplingInterval = _determineAggregationWindow(
    timeScale=timeScale,
    cwtVar=cwtVar,
    thresh=_AGGREGATION_WINDOW_THRESH,
    samplingInterval=medianSamplingInterval,
    numDataPts=numDataPts)

  # decide whether to use TimeOfDay and DayOfWeek encoders
  (useTimeOfDay, useDayOfWeek) = _determineEncoderTypes(cwtVar, timeScale)

  # decide the aggregation function ("mean" or "sum")
  aggFunc = _getAggregationFunction(medianSamplingInterval,
                                    medianAbsoluteDevSamplingInterval,
                                    _AGGREGATION_WINDOW_THRESH)

  return {
    "aggInfo": _getAggInfo(medianSamplingInterval,
                           suggestedSamplingInterval,
                           aggFunc),
    "modelInfo": _getModelParams(useTimeOfDay, useDayOfWeek, values),
  }



def _getAggInfo(medianSamplingInterval, suggestedSamplingInterval, aggFunc):
  """
  Return a JSON object containing the aggregation window size and
  aggregation function type.

  @param suggestedSamplingInterval (timedelta64)

  @param medianSamplingInterval (timedelta64)

  @param aggFunc (str) "mean" or "sum"

  @return aggInfo (dict) A dictionary with keys "windowSize" and "func"
  """
  if suggestedSamplingInterval <= medianSamplingInterval:
    aggInfo = None
  else:
    aggInfo = {
      "windowSize": suggestedSamplingInterval.astype("int"),
      "func": aggFunc
    }
  return aggInfo



def _getModelParams(useTimeOfDay, useDayOfWeek, values):
  """
  Return a JSON object describing the model configuration.

  @param useTimeOfDay (bool) whether to use timeOfDay encoder

  @param useDayOfWeek (bool) whether to use dayOfWeej encoder

  @param values (numpy array) data values, used to compute min/max values

  @return (dict) A dictionary of model parameters
  """
  modelParams = getScalarMetricWithTimeOfDayAnomalyParams(metricData=values)

  if useTimeOfDay:
    modelParams["modelConfig"]["modelParams"]["sensorParams"]["encoders"] \
      ["c0_timeOfDay"] = dict(fieldname="c0",
                              name="c0",
                              type="DateEncoder",
                              timeOfDay=(21, 9))
  else:
    modelParams["modelConfig"]["modelParams"]["sensorParams"]["encoders"] \
      ["c0_timeOfDay"] = None

  if useDayOfWeek:
    modelParams["modelConfig"]["modelParams"]["sensorParams"]["encoders"] \
      ["c0_dayOfWeek"] = dict(fieldname="c0",
                              name="c0",
                              type="DateEncoder",
                              dayOfWeek=(21, 3))
  else:
    modelParams["modelConfig"]["modelParams"]["sensorParams"]["encoders"] \
      ["c0_dayOfWeek"] = None

  modelParams["timestampFieldName"] = "c0"
  modelParams["valueFieldName"] = "c1"
  return modelParams



def _resampleData(timestamps, values, newSamplingInterval):
  """
  Resample data at new sampling interval using linear interpolation
  Note: the resampling function is using interpolation,
  it may not be appropriate for aggregation purpose.

  @param timestamps numpy array of timestamp in datetime64 type

  @param values numpy array of float64 values

  @param newSamplingInterval numpy timedelta64 format

  @return (tuple) Contains:
          "newTimeStamps" (numpy array) time stamps after resampling
          "newValues" (numpy array) data values after resamplings
  """
  totalDuration = (timestamps[-1] - timestamps[0])
  nSampleNew = numpy.floor(totalDuration / newSamplingInterval) + 1
  nSampleNew = nSampleNew.astype("int")

  newTimeStamps = numpy.empty(nSampleNew, dtype="datetime64[s]")
  for sampleI in xrange(nSampleNew):
    newTimeStamps[sampleI] = timestamps[0] + sampleI * newSamplingInterval

  newValues = numpy.interp((newTimeStamps - timestamps[0]).astype("float32"),
                           (timestamps - timestamps[0]).astype("float32"),
                           values)

  return newTimeStamps, newValues



def _calculateContinuousWaveletTransform(samplingInterval, values):
  """
  Calculate continuous wavelet transformation (CWT).
  Return variance of the cwt coefficients over time.

  @param samplingInterval: sampling interval of the time series

  @param values: numpy array of float64 values

  @return (tuple) Contains
    "cwtVar" (numpy array) Stores variance of the wavelet coefficents
    "timeScale" (numpy array) Stores the corresponding time scales
  """

  widths = numpy.logspace(0, numpy.log10(len(values) / 10), 50)
  timeScale = widths * samplingInterval * 4

  # continuous wavelet transformation with ricker wavelet
  cwtMatrix = _cwt(values, _rickerWavelet, widths)
  # clip wavelet coefficients to minimize boundary effect
  maxTimeScale = int(widths[-1])
  cwtMatrix = cwtMatrix[:, 4 * maxTimeScale:-4 * maxTimeScale]

  # variance of wavelet power
  cwtVar = numpy.var(numpy.abs(cwtMatrix), axis=1)
  cwtVar = cwtVar / numpy.sum(cwtVar)

  return cwtVar, timeScale



def _getMedianSamplingInterval(timestamps):
  """
  Calculate median and median absolute deviation of sampling interval.

  @param timestamps numpy array of timestamps in datetime64 format

  @return: (tuple) Contains:
    "medianSamplingInterval" (datetime64) in unit of seconds
    "medianAbsoluteDev" (timedelta64) the median absolute deviation of
           sampling intervals
  """
  if timestamps.dtype != numpy.dtype("<M8[s]"):
    timestamps = timestamps.astype("datetime64[s]")

  samplingIntervals = numpy.diff(timestamps)

  medianSamplingInterval = numpy.median(samplingIntervals)
  medianAbsoluteDev = numpy.median(
    numpy.abs(samplingIntervals - medianSamplingInterval))

  return medianSamplingInterval, medianAbsoluteDev



def _determineAggregationWindow(timeScale,
                                cwtVar,
                                thresh,
                                samplingInterval,
                                numDataPts):
  """
  Determine data aggregation window

  @param timeScale (numpy array) corresponding time scales for wavelet coeffs

  @param cwtVar (numpy array) wavelet coefficients variance over time

  @param thresh (float) cutoff threshold between 0 and 1

  @param samplingInterval (timedelta64), original sampling interval

  @param numDataPts (float) number of data points

  @return aggregationTimeScale (timedelta64) suggested sampling interval
  """
  samplingInterval = samplingInterval.astype("float64")
  cumulativeCwtVar = numpy.cumsum(cwtVar)
  cutoffTimeScale = timeScale[numpy.where(cumulativeCwtVar >= thresh)[0][0]]

  aggregationTimeScale = cutoffTimeScale / 10.0
  aggregationTimeScale = aggregationTimeScale.astype("float64")
  if aggregationTimeScale < samplingInterval * 4:
    aggregationTimeScale = samplingInterval * 4

  # make sure there is at least 1000 records after aggregation
  if numDataPts < MIN_ROW_AFTER_AGGREGATION:
    aggregationTimeScale = samplingInterval
  else:
    maxSamplingInterval = (float(numDataPts) / MIN_ROW_AFTER_AGGREGATION
                           * samplingInterval)
    if aggregationTimeScale > maxSamplingInterval > samplingInterval:
      aggregationTimeScale = maxSamplingInterval

  aggregationTimeScale = numpy.timedelta64(int(aggregationTimeScale), "s")
  return aggregationTimeScale



def _determineEncoderTypes(cwtVar, timeScale):
  """
  Find local maxima from the wavelet coefficient variance spectrum
  A strong maxima is defined as
  (1) At least 10% higher than the nearest local minima
  (2) Above the baseline value

  The algorithm will suggest an encoder if its corresponding
  periodicity is close to a strong maxima:
  (1) horizontally must within the nearest local minimum
  (2) vertically must within 50% of the peak of the strong maxima

  @param cwtVar (numpy array) wavelet coefficients variance over time

  @param timeScale (numpy array) corresponding time scales for wavelet coeffs

  @return (tuple) Contains:
          "useTimeOfDay" (bool) indicating whether to use timeOfDay encoder
          "useDayOfWeek" (bool) indicating whether to use dayOfWeek encoder
  """

  # Detect all local minima and maxima when the first difference reverse sign
  signOfFirstDifference = numpy.sign(numpy.diff(cwtVar))
  localMin = (numpy.diff(signOfFirstDifference) > 0).nonzero()[0] + 1
  localMax = (numpy.diff(signOfFirstDifference) < 0).nonzero()[0] + 1

  baselineValue = 1.0 / len(cwtVar)

  dayPeriod = 86400.0
  weekPeriod = 604800.0
  timeScale = timeScale.astype("float32")

  cwtVarAtDayPeriod = numpy.interp(dayPeriod, timeScale, cwtVar)
  cwtVarAtWeekPeriod = numpy.interp(weekPeriod, timeScale, cwtVar)

  useTimeOfDay = False
  useDayOfWeek = False

  strongLocalMax = []
  for i in xrange(len(localMax)):
    leftLocalMin = numpy.where(numpy.less(localMin, localMax[i]))[0]
    if len(leftLocalMin) == 0:
      leftLocalMin = 0
      leftLocalMinValue = cwtVar[0]
    else:
      leftLocalMin = localMin[leftLocalMin[-1]]
      leftLocalMinValue = cwtVar[leftLocalMin]

    rightLocalMin = numpy.where(numpy.greater(localMin, localMax[i]))[0]
    if len(rightLocalMin) == 0:
      rightLocalMin = len(cwtVar) - 1
      rightLocalMinValue = cwtVar[-1]
    else:
      rightLocalMin = localMin[rightLocalMin[0]]
      rightLocalMinValue = cwtVar[rightLocalMin]

    localMaxValue = cwtVar[localMax[i]]
    nearestLocalMinValue = numpy.max(leftLocalMinValue, rightLocalMinValue)

    if ((localMaxValue - nearestLocalMinValue) / localMaxValue > 0.1 and
        localMaxValue > baselineValue):
      strongLocalMax.append(localMax[i])

      if (timeScale[leftLocalMin] < dayPeriod < timeScale[rightLocalMin]
          and cwtVarAtDayPeriod > localMaxValue * 0.5):
        useTimeOfDay = True

      if (timeScale[leftLocalMin] < weekPeriod < timeScale[rightLocalMin]
          and cwtVarAtWeekPeriod > localMaxValue * 0.5):
        useDayOfWeek = True

  return useTimeOfDay, useDayOfWeek



def _getAggregationFunction(medianSamplingInterval,
                            medianAbsoluteDevSamplingInterval,
                            aggregationFuncThresh):
  """
  Return the aggregation function type:
    ("sum" for transactional data types
     "mean" for non-transactional data types)

  The data type is determined via a data type indicator, defined as the
  ratio between median absolute deviation and median of the sampling interval.
  @param medianSamplingInterval, numpy timedelta64 in unit of seconds

  @param medianAbsoluteDev (timedelta64) the median absolute deviation of
          sampling interval

  @param aggregationFuncThresh (float) a positive number indication the
        threshold between transactional and non-transactional data types
        A higher threshold will lead to a bias towards non-transactional data

  @return aggFunc (string) "sum" or "mean"
  """
  dataTypeIndicator = (medianAbsoluteDevSamplingInterval /
                       medianSamplingInterval)
  if dataTypeIndicator > aggregationFuncThresh:
    aggFunc = "sum"  # "transactional"
  else:
    aggFunc = "mean"  # "non-transactional"

  return aggFunc
