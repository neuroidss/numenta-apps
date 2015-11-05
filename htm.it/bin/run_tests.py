#!/usr/bin/env python
# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2013, Numenta, Inc.  Unless you have purchased from
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
import os
import sys

from subprocess import call
from datetime import datetime
from optparse import OptionParser

import pytest


def collectSet(option, opt_str, value, parser): #pylint: disable=C0103, W0613
  """ Collect multiple option values into a single set.  Used in conjunction
  with callback argument to OptionParser.add_option().
  """

  assert value is None
  value = set([])

  for arg in parser.rargs:
    if arg[:1] == "-":
      break
    value.add(arg)

  del parser.rargs[:len(value)]
  setattr(parser.values, option.dest, value)


def collectList(option, opt_str, value, parser): #pylint: disable=C0103, W0613
  """ Collect multiple option values into a single list.  Used in conjunction
  with callback argument to OptionParser.add_option().
  """

  assert value is None
  value = []

  for arg in parser.rargs:
    if arg[:1] == "-":
      break
    value.append(arg)

  del parser.rargs[:len(value)]
  setattr(parser.values, option.dest, value)


parser = OptionParser(usage="%prog [options]\n\nRun HTM-IT Engine tests.")
parser.add_option(
  "-a",
  "--all",
  action="store_true",
  default=False,
  dest="all")
parser.add_option(
  "--ami",
  action="store_true",
  default=False,
  dest="ami")
parser.add_option(
  "--chef",
  action="store_true",
  default=False,
  dest="chef")
parser.add_option(
  "-c",
  "--coverage",
  action="store_true",
  default=False,
  dest="coverage")
parser.add_option(
  "-i",
  "--integration",
  action="store_true",
  default=False,
  dest="integration")
parser.add_option(
  "-n",
  "--num",
  dest="processes")
parser.add_option(
  "-r",
  "--results",
  dest="results",
  action="callback",
  callback=collectList)
parser.add_option(
  "-s",
  dest="tests",
  action="callback",
  callback=collectSet)
parser.add_option(
  "-l", "--language",
  default=None,
  dest="testLanguage")
parser.add_option(
  "-u",
  "--unit",
  action="store_true",
  default=False,
  dest="unit")
parser.add_option(
  "-x",
  "--failfast",
  action="store_true",
  default=False,
  dest="failfast")
parser.add_option(
  "-y",
  "--nightly",
  action="store_true",
  default=False,
  dest="nightly")

def main(parser, parseArgs):
  """ Parse CLI options and execute tests """

  # Extensions to test spec (args not part of official test runner)

  parser.add_option("-v", "--verbose",
    action="store_true",
    dest="verbose")

  # Parse CLI args

  (options, tests) = parser.parse_args(args=parseArgs)

  tests = set(tests)

  # Translate spec args to py.test args

  args = ["--boxed", "--verbose"]

  root = "tests"

  if options.coverage:
    args.append("--cov=htm-it")

  if options.processes is not None:
    args.extend(["-n", options.processes])

  if options.results is not None:
    results = options.results[:2]

    if results:
      runid = results.pop(0)
    else:
      runid = datetime.now().strftime('%Y%m%d%H%M%S')

    results = os.path.join(root, "results", "py2", "xunit", str(runid))

    try:
      os.makedirs(results)
    except os.error:
      pass

    args.append("--junit-xml=" + os.path.join(results, "results.xml"))

  if options.tests is not None:
    tests.update(options.tests)

  if options.ami or options.all:
    tests.add(os.path.join(root, "py", "ami"))

  if options.unit or options.all:
    tests.add(os.path.join(root, "py", "unit"))
    tests.add(os.path.join("..", "htmengine", root, "unit"))
    tests.add(os.path.join("..", "nta.utils", root, "unit"))

  if options.integration or options.all:
    tests.add(os.path.join(root, "py", "integration"))
    tests.add(os.path.join("..", "htmengine", root, "integration"))
    tests.add(os.path.join("..", "nta.utils", root, "integration"))

  if options.nightly or options.all:
    tests.add(os.path.join(root, "py", "nightly"))

  if options.verbose:
    args.append("-v")

  if options.failfast:
    args.append("-x")

  if not tests or options.all:
    tests.add(os.path.join(root, "py", "unit"))
    tests.add(os.path.join("..", "htmengine", root, "unit"))
    tests.add(os.path.join("..", "nta.utils", root, "unit"))

  results = {}

  # Run tests
  if options.testLanguage is None or options.testLanguage == "py":
    print "Running Python tests..."
    results["py"] = pytest.main(args + list(tests))

  if options.testLanguage is None or options.testLanguage == "js":
    print "Running JavaScript tests..."
    results["js"] = call(["npm", "test"])

  if any(results.values()):
    # One of the language-specific test runs failed, return non-zero
    return 1

  return 0

if __name__ == "__main__":
  result = main(parser, sys.argv[1:])
  sys.exit(result)
