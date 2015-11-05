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

"""Unit tests for nta.utils.test_utils.time_test_utils"""


import time
import unittest

from mock import Mock

from nta.utils.test_utils import time_test_utils



class TimeTestUtilsTestCase(unittest.TestCase):


  def testConfigureTimeAndSleepMocks(self):

    timeMock = Mock(spec_set=time.time)
    sleepMock = Mock(spec_set=time.sleep)

    time_test_utils.configureTimeAndSleepMocks(timeMock, sleepMock)

    originalTime = timeMock()

    # Try with floating point
    sleepMock(10.5)

    now = timeMock()

    self.assertEqual(now, originalTime + 10.5)

    # Try with whole number
    sleepMock(5)
    self.assertEqual(timeMock(), originalTime + 10.5 + 5)

