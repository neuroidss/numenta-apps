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

import logging
import os
import traceback

from sqlalchemy import create_engine

from nta.utils import sqlalchemy_utils

import htmengine.repository

import htm.it

from htm.it import htm_it_logging
from htm.it.app import config
from htm.it.app.repository.migrate import migrate
from htm.it.app.repository.queries import (
  addAnnotation,
  addAutostack,
  addDeviceNotificationSettings,
  addMetric,
  addMetricData,
  addMetricToAutostack,
  addNotification,
  batchAcknowledgeNotifications,
  batchSeeNotifications,
  clearOldNotifications,
  deleteAnnotationById,
  deleteAutostack,
  deleteMetric,
  deleteModel,
  deleteStaleNotificationDevices,
  getAllNotificationSettings,
  getAnnotationById,
  getAnnotations,
  getAutostack,
  getAutostackList,
  getAutostackFromMetric,
  getAutostackForNameAndRegion,
  getAutostackMetrics,
  getAutostackMetricsWithMetricName,
  getAutostackMetricsPendingDataCollection,
  getCloudwatchMetrics,
  getCloudwatchMetricsForNameAndServer,
  getCloudwatchMetricsPendingDataCollection,
  getCustomMetricByName,
  getCustomMetrics,
  getDeviceNotificationSettings,
  getInstanceCount,
  getInstances,
  getInstanceStatusHistory,
  getAllMetrics,
  getAllMetricsForServer,
  getAllModels,
  getMetric,
  getMetricWithSharedLock,
  getMetricWithUpdateLock,
  getMetricCountForServer,
  getMetricData,
  getMetricDataCount,
  getProcessedMetricDataCount,
  getMetricDataWithRawAnomalyScoresTail,
  getMetricIdsSortedByDisplayValue,
  getMetricStats,
  getNotification,
  getUnprocessedModelDataCount,
  getUnseenNotificationList,
  listMetricIDsForInstance,
  saveMetricInstanceStatus,
  setMetricCollectorError,
  setMetricLastTimestamp,
  setMetricStatus,
  updateDeviceNotificationSettings,
  updateMetricColumns,
  updateMetricColumnsForRefStatus,
  updateMetricDataColumns,
  updateNotificationDeviceTimestamp,
  updateNotificationMessageId,
  lockOperationExclusive,
  OperationLock)


retryOnTransientErrors = sqlalchemy_utils.retryOnTransientErrors



g_log = logging.getLogger("htm-it.repository")



def getDSN():
  return htmengine.repository.getDSN(config)



def getUnaffiliatedEngine():
  return htmengine.repository.getUnaffiliatedEngine(config)



def getDbDSN():
  config.loadConfig()
  return htmengine.repository.getDbDSN(config)



def engineFactory(reset=False):
  """SQLAlchemy engine factory method

  See http://docs.sqlalchemy.org/en/rel_0_9/core/connections.html

  :param reset: Force a new engine instance.  By default, the same instance is
    reused when possible.
  :returns: SQLAlchemy engine object
  :rtype: sqlalchemy.engine.Engine

  Usage::

      from htm.it.app import repository
      engine = repository.engineFactory()
  """
  config.loadConfig()
  return htmengine.repository.engineFactory(config, reset)



def reset(offline=False):
  """
  Reset the htm-it database; upon successful completion, the necessary schema
  are created, but the tables are not populated

  :param offline: False to execute SQL commands; True to just dump SQL commands
    to stdout for offline mode or debugging
  """
  # Make sure we have the latest version of configuration
  config.loadConfig()
  dbName = config.get('repository', 'db')

  resetDatabaseSQL = (
    "DROP DATABASE IF EXISTS %(database)s; "
    "CREATE DATABASE %(database)s;" % {"database": dbName})
  statements = resetDatabaseSQL.split(";")

  engine = getUnaffiliatedEngine()
  with engine.connect() as connection:
    for s in statements:
      if s.strip():
        connection.execute(s)

  migrate(offline=offline)
