#!/bin/bash
# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
# Numenta, Inc. a separate commercial license for this software code, the
# following terms and conditions apply:
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License version 3 as
# published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see http://www.gnu.org/licenses.
#
# http://numenta.org/licenses/
# ----------------------------------------------------------------------
#
# WARNING: THIS IS DESTRUCTIVE!  Continue reading for futher explanation.
#
# This scripts builds taurus and executes tests on a pair of already-running
# taurus server and collector instances.  Existing metrics will be unmonitored,
# and previously-saved model checkpoints will be deleted.

set -o errexit
set -o pipefail
set -o verbose
set -o nounset

SCRIPT=`which $0`
REPOPATH=`dirname "${SCRIPT}"`/../../..

pushd "${REPOPATH}"

  # Tear down existing metrics, stop metric collector services
  ssh -v -t "${TAURUS_COLLECTOR_USER}"@"${TAURUS_COLLECTOR_HOST}" \
    "taurus-unmonitor-metrics \
      --server=${TAURUS_SERVER_HOST} \
      --apikey=${TAURUS_SERVER_APIKEY} \
      --all \
      --modelsout=./unmonitor.json &&
     cd /opt/numenta/products/taurus.metric_collectors &&
     supervisorctl -s http://127.0.0.1:8001 shutdown"

  # Stop taurus services, cleanup checkpoints
  ssh -v -t "${TAURUS_SERVER_USER}"@"${TAURUS_COLLECTOR_HOST}" \
    "cd /opt/numenta/products/taurus &&
     supervisorctl -s http://127.0.0.1:9001 shutdown &&
     sudo /usr/sbin/nginx -p . -c conf/nginx-taurus.conf -s stop &&
     rm -rf /home/${TAURUS_SERVER_USER}/taurus_model_checkpoints/*"

  # Sync git histories with collector
  git fetch "${TAURUS_COLLECTOR_USER}"@"${TAURUS_COLLECTOR_HOST}":/opt/numenta/products
  git push "${TAURUS_COLLECTOR_USER}"@"${TAURUS_COLLECTOR_HOST}":/opt/numenta/products HEAD

  # Reset metric collector state, apply database schema
  ssh -v -t "${TAURUS_COLLECTOR_USER}"@"${TAURUS_COLLECTOR_HOST}" \
    "cd /opt/numenta/products &&
     git reset --hard ${COMMIT_SHA} &&
     ./install-taurus-metric-collectors.sh /opt/numenta/anaconda/lib/python2.7/site-packages /opt/numenta/anaconda/bin &&
     cd /opt/numenta/products/taurus.metric_collectors/taurus/metric_collectors/collectorsdb &&
     python migrate.py &&
     cd /opt/numenta/products/taurus.metric_collectors &&
     py.test ../nta.utils/tests/unit tests/unit"

  # Sync git histories with taurus server
  git fetch "${TAURUS_SERVER_USER}"@"${TAURUS_SERVER_HOST}":/opt/numenta/products
  git push "${TAURUS_SERVER_USER}"@"${TAURUS_SERVER_HOST}":/opt/numenta/products HEAD

  # Reset server state, apply database schema, start taurus services
  ssh -v -t "${TAURUS_SERVER_USER}"@"${TAURUS_SERVER_HOST}" \
    "cd /opt/numenta/products &&
     git reset --hard ${COMMIT_SHA} &&
     ./install-taurus.sh /opt/numenta/anaconda/lib/python2.7/site-packages /opt/numenta/anaconda/bin &&
     cd /opt/numenta/products/taurus/taurus/repository &&
     python migrate.py &&
     cd /opt/numenta/products/taurus &&
     py.test ../nta.utils/tests/unit ../htmengine/tests/unit tests/unit &&
     sudo /usr/sbin/nginx -p . -c conf/nginx-taurus.conf &&
     supervisord -c conf/supervisord.conf &&
     py.test ../nta.utils/tests/integration ../htmengine/tests/integration tests/integration"

  # Start metric collector services
  ssh -v -t "${TAURUS_COLLECTOR_USER}"@"${TAURUS_COLLECTOR_HOST}" \
    "cd /opt/numenta/products/taurus.metric_collectors  &&
     supervisord -c conf/supervisord.conf  &&
     py.test ../nta.utils/tests/integration tests/integration"

popd
