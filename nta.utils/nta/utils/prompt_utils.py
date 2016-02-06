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

"""Utilities for prompting user for input"""

import os
import Queue
import signal
import threading



class PromptTimeout(Exception):
  """The prompt timed out"""
  pass



def promptWithTimeout(promptText, timeout):
  """Prompt the user and return response text.

  :param str promptText: text to display to the user.
  :param float timeout: timeout for the prompt in seconds.

  :returns: response text
  :rtype: str

  :raises PromptTimeout: if the prompt timed out
  """
  timerExpiredQ = Queue.Queue()

  def onTimerExpiration():
    timerExpiredQ.put(1)
    # NOTE: thread.interrupt_main() doesn't unblock raw_input, so we use
    # SIGINT instead
    os.kill(os.getpid(), signal.SIGINT)


  timer = threading.Timer(timeout, onTimerExpiration)
  try:
    timer.start()
    if timerExpiredQ.empty():
      answer = raw_input(promptText)
  except KeyboardInterrupt:
    if timerExpiredQ.empty():
      raise
  finally:
    timer.cancel()

  if not timerExpiredQ.empty():
    raise PromptTimeout("Prompt timed out; timeout={}".format(timeout))

  return answer
