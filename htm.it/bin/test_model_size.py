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

"""Utility script for creating a large model."""

import time
import optparse
import random
import sys

from grokcli.api import GrokSession

from htm.it.app import config

DEFAULT_RECORDS = 80000

RECORDS_BEFORE_MONITOR = 288



def run(server, apiKey, metricName, resource, numRecords):
  htmIt = Grokession(server=server, apikey=apiKey)

  inc = 300
  currentTimestamp = int(time.time()) - (numRecords * inc)
  with htmIt.connect() as sock:

    for i in xrange(numRecords):
      value = random.random()

      sock.sendall("%s %f %d\n" % (metricName, value, currentTimestamp))

      currentTimestamp += inc

      if i % 100 == 99:
        print ".",
        sys.stdout.flush()

      if i == RECORDS_BEFORE_MONITOR:
        print
        print "Creating model...",
        sys.stdout.flush()
        # Monitor the metric
        modelSpec = {"metric": metricName, "datasource": "custom"}
        if resource is not None:
          modelSpec["resource"] = resource
        model = htmIt.createModel(modelSpec)
        print "done"



if __name__ == "__main__":
  parser = optparse.OptionParser()
  parser.add_option("--server", default="https://localhost",
                    help="Server address of HTM-IT instance.")
  parser.add_option("--apiKey", default=None,
                    help="API key for the HTM-IT instance.")
  parser.add_option("--metricName", default=None,
                    help="Name to give the new metric.")
  parser.add_option("--resource", default=None,
                    help="Name to give the new metric.")
  parser.add_option("-n", "--numRecords", default=DEFAULT_RECORDS,
                    type="int", help="The number of records to send.")
  options, _ = parser.parse_args()

  apiKey = options.apiKey or config.get("security", "apikey")
  metricName = options.metricName or "test.%f" % time.time()

  run(options.server, apiKey, metricName, options.resource, options.numRecords)
