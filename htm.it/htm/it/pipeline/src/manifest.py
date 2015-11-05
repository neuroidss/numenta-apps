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

"""
  manifest tool will run from jenkins or locally. This tool is responsible to
  analyze the parameters. We have set of parameters mandatory for arbitrary
  branch building. It will be assigning parameters which are passed to this task
  and the rest of the parameters would be set to its default values.
"""
import argparse
import json
import os

from infrastructure.utilities import jenkins
from infrastructure.utilities.diagnostics import initPipelineLogger
from infrastructure.utilities.path import mkdirp


def parseArgs():
  """
    Parse the command line arguments

    :returns: Dict containing parsed command line arguments
    :rtype: dict
  """
  parser = argparse.ArgumentParser(description="manifest tool to prepare"
                                   "environment for HTM-IT pipeline")
  parser.add_argument("--trigger-pipeline", dest="pipeline", type=str,
                      help="Repository which has triggered pipeline. This "
                      "pipeline will be triggered for changes in HTM-IT",
                      required=True)
  parser.add_argument("--sha", dest="sha", type=str,
                      help="Triggering SHA from HTM-IT", default="HEAD")
  parser.add_argument("--htm-it-branch", dest="htmitBranch", type=str,
                      help="The branch you are building from")
  parser.add_argument("--htm-it-remote", dest="htmitRemote", type=str,
                      default="git@github.com:Numenta/numenta-apps.git",
                      help="URL for HTM-IT remote repository")
  parser.add_argument("--release-version", dest="releaseVersion", type=str,
                       help="Current release version, this will be used as base"
                       "version for htm-it and tracking rpm")
  parser.add_argument("--log", dest="logLevel", type=str, default="warning",
                      help="Logging level, optional parameter and defaulted to"
                      "level warning")
  return parser.parse_args()


def main(args):
  """
    Main function for the pipeline. Executes all sub-tasks

    :param dict args: Parsed command line arguments

    :returns: /path/to/pipelineJson
    :rtype: str
  """
  logger = initPipelineLogger("manifest", logLevel=args.logLevel)
  buildWorkspace = os.environ.get("BUILD_WORKSPACE",
                                  jenkins.defineBuildWorkspace(logger=logger))
  mkdirp(buildWorkspace)

  manifest = vars(args)
  # Update buildWorkspace in manifest section for pipelineJson
  manifest.update({"buildWorkspace": buildWorkspace})
  manifestEnv = {"manifest": manifest}

  with open("%s/%s_pipeline.json" % (buildWorkspace, args.pipeline), 'w') as fp:
    fp.write(json.dumps(manifestEnv, ensure_ascii=False))

  logger.debug(json.dumps(manifestEnv))
  pipelineJsonPath = "%s/%s_pipeline.json" % (buildWorkspace, args.pipeline)
  logger.info("Pipeline JSON path: %s", pipelineJsonPath)
  return pipelineJsonPath


if __name__ == "__main__":

  main(parseArgs())
