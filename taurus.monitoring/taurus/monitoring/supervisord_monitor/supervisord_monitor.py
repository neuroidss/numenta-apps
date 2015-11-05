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
import types

from nta.utils import error_reporting
from nta.utils.supervisor_utils import SupervisorClient

from taurus.monitoring.monitor_dispatcher import MonitorDispatcher
from taurus.monitoring import (loadConfig,
                               loadEmailParamsFromConfig,
                               MonitorOptionParser)



class SupervisorMonitorError(Exception):
  pass



class SupervisorNotRunning(SupervisorMonitorError):
  pass



class SupervisorProcessInFatalState(SupervisorMonitorError):
  pass



class SupervisorChecker(MonitorDispatcher):

  parser = MonitorOptionParser()

  parser.add_option("--serverUrl",
                    help="Supervisor API (e.g. http://127.0.0.1:9001)")
  parser.add_option("--subjectPrefix",
                    help="Prefix to add to subject in emails")


  def __init__(self):
    options = self.parser.parse_options()

    self.server = SupervisorClient(options.serverUrl)
    self.subjectPrefix = options.subjectPrefix

    self.config = loadConfig(options)
    self.emailParams = loadEmailParamsFromConfig(self.config)


  def dispatchNotification(self, checkFn, excType, excValue, excTraceback):
    """  Send notification.

    :param function checkFn: The check function that raised an exception
    :param type excType: Exception type
    :param exception excValue: Exception value
    :param traceback excTraceback: Exception traceback

    Required by MonitorDispatcher abc protocol.
    """
    error_reporting.sendMonitorErrorEmail(
      monitorName=__name__ + ":" + checkFn.__name__,
      resourceName=repr(self),
      message=self.formatTraceback(excType, excValue, excTraceback),
      subjectPrefix=self.subjectPrefix,
      params=self.emailParams
    )



@SupervisorChecker.registerCheck
def checkSupervisordState(monitorObj):
  """ Check that supervisord is running
  """
  state = monitorObj.server.supervisor.getState()
  if not isinstance(state, types.DictType):
    raise SupervisorMonitorError("Unexpected response from"
                                 " `server.supervisor.getState()`: {}"
                                 .format(repr(state)))

  if state.get("statename") != "RUNNING":
    raise SupervisorNotRunning("Supervisor does not appear to be running:"
                               "{}".format(repr(state)))



@SupervisorChecker.registerCheck
def checkSupervisorProcesses(monitorObj):
  """ Check that there are no processes in a 'FATAL' state.
  """
  processes = monitorObj.server.supervisor.getAllProcessInfo()

  if not isinstance(processes, types.ListType):
    raise SupervisorMonitorError("Unexpected response from"
                                 " `server.supervisor.getAllProcessInfo()`: {}"
                                 .format(repr(processes)))

  for process in processes:
    if process.get("statename") == "FATAL":
      logTail = monitorObj.server.supervisor.tailProcessLog(
        process["group"] + ":" + process["name"], -2048, 2048)

      errMessage = ("{group}:{name} is in a FATAL state: {description}"
                    .format(group=process.get("group"),
                            name=process.get("name"),
                            description=process.get("description"))) + (
                    "\n\nLast 2048 bytes of log:" +
                    "\n\n=======================\n\n" +
                    logTail[0] +
                    "\n\n=======================\n")

      raise SupervisorProcessInFatalState(errMessage)
