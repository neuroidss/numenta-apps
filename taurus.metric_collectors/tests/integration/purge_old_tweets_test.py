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

from datetime import datetime, timedelta
import unittest
import uuid

import sqlalchemy as sql

from taurus.metric_collectors import collectorsdb
from taurus.metric_collectors import logging_support
from taurus.metric_collectors.collectorsdb import collectorsdb_test_utils
from taurus.metric_collectors.collectorsdb import schema
from taurus.metric_collectors.twitterdirect import purge_old_tweets



def setUpModule():
  logging_support.LoggingSupport.initTestApp()



class PurgeOldTweetsTestCase(unittest.TestCase):


  def testPurgeOldTweets(self):


    gcThresholdDays = 90

    now = datetime.utcnow()

    oldRows = [
      dict(
        uid=uuid.uuid1().hex,
        created_at=now - timedelta(days=gcThresholdDays + 1),
        retweet=False,
        lang="en-us"
      ),

      dict(
        uid=uuid.uuid1().hex,
        created_at=now - timedelta(days=gcThresholdDays + 2),
        retweet=False,
        lang="en-us"
      ),
    ]

    youngRows = [
      dict(
        uid=uuid.uuid1().hex,
        created_at=now,
        retweet=False,
        lang="en-us"
      ),

      dict(
        uid=uuid.uuid1().hex,
        created_at=now - timedelta(days=gcThresholdDays - 1),
        retweet=False,
        lang="en-us"
      ),

      dict(
        uid=uuid.uuid1().hex,
        created_at=now - timedelta(days=gcThresholdDays - 2),
        retweet=False,
        lang="en-us"
      ),
    ]

    allRows = oldRows + youngRows

    # Patch collectorsdb config to use a temporary database name
    with collectorsdb_test_utils.ManagedTempRepository("purgetweets"):
      engine = collectorsdb.engineFactory()

      numInserted = engine.execute(
        schema.twitterTweets.insert(),  # pylint: disable=E1120
        allRows
      ).rowcount

      self.assertEqual(numInserted, len(allRows))

      purge_old_tweets.purgeOldTweets(gcThresholdDays)

      # Verify that only the old tweets got purged
      rows = engine.execute(
        sql.select([schema.twitterTweets.c.uid])).fetchall()

      self.assertEqual(len(rows), len(youngRows))

      self.assertItemsEqual([row["uid"] for row in youngRows],
                            [row.uid for row in rows])







if __name__ == "__main__":
  unittest.main()
