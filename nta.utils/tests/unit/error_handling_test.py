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

"""Unit tests for the error-handling utilities"""

import os
import Queue
import unittest

from mock import patch, call, Mock

from nta.utils import error_handling
from nta.utils.logging_support_raw import LoggingSupport
from nta.utils.test_utils import time_test_utils



class TestParentException(Exception):
  pass

class TestChildException(TestParentException):
  pass


def setUpModule():
  LoggingSupport.initTestApp()


class RetryDecoratorTest(unittest.TestCase):
  """Unit tests specific to retry decorator."""

  @patch("time.sleep", autospec=True)
  @patch("time.time", autospec=True)
  def testRetryNoTimeForRetries(self, mockTime, mockSleep):
    """Test that when timeoutSec == 0, function is executed exactly once
    with no retries, and raises an exception on failure.
    """

    time_test_utils.configureTimeAndSleepMocks(mockTime, mockSleep)

    _retry = error_handling.retry(
      timeoutSec=0, initialRetryDelaySec=0.2,
      maxRetryDelaySec=10)

    testFunction = Mock(side_effect=TestParentException("Test exception"),
                        __name__="testFunction", autospec=True)

    with self.assertRaises(TestParentException):
      _retry(testFunction)()

    self.assertFalse(mockSleep.called)
    testFunction.assert_called_once_with()


  @patch("time.sleep", autospec=True)
  @patch("time.time", autospec=True)
  def testRetryWaitsInitialRetryDelaySec(self, mockTime, mockSleep):
    """Test that delay times are correct."""

    time_test_utils.configureTimeAndSleepMocks(mockTime, mockSleep)

    _retry = error_handling.retry(
      timeoutSec=30, initialRetryDelaySec=2,
      maxRetryDelaySec=10)

    testFunction = Mock(side_effect=TestParentException("Test exception"),
                        __name__="testFunction", autospec=True)

    with self.assertRaises(TestParentException):
      _retry(testFunction)()

    self.assertEqual(mockSleep.mock_calls, [call(2), call(4), call(8),
                                            call(10), call(10)])

    self.assertEqual(testFunction.call_count, 6)


  @patch("time.sleep", autospec=True)
  @patch("time.time", autospec=True)
  def testRetryRetryExceptionIncluded(self, mockTime, mockSleep):
    """Test that retry is triggered if raised exception is in
    retryExceptions."""

    time_test_utils.configureTimeAndSleepMocks(mockTime, mockSleep)

    _retry = error_handling.retry(
      timeoutSec=1, initialRetryDelaySec=1,
      maxRetryDelaySec=10, retryExceptions=(TestParentException,))

    @_retry
    def testFunction():
      raise TestChildException("Test exception")

    with self.assertRaises(TestChildException):
      testFunction()

    self.assertEqual(mockSleep.call_count, 1)


  @patch("time.sleep", autospec=True)
  @patch("time.time", autospec=True)
  def testRetryRetryExceptionExcluded(self, mockTime, mockSleep):
    """ Test that retry is not triggered if raised exeception is not in
    retryExceptions """

    time_test_utils.configureTimeAndSleepMocks(mockTime, mockSleep)

    class TestExceptionA(Exception):
      pass

    class TestExceptionB(Exception):
      pass

    _retry = error_handling.retry(
      timeoutSec=1, initialRetryDelaySec=1,
      maxRetryDelaySec=10, retryExceptions=(TestExceptionA,))

    @_retry
    def testFunction():
      raise TestExceptionB("Test exception")

    with self.assertRaises(TestExceptionB):
      testFunction()

    self.assertEqual(mockSleep.call_count, 0)


  @patch("time.sleep", autospec=True)
  @patch("time.time", autospec=True)
  def testRetryRetryFilter(self, mockTime, mockSleep):
    """Test that if retryFilter is specified and exception is in
    retryExceptions, retries iff retryFilter returns true."""

    time_test_utils.configureTimeAndSleepMocks(mockTime, mockSleep)

    # Test with retryFilter returning True

    _retryTrueFilter = error_handling.retry(
      timeoutSec=1, initialRetryDelaySec=1,
      maxRetryDelaySec=10, retryExceptions=(TestParentException,),
      retryFilter=lambda _1, _2, _3: True)

    @_retryTrueFilter
    def testFunctionTrue():
      raise TestChildException("Test exception")

    with self.assertRaises(TestChildException):
      testFunctionTrue()

    self.assertEqual(mockSleep.call_count, 1)

    # Test with retryFilter returning False

    mockSleep.reset_mock()

    _retryFalseFilter = error_handling.retry(
      timeoutSec=1, initialRetryDelaySec=1,
      maxRetryDelaySec=10, retryExceptions=(TestParentException,),
      retryFilter=lambda _1, _2, _3: False)

    @_retryFalseFilter
    def testFunctionFalse():
      raise TestChildException("Test exception")

    with self.assertRaises(TestChildException):
      testFunctionFalse()

    self.assertEqual(mockSleep.call_count, 0)


  @patch("time.sleep", autospec=True)
  @patch("time.time", autospec=True)
  def testReturnsExpectedWithExpectedArgs(self, mockTime, mockSleep):
    """Test that docorated function receives only expected args and
    that it returns the expected value on success."""

    time_test_utils.configureTimeAndSleepMocks(mockTime, mockSleep)

    _retry = error_handling.retry(
      timeoutSec=30, initialRetryDelaySec=2,
      maxRetryDelaySec=10)

    testFunction = Mock(return_value=321,
                        __name__="testFunction", autospec=True)

    returnValue = _retry(testFunction)(1, 2, a=3, b=4)

    self.assertEqual(returnValue, 321)
    testFunction.assert_called_once_with(1, 2, a=3, b=4)


  @patch("time.sleep", autospec=True)
  @patch("time.time", autospec=True)
  def testNoRetryIfCallSucceeds(self, mockTime, mockSleep):
    """If the initial call succeeds, test that no retries are performed."""

    time_test_utils.configureTimeAndSleepMocks(mockTime, mockSleep)

    _retry = error_handling.retry(
      timeoutSec=30, initialRetryDelaySec=2,
      maxRetryDelaySec=10)

    testFunction = Mock(__name__="testFunction", autospec=True)

    _retry(testFunction)()

    testFunction.assert_called_once_with()


  @patch("time.sleep", autospec=True)
  @patch("time.time", autospec=True)
  def testFailsFirstSucceedsLater(self, mockTime, mockSleep):
    """If initial attempts fail but subsequent attempt succeeds, ensure that
    expected number of retries is performed and expected value is returned."""

    time_test_utils.configureTimeAndSleepMocks(mockTime, mockSleep)

    _retry = error_handling.retry(
      timeoutSec=30, initialRetryDelaySec=2,
      maxRetryDelaySec=10)

    testFunction = Mock(
      side_effect=[
        TestParentException("Test exception 1"),
        TestParentException("Test exception 2"),
        321
      ],
      __name__="testFunction", autospec=True)

    returnValue = _retry(testFunction)()

    self.assertEqual(returnValue, 321)
    self.assertEqual(testFunction.call_count, 3)


