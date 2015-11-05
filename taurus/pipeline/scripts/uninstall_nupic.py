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
#

import glob
import os
import shutil
import sys

from pip.commands.uninstall import UninstallCommand



def removePackage(packageName, maxAttempts=10):
  """ Attempt to gracefully uninstall package with pip, followed by a an eager
  approach to remove vestiges of namespace packages and previous installations
  """

  UninstallCommand().main([packageName, "--yes", "--disable-pip-version-check"])

  # Remove vestiges of namespace packages, and other previous installations

  for path in sys.path:
    for filename in glob.glob(os.path.join(path, packageName + "*")):
      print "Removing {}".format(filename)
      if os.path.isdir(filename):
        shutil.rmtree(filename)
      else:
        os.unlink(filename)



if __name__ == "__main__":
  removePackage("nupic")
