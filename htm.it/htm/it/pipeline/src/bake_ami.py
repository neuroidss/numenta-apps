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
import yaml

from pkg_resources import resource_stream

from infrastructure.utilities.cli import runWithOutput
from infrastructure.utilities.exceptions import (
  MissingAWSKeysInEnvironment,
  PipelineError,
  TestsFailed
)
from infrastructure.utilities.jenkins import (
  createOrReplaceArtifactsDir,
  getBuildNumber
)
from infrastructure.utilities.diagnostics import initPipelineLogger
from infrastructure.utilities.path import changeToWorkingDir
from infrastructure.utilities.s3 import uploadToS3


g_config = yaml.load(resource_stream(__name__, "../conf/config.yaml"))


S3_YUM_BUCKET = "public.numenta.com"



def addAndParseArgs(jsonArgs):
  """
    Parse, sanitize and process command line arguments.

    :param jsonArgs: dict of pipeline-json and logLevel, defaults to empty
      dict to make the script work independently and via driver scripts.
      e.g. {"pipelineJson": <PIPELINE_JSON_PATH>,
            "logLevel": <LOG_LEVEL>}


    :returns: A dict containing releaseVersion, buildWorkspace, htmItSha,
    deployTrack, htmItDeployTrack, amiName (all strings).

    Example dict:
    {
      "releaseVersion": "1.7.0,
      "buildWorkspace": "/path/to/Workspace",
      "htmItSha": "0xDEADBEEF",
      "deployTrack": "production",
      "htmItDeployTrack": "production",
      "amiName": "htm-it-pipeline"
    }

    :rtype: dict of strings

    :raises MissingCommandLineArgument when missing expected parameters
    :raises ConflictingCommandLineArguments when pipelineJson and other
      conflicting parameters set
  """
  parser = argparse.ArgumentParser(description="Tool to bake AMI with "
                                   "given version of HTM-IT")
  parser.add_argument("--htm-it-sha", dest="htmItSha", type=str,
                      help="SHA from HTM-IT used for this build")
  parser.add_argument("--release-version", dest="releaseVersion", type=str,
                      help="Current release version, this will be used as base")
  parser.add_argument("--htm-it-deploy-track", dest="htmItDeployTrack", type=str,
                      help="Deploy track for htm-it RPM")
  parser.add_argument("--ami-name", dest="amiName", type=str,
                      help="Descriptive key to be used with auto generated ami"
                      "name")
  parser.add_argument("--build-workspace", dest="buildWorkspace", type=str,
                      help="Common dir prefix for htm-it")
  parser.add_argument("--pipeline-json", dest="pipelineJson", type=str,
                      help="Path locator for build json file. This file should"
                      "have all parameters required by this script. Provide"
                      "parameters either as a command line parameters or as"
                      "individial parameters")
  parser.add_argument("--log", dest="logLevel", type=str, default="warning",
                      help="Logging level, optional parameter and defaulted to"
                      "level warning")

  args = {}
  if jsonArgs:
    args = jsonArgs
  else:
    args = vars(parser.parse_args())

  global g_logger
  g_logger = initPipelineLogger("bake_ami", logLevel=args["logLevel"])
  saneParams = {k:v for k, v in args.items() if v is not None}
  del saneParams["logLevel"]

  if "pipelineJson" in saneParams and len(saneParams) > 1:
    errorMessage = "Please provide parameters via JSON file or commandline"
    g_logger.error(errorMessage)
    parser.error(errorMessage)

  if "pipelineJson" in saneParams:
    with open(args["pipelineJson"]) as paramFile:
      pipelineParams = json.load(paramFile)
  else:
    pipelineParams = saneParams

  releaseVersion = pipelineParams.get("releaseVersion",
                     pipelineParams.get("manifest", {}).get("releaseVersion"))

  buildWorkspace = os.environ.get("BUILD_WORKSPACE",
                     pipelineParams.get("buildWorkspace",
                     pipelineParams.get("manifest", {}).get("buildWorkspace")))

  htmItSha = pipelineParams.get("htmItSha",
              pipelineParams.get("build", {}).get("htmItSha"))
  amiName = pipelineParams.get("amiName",
              pipelineParams.get("build", {}).get("amiName"))
  pipelineJson = args["pipelineJson"]
  if releaseVersion and buildWorkspace and htmItSha and amiName:
    return {"releaseVersion": releaseVersion,
            "buildWorkspace": buildWorkspace,
            "htmItSha": htmItSha,
            "amiName": amiName,
            "pipelineJson": pipelineJson}
  else:
    parser.error("Please provide all parameters, "
                 "Use --help for further details")



