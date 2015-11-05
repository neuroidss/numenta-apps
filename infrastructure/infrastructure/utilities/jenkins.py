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
 Plumbing methods for Jenkins.
"""

import os
import shutil

import xml.etree.ElementTree as ET

from infrastructure.utilities.git import (getCurrentSha,
                                          getGitRootFolder)
from infrastructure.utilities.path import mkdirp



def getTestResult(filename):
  """
    Get output by reading filename

    :param str filename: Name of .xml to be parsed

    :returns: True if the tests passed; false if the tests succeeded
    :rtype: bool
  """
  tree = ET.parse(filename)
  result = tree.getroot().items()[2][1]
  return True if int(result) is 0 else False



def getResultsDir(logger):
  """
    Returns the path to the test results folder in the workspace
    :returns: /path/to/resultsFolder
    :rtype: str
  """
  return os.path.join(getWorkspace(logger=logger), "results")



def defineBuildWorkspace(logger):
  """
    Define a build workspace

    :returns: /path/to/buildWorkspace as defined by the output of getWorkspace()
      and getBuildNumber(). Examples:
      - /opt/numenta/jenkins/workspace/htm-it-product-pipeline/build-123
      - ~/nta/numenta-apps/build-aa980430f4ae64d22f9a5327f79fa4dab706459c
    :rtype: str
  """
  return os.path.join(getWorkspace(logger), "build-" + getBuildNumber(logger))



def getWorkspace(logger):
  """
    Returns the path to the workspace in which things are being built

    :param logger: logger for additional debug info

    :raises infrastructure.utilities.exceptions.CommandFailedError: if
        the workspace env variable isn't set and you are running from outside of
        a git repo or the git command to find your current root folder fails.

    :returns: The value of the `WORKSPACE` environment variable, or the root
      folder of the current repo. This should be a folder path. Examples:
      - /opt/numenta/jenkins/workspace/htm-it-product-pipeline
      - ~/nta/numenta-apps
    :rtype: str
  """
  workspace = None
  if "WORKSPACE" in os.environ:
    workspace = os.environ["WORKSPACE"]
  else:
    workspace = getGitRootFolder(logger=logger)
  return workspace



def createOrReplaceDir(dirname, logger):
  """
    Creates a dirname dir in workspace. As a initial cleanup also
    deletes dirname if already present

    :param str dirname: Directory name that should be created inside workspace

    :returns: path to created dirname
    :rtype: str
  """
  workspace = getWorkspace(logger=logger)
  if os.path.exists(os.path.join(workspace, dirname)):
    shutil.rmtree("%s/%s" % (workspace, dirname))
  mkdirp("%s/%s" % (workspace, dirname))
  return os.path.join(workspace, dirname)


def createOrReplaceResultsDir(logger):
  """
    Creates a "results" dir in workspace. If one already exists, it will be
    deleted

    :param logger: logger for additional debug info

    :returns: path to created "results"

    :rtype: str
  """
  return createOrReplaceDir(dirname="results", logger=logger)



def getBuildNumber(logger):
  """
    Return the build number from either the user specified env var BUILD_NUMBER
    or use the current SHA of the active repo.

    :param logger: logger for additional debug info

    :raises infrastructure.utilities.exceptions.CommandFailedError:
      if the workspace env variable isn't set and you are running from outside
      of a git repo or the git command to find your current root folder fails.

    :returns: The value of the `BUILD_NUMBER` environment variable if set, or
      the current commit SHA of the git repo if it's not set.
    :rtype: str
  """
  buildNumber = None
  if "BUILD_NUMBER" in os.environ:
    buildNumber = os.environ["BUILD_NUMBER"]
  else:
    buildNumber = getCurrentSha(logger=logger)
  return buildNumber



def getKeyPath(keyFileName="chef_west.pem"):
  """
    Returns path to given keyFileName

    :param str keyFileName: Name of authorization key

    :returns: /path/to/keyFile
    :rtype: str
  """
  return os.path.join(os.environ.get("HOME"), ".ssh", keyFileName)


def createOrReplaceArtifactsDir(logger):
  """
    Creates an "artifacts" folder in the active workspace. If one already exists
    it will be replaced

    :returns: /path/to/artifacts
    :rtype: str
  """
  return createOrReplaceDir(dirname="artifacts", logger=logger)
