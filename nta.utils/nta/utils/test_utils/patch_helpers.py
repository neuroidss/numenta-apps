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
import datetime
from mock import Mock, patch



def patchCLIArgs(programName, *cliArgs):
  """ Patch decorator helper for patching `sys.argv`, useful for mocking CLI
  arguments.

  Usage::

    @patch_helpers.patchCLIArgs("taurus-model-latency-monitor",
                                "--monitorConfPath",
                                os.path.join(_CONF_DIR, "test.conf"),
                                "--metricDataTable",
                                "taurus.metric_data.test")

  :param str programName: Program name; i.e. first component in `sys.argv`
  :param sequence *cliArgs: Remaining command line arguments.
  :returns: Decorated function in which `sys.argv` contains the arguments
  """
  return patch("sys.argv", [programName] + list(cliArgs))


def patchUTCNow(utcnow):
  """ Patch decorator helper for patching `datetime.datetime` to some fixed
  value for `utcnow()`.  Python builtin types, including datetime.datetime,
  which is partially implemented in C, are immutable and cannot be patched
  directly.  This decorator provides a simple, straight-forward decorator that
  works around the immutability problem, allowing you to affix the value
  returned by `datetime.datetime.utcnow()`.

  Usage::

    @patch_helpers.patchUTCNow(datetime.datetime(2015, 11, 1, 22, 41, 0, 0))

  :param datetime.datetime utcnow: Timestamp value to which `utcnow()` will be
    fixed in context of patched function
  """
  return patch("datetime.datetime", Mock(wraps=datetime.datetime,
                                         utcnow=Mock(return_value=utcnow)))


def patchNow(now):
  """ Patch decorator helper for patching `datetime.datetime` to some fixed
  value for `now()`.  Python builtin types, including datetime.datetime,
  which is partially implemented in C, are immutable and cannot be patched
  directly.  This decorator provides a simple, straight-forward decorator that
  works around the immutability problem, allowing you to affix the value
  returned by `datetime.datetime.now()`.

  Usage::

    @patch_helpers.patchNow(datetime.datetime(2015, 11, 1, 22, 41, 0, 0))

  :param datetime.datetime now: Timestamp value to which `now()` will be
    fixed in context of patched function
  """
  return patch("datetime.datetime", Mock(wraps=datetime.datetime,
                                         now=Mock(return_value=now)))
