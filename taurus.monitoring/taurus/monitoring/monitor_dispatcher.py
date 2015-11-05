# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
# Numenta, Inc. a separate commercial license for this software code, the
# following terms and conditions apply:
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License version 3 as
# published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see http://www.gnu.org/licenses.
#
# http://numenta.org/licenses/
# ----------------------------------------------------------------------
from abc import ABCMeta, abstractmethod
import sys
import traceback



class MonitorDispatcher(object):
  __metaclass__ = ABCMeta

  _checks = []


  @abstractmethod
  def dispatchNotification(self, checkFn, excType, excValue, excTraceback):
    """ Send notification.  Implementation to be provided by subclass.

    :param function checkFn: The check function that raised an exception
    :param type excType: Exception type
    :param exception excValue: Exception value
    :param traceback excTraceback: Exception traceback
    """
    pass


  def checkAll(self):
    """ Run all previously-registered checks and send an email upon failure
    """
    for check in self._checks:
      try:
        check(self)
      except Exception:
        self.dispatchNotification(check,
                                  sys.exc_type,
                                  sys.exc_value,
                                  sys.exc_traceback)


  @staticmethod
  def formatTraceback(excType, excValue, excTraceback):
    """ Helper utility to format an exception and traceback into a str.  Alias
    for::

      "".join(traceback.format_exception(excType, excValue, excTraceback))

    :returns: str
    """
    return "".join(traceback.format_exception(excType, excValue, excTraceback))


  @classmethod
  def registerCheck(cls, fn):
    """ Function decorator to register an externally defined function as a
    check.  Function must accept a ServerProxy instance as its first
    argument.
    """
    cls._checks.append(fn)