def main(jsonArgs=None):
  """
    Creates an AMI using a HTM-IT RPM for a given SHA.

    1) Downloads the HTM-IT RPM corresponding to a given SHA to local disk
    2) Calls bake_ami.sh with the name of the HTM-IT RPM and the AMI name.
     to launch an instance with Packer, install the
       HTM-IT RPM from 1 products, runs integration
       tests, if green then stamps AMI

  """
  try:
    jsonArgs = jsonArgs or {}
    parsedArgs = addAndParseArgs(jsonArgs)

    amiName = parsedArgs["amiName"]

    if not (os.environ.get("AWS_ACCESS_KEY_ID") and
            os.environ.get("AWS_SECRET_ACCESS_KEY")):
      g_logger.error("Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
      raise MissingAWSKeysInEnvironment("AWS keys are not set")
    else:
      g_config["AWS_ACCESS_KEY_ID"] = os.environ["AWS_ACCESS_KEY_ID"]
      g_config["AWS_SECRET_ACCESS_KEY"] = os.environ["AWS_SECRET_ACCESS_KEY"]

    artifactsDir = createOrReplaceArtifactsDir(logger=g_logger)

    g_logger.info("Creating the Ami")
    pipeLineSrc = os.path.join(os.environ["PRODUCTS"], "htm.it", "htm", "it",
                               "pipeline", "src")
    with changeToWorkingDir(pipeLineSrc):
      g_logger.info("\n\n########## Baking AMI ##########")
      g_logger.debug("########## AMI Name: %s ##########", amiName)

      # Baking AMI takes around 15 mins, so print as it runs so we see
      # progress in the jenkins console during the run
      runWithOutput("./bake_ami %s" % amiName, env=os.environ, logger=g_logger)

      amiIDPath = os.path.join(os.getcwd(), "ami.txt")

    with open(amiIDPath, "r") as amiFileHandler:
      readAmiId = (amiFileHandler.readline()).split(":")
      amiID = readAmiId[1].strip()
      g_logger.info("AMI ID generated is: %s", amiID)

    buildNumber = getBuildNumber(logger=g_logger)
    artifactAmiIdPath = os.path.join(artifactsDir, "ami_%s.txt" % buildNumber)
    shutil.copy(amiIDPath, artifactAmiIdPath)
    print "#############################################################"
    print "Running the Integration Tests"
    runIntegrationTestScriptPath = os.path.join(os.environ["PRODUCTS"],
                                                "htm.it", "htm", "it",
                                                "pipeline", "src")
    runIntegrationTestCommand = ("python " +
                                 "%s/run_htm_it_integration_tests.py"
                                 % runIntegrationTestScriptPath +
                                 " --ami " + amiID)
    if parsedArgs["pipelineJson"]:
      runIntegrationTestCommand += (" --pipeline-json %s"
                                    % parsedArgs["pipelineJson"])

    g_logger.info(runIntegrationTestCommand)
    runWithOutput(runIntegrationTestCommand, env=os.environ, logger=g_logger)

    #Load the json file again and check the status of test
    with open(parsedArgs["pipelineJson"]) as jsonFile:
      params = json.load(jsonFile)
      integrationTestStatus = params.get("integration_test").get("testStatus")
    # Upload the ami-id to S3 if the pipeline was triggred with production
    # forks.
    if integrationTestStatus:
      g_logger.info("Uploading %s to S3 which contains the generated AMI: %s",
                    os.path.basename(artifactAmiIdPath), amiID)
      uploadToS3(config=g_config,
                 filePath=artifactAmiIdPath,
                 s3Folder="stable_ami",
                 logger=g_logger)
      g_logger.debug("Uploading %s to S3 which contains the generated AMI: %s",
                     os.path.basename(amiIDPath), amiID)
      uploadToS3(config=g_config,
                 filePath=amiIDPath,
                 s3Folder="stable_ami",
                 logger=g_logger)

  except TestsFailed:
    g_logger.error("There was a failure executing the HTM-IT integration tests")
    raise
  except PipelineError:
    g_logger.exception("External process failed while baking the AMI")
    raise
  except Exception:
    g_logger.exception("Unknown error occurred while baking the AMI")
    raise



if __name__ == "__main__":
  main()
