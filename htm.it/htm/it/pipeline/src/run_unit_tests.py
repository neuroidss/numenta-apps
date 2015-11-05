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

import argparse
import json
import os
import shutil

import xml.etree.ElementTree as ET
from subprocess import check_call, CalledProcessError

from infrastructure.utilities.env import prepareEnv
from infrastructure.utilities.exceptions import CommandFailedError, TestsFailed
from infrastructure.utilities.jenkins import getBuildNumber, getWorkspace
from infrastructure.utilities.diagnostics import initPipelineLogger
from infrastructure.utilities.path import changeToWorkingDir
from infrastructure.utilities.cli import runWithOutput



g_logger = None


def prepareResultsDir():
  """
    Make sure that a results directory exists in the right place. Return the
    path of the results directory.

    :returns: The full path of the results directory
    :rtype: String
  """
  resultsDir = os.path.join(getWorkspace(logger=g_logger), "results")
  if not os.path.exists(resultsDir):
    os.makedirs(resultsDir)
  return resultsDir



def runTestCommand(testCommand, env, outputFile=None):
  """
    Runs given test command with provided environment

    :param str testCommand: Test command that is suppose to be run
    :param dict env: Current environ set for HTM_IT_HOME, etc
    :param str outputFile: Optional, Path for output file where stdout should be
      redirected. It is passed only if the test are nonXunitTest, as the
      results are not generated as xml we need redirect them to a text file.
    :returns: return True if tests are successful, False otherwise
    :rtype: bool
  """
  try:
    if outputFile:
      check_call(testCommand, shell=True, env=env,
                 stdout=open(outputFile, "w"))
      # Updating console
      runWithOutput(command=("cat", outputFile), env=env, logger=g_logger)
    else:
      runWithOutput(command=testCommand, env=env, logger=g_logger)
    return True
  except (CalledProcessError, CommandFailedError):
    if outputFile:
      runWithOutput(command=("cat", outputFile), env=env, logger=g_logger)
    g_logger.error("Error executing %s\n*Most likely cause is a test FAILURE*",
                   testCommand)
    return False



def analyzeResults(resultsPath):
  """
    Reads results.xml and accordingly gives the status of test.

    :returns: returns True is all tests have passed else false.
    :rtype: Bool
  """
  successStatus = True
  results = ET.parse(resultsPath)
  failures = int(results.getroot().get("failures"))
  errors = int(results.getroot().get("errors"))
  if failures or errors:
    successStatus = False
  return successStatus



def runUnitTests(env, buildWorkspace):
  """
    Calls `htm-it/run_tests.sh` to run the unit tests

    :param dict env: Current environ set for HTM_IT_HOME, etc
    :param str buildWorkspace: /path/to/buildWorkspace

    :returns: return True if tests are successful
    :rtype: bool
  """
  rawResultsFile = os.path.join(buildWorkspace, "numenta-apps", "htm.it", "tests",
                                "results", "py2", "xunit", "jenkins",
                                "results.xml")
  finalResultsFile = os.path.join(prepareResultsDir(),
                                  "unit_tests_%s_results.xml" %
                                    getBuildNumber(logger=g_logger))


  with changeToWorkingDir(os.path.join(buildWorkspace, "numenta-apps", "htm.it")):
    try:
      runWithOutput(command=("./run_tests.sh --unit --language py --results "
                             "jenkins"),
                    env=env,
                    logger=g_logger)
    except CommandFailedError:
      g_logger.exception("Failed to run unit tests")
      raise
    finally:
      shutil.move(rawResultsFile, finalResultsFile)

  return analyzeResults(resultsPath=finalResultsFile)



def addAndParseArgs(jsonArgs):
  """
    Parse the command line arguments.

    :returns : pipeline, buildWorkspace, htmItSha, pipelineParams.
  """
  parser = argparse.ArgumentParser(description="test tool to run Test for "
                                   "HTM-IT. Provide parameters either "
                                   "via path for JSON file or commandline. "
                                   "Provinding both JSON parameter and as a "
                                   "commandline is prohibited. "
                                   "Use help for detailed information for "
                                   "parameters")
  parser.add_argument("--build-workspace", dest="buildWorkspace", type=str,
                      default=os.environ.get("BUILD_WORKSPACE"),
                      help="Common dir prefix for htm-it")
  parser.add_argument("--pipeline-json", dest="pipelineJson", type=str,
                      help="Path locator for build json file. This file should "
                      "have all parameters required by this script. Provide "
                      "parameters either as a command line parameters or as "
                      "individial parameters")
  parser.add_argument("--log", dest="logLevel", type=str, default="warning",
                      help="Logging level, optional parameter and defaulted to "
                      "level warning")

  args = {}
  if jsonArgs:
    args = jsonArgs
  else:
    args = vars(parser.parse_args())

  global g_logger
  g_logger = initPipelineLogger("run_tests", logLevel=args["logLevel"])

  g_logger.debug(args)
  saneParams = {k:v for k, v in args.items() if v is not None}

  del saneParams["logLevel"]

  if "pipelineJson" in saneParams and len(saneParams) > 1:
    parser.error("Please provide parameters via JSON file or commandline,"
                   "but not both")

  if "pipelineJson" in saneParams:
    with open(args["pipelineJson"]) as paramFile:
      pipelineParams = json.load(paramFile)
  else:
    pipelineParams = saneParams

  if saneParams.get("buildWorkspace"):
    buildWorkspace = saneParams.get("buildWorkspace")
  else:
    buildWorkspace = pipelineParams.get("manifest", {}).get("buildWorkspace")

  if buildWorkspace and pipelineParams:
    return (buildWorkspace, pipelineParams, args["pipelineJson"])
  else:
    parser.error("Please provide all parameters, "
                 "use --help for further details")



def main(jsonArgs=None):
  """
    Main function.

    :param jsonArgs: dict of pipeline-json and logLevel, defaults to empty
      dict to make the script work independently and via driver scripts.
      e.g. {"pipelineJson" : <PIPELINE_JSON_PATH>,
            "logLevel" : <LOG_LEVEL>}

  """
  jsonArgs = jsonArgs or {}
  testResult = False
  try:
    (buildWorkspace, pipelineParams, pipelineJson) = addAndParseArgs(jsonArgs)

    os.environ["BUILD_WORKSPACE"] = buildWorkspace
    env = prepareEnv(buildWorkspace, None, os.environ)

    testResult = runUnitTests(env=env, buildWorkspace=buildWorkspace)
    # Write testResult to JSON file if JSON file driven run
    if pipelineJson:
      pipelineParams["test"] = {"testStatus" : testResult}
      with open(pipelineJson, 'w') as fp:
        fp.write(json.dumps(pipelineParams, ensure_ascii=False))
      runWithOutput("cat %s" % pipelineJson)
    # In any case log success/failure to console and exit accordingly
    exitStatus = int(not testResult)
    if exitStatus:
      g_logger.error("Test Failure!!!")
      raise TestsFailed("Unit tests failed in HTM-IT pipeline")
    else:
      g_logger.debug("All tests passed")
    return exitStatus
  except:
    g_logger.exception("Unknown error occurred while running unit tests")
    raise



if __name__ == "__main__":
  main()
