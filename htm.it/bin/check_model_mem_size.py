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

"""Utility script for checking the in-memory size of a model checkpoint."""

import resource
import sys
import time

from nupic.frameworks.opf.modelfactory import ModelFactory



if __name__ == "__main__":
  helpMessage = "Usage: check_model_mem_size.py <path/to/checkpointDir>"
  if len(sys.argv) != 2:
    print helpMessage
    sys.exit(-1)
  elif sys.argv[1].strip() == "--help":
    print helpMessage
    sys.exit()

  originalMemory = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
  print "Original memory usage: ", originalMemory
  models = []
  for _ in xrange(10):
    s = time.time()
    models.append(ModelFactory.loadFromCheckpoint(sys.argv[1].strip()))
    print "Loaded model in %f seconds" % (time.time() - s)
    diff = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss - originalMemory
    average = float(diff) / len(models)
    print "Using %i bytes for %i models (%f average)." % (diff, len(models), average)