class ErrorHandlingUtilsTest(unittest.TestCase):
  """ Unit tests for the error-handling utilities """


  def testAbortProgramOnAnyExceptionWithoutException(self):

    @error_handling.abortProgramOnAnyException(exitCode=2)
    def doSomething(*args, **kwargs):
      return args, kwargs


    inputArgs = (1, 2, 3)
    inputKwargs = dict(a="A", b="B", c="C")

    outputArgs, outputKwargs = doSomething(*inputArgs, **inputKwargs)

    # Validate that doSomething got the right inputs
    self.assertEqual(outputArgs, inputArgs)
    self.assertEqual(outputKwargs, inputKwargs)


  def testAbortProgramOnAnyExceptionWithRuntimeErrorException(self):
    @error_handling.abortProgramOnAnyException(exitCode=2)
    def doSomething(*_args, **_kwargs):
      raise RuntimeError()


    # Patch os._exit and run model in SlotAgent
    osExitCodeQ = Queue.Queue()
    with patch.object(os, "_exit", autospec=True,
                      side_effect=osExitCodeQ.put):
      inputArgs = (1, 2, 3)
      inputKwargs = dict(a="A", b="B", c="C")

      with self.assertRaises(RuntimeError):
        doSomething(*inputArgs, **inputKwargs)

      exitCode = osExitCodeQ.get_nowait()
      self.assertEqual(exitCode, 2)


  def testAbortProgramOnAnyExceptionWithSystemExitException(self):
    # Repeat of the other test, but his time with SystemExit exception,
    # which is derived from BaseException

    @error_handling.abortProgramOnAnyException(exitCode=2)
    def doSomething(*_args, **_kwargs):
      raise SystemExit


    # Patch os._exit and run model in SlotAgent
    osExitCodeQ = Queue.Queue()
    with patch.object(os, "_exit", autospec=True,
                      side_effect=osExitCodeQ.put):
      inputArgs = (1, 2, 3)
      inputKwargs = dict(a="A", b="B", c="C")

      with self.assertRaises(SystemExit):
        doSomething(*inputArgs, **inputKwargs)

      exitCode = osExitCodeQ.get_nowait()
      self.assertEqual(exitCode, 2)


if __name__ == '__main__':
  unittest.main()

