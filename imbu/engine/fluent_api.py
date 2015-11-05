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
Implements Imbu's web API.
"""

import json
import logging
import pkg_resources
import web

from fluent.experiments.runner import Runner as FluentRunner

g_log = logging.getLogger(__name__)


def addStandardHeaders(contentType="application/json; charset=UTF-8"):
  """
  Add Standard HTTP Headers ("Content-Type", "Server") to the response.

  Here is an example of the headers added by this method using the default
  values::

      Content-Type: application/json; charset=UTF-8
      Server: Imbu x.y.z

  :param content_type: The value for the "Content-Type" header.
                       (default "application/json; charset=UTF-8")
  """
  web.header("Server", "Imbu 1.0.0", True)
  web.header("Content-Type", contentType, True)


def addCORSHeaders():
  """
  Add CORS (http://www.w3.org/TR/cors/) headers
  """
  web.header("Access-Control-Allow-Origin", "*", True)
  web.header("Access-Control-Allow-Headers",
             "accept, access-control-allow-origin, content-type", True)
  web.header("Access-Control-Allow-Credentials", "true", True)
  web.header("Access-Control-Allow-Methods", "POST", True)


class FluentWrapper(object):
  """ Wraps nupic.fluent Model """

  def __init__(self, dataPath):
    """
    initializes nupic.fluent model with given sample data

    :param str dataPath: Path to sample data file.
                         Must be a CSV file having 'ID and 'Sample' columns
    """
    g_log.info("Initialize nupic.fluent")
    # Initialize nupic.fluent model runner
    self._fluent = FluentRunner(dataPath=dataPath,
                        resultsDir="",
                        experimentName="imbu_fingerprints",
                        load=False,
                        modelName="ClassificationModelFingerprint",
                        modelModuleName="fluent.models.classify_fingerprint",
                        numClasses=1,  # must be >0 to go through training
                        plots=0,
                        orderedSplit=False,
                        trainSizes=[],
                        verbosity=0)

    # Train model with given sample data
    self._fluent.initModel()
    self._fluent.setupData()
    self._fluent.trainSize = len(self._fluent.samples)
    self._fluent.encodeSamples()
    self._fluent.resetModel(0)

    for i in range(self._fluent.trainSize):
      self._fluent.model.trainModel(i)


  def query(self, text):
    """ Queries fluent model and returns an ordered list of matching documents.

    :param str text: The text to match.

    :returns: a sequence of matching samples.

    ::
    [
        {"id": "1", "text": "sampleText", "score": "0.75"},
        ...
    ]
    """
    results = []
    if text:
      g_log.info("Query model for : %s", text)
      sampleIDs, sampleDists = self._fluent.model.queryModel(text, False)
      for sID, dist in zip (sampleIDs, sampleDists):
        results.append({"id": sID,
                        "text": self._fluent.dataDict[sID][0],
                        "score": dist.item()})

    return results



class DefaultHandler(object):
  def GET(self):  # pylint: disable=R0201,C0103
    addStandardHeaders("text/html; charset=UTF-8")
    return "<html><body><h1>Welcome to Nupic Fluent</h1></body></html>"



class FluentAPIHandler(object):
  """ Handles Fluent API Requests """

  def OPTIONS(self): # pylint: disable=R0201,C0103
    addStandardHeaders()
    addCORSHeaders()


  def POST(self): # pylint: disable=R0201,C0103
    addStandardHeaders()
    addCORSHeaders()

    response = []

    data = web.data()
    if data:
      if isinstance(data, basestring):
        response = g_fluent.query(data)
      else:
        raise web.badrequest("Invalid Data. Query data must be a string")

    else:
      # sample data is missing
      g_log.error("sample data is missing, raising BadRequest exception")
      raise web.badrequest("Sample data is missing")

    return json.dumps(response)



urls = (
    "", "DefaultHandler",
    "/", "DefaultHandler",
    "/fluent", "FluentAPIHandler"
)
app = web.application(urls, globals())

# Create nupic.fluent model runner
g_fluent = FluentWrapper(pkg_resources.resource_filename(__name__, "data.csv"))

if __name__ == "__main__":
  app.run()

application = app.wsgifunc()
