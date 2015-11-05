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

"""Script to upload logs to S3."""

import datetime
import json
import logging
import optparse
import os
import re
import sys
import time

import boto

from htm.it.app import config

_LOGGER = logging.getLogger(__name__)
_USAGE = "Usage: upload_logs.py [--force] path/to/log/dir"

_AWS_ACCESS_KEY = config.get("aws", "aws_access_key_id")
_AWS_SECRET_KEY = config.get("aws", "aws_secret_access_key")
_BUCKET = "htm.it.logs"
_KEY_PREFIX = "upload/%s-" % config.get("usertrack", "htm_it_id")
_UPLOADED_DIR = "uploaded"
_UPLOAD_ATTEMPTS = 3

_ROTATION_FORMAT = r".*-\d{8}-\d{6}"



def run(logDir, force=False):
  """Upload logs from the specified directory if the customer is opted in."""
  # Ensure that logs are uploaded only for customers opted in.
  optedIn = config.get("usertrack", "optin") == "true"
  if not force and not optedIn:
    _LOGGER.info("Customer is not opted into log uploading, exiting.")
    sys.exit(0)

  conn = boto.connect_s3(_AWS_ACCESS_KEY, _AWS_SECRET_KEY)
  bucket = conn.get_bucket(_BUCKET, validate=False)
  _uploadLogs(bucket, logDir, _ROTATION_FORMAT)



def _uploadLogs(bucket, logDir, fileFormat):
  """Upload the logs of a given type.

  This is use the timestamp from the log timestamps file.

  Params:
    path: A glob specifying the file paths to upload.
  """
  uploadedDir = os.path.join(logDir, _UPLOADED_DIR)
  if not os.path.exists(uploadedDir):
    os.makedirs(uploadedDir)

  prog = re.compile(fileFormat)
  files = os.listdir(logDir)
  for f in files:
    if not prog.match(f):
      continue
    path = os.path.join(logDir, f)
    key = bucket.new_key(_KEY_PREFIX + f)
    for _ in xrange(_UPLOAD_ATTEMPTS):
      try:
        _LOGGER.info("Attempting upload to %s", f)
        key.set_contents_from_filename(path)
        _LOGGER.info("Upload to %s succeeded, moving local file to %s",
                     f, uploadedDir)
        finalPath = os.path.join(uploadedDir, f)
        os.rename(path, finalPath)
        break
      except ValueError as e:
        _LOGGER.warn("Upload to %s failed: %s", f, str(e))
        time.sleep(5)

  _LOGGER.info("Cleaning up old uploaded files...")
  files = os.listdir(uploadedDir)
  for f in files:
    path = os.path.join(uploadedDir, f)
    mtime = datetime.datetime.fromtimestamp(os.path.getmtime(path))
    now = datetime.datetime.now()
    if mtime < now - datetime.timedelta(days=7):
      _LOGGER.info("Removing file: %s", f)
      os.remove(path)

  _LOGGER.info("Done.")



if __name__ == "__main__":
  logging.basicConfig(level=logging.INFO)

  parser = optparse.OptionParser()
  parser.add_option("-f", "--force", action="store_true", dest="force",
                    default=False)
  options, args = parser.parse_args()

  if len(args) != 1:
    parser.error(_USAGE)

  run(args[0], force=options.force)
