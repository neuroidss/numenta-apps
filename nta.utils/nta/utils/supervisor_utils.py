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
from urlparse import urljoin
import xmlrpclib



class SupervisorClient(xmlrpclib.Server):
  def __init__(self, serverUrl):
    """
    Supervisord xmlrpclib.Server wrapper

    :param str serverUrl: Supervisor API (e.g. http://127.0.0.1:9001)

    Usage::

        from nta.utils.supervisor_utils import SupervisorClient

        client = SupervisorClient("http://127.0.0.1:9001")

        server.supervisor.getState()

        if state.get("statename") != "RUNNING":
          raise Exception("Supervisord is not running")


    See http://supervisord.org/api.html for additional API details

    """
    xmlrpclib.Server.__init__(self, urljoin(serverUrl, "RPC2"))
