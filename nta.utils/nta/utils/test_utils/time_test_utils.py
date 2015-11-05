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

"""Test utilities concerning the builtin time module"""



def configureTimeAndSleepMocks(timeMock, sleepMock):
  """Configure mocks for time.time and time.sleep such that every call
  to time.sleep(x) increments the return value of time.time() by x.

  :param timeMock: time.time mock
  :param sleepMock: time.sleep mock
  """

  class TimeContainer(object):
    accumulatedTime = 0.0

    @classmethod
    def getTime(cls):
      return cls.accumulatedTime

    @classmethod
    def sleep(cls, seconds):
      cls.accumulatedTime += seconds

  timeMock.side_effect = TimeContainer.getTime
  sleepMock.side_effect = TimeContainer.sleep
