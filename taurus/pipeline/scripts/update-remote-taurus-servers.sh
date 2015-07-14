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
# This script updates a running pair of taurus server and metric collector
# instances.  This is not destructive, and requires only minimal downtime for
# the collector instance and a brief period of time during which the collector
# remains in "hot_stanby" mode while the taurus server is updated.

set -o errexit
set -o pipefail
set -o verbose
set -o nounset

SCRIPT=`which $0`
REPOPATH=`dirname "${SCRIPT}"`/../../..

pushd "${REPOPATH}"

  # Sync git histories with collector
  git fetch "${TAURUS_COLLECTOR_USER}"@"${TAURUS_COLLECTOR_HOST}":/opt/numenta/products
  git push "${TAURUS_COLLECTOR_USER}"@"${TAURUS_COLLECTOR_HOST}":/opt/numenta/products HEAD

  # Reset metric collector state, apply database schema updates
  ssh -v -t "${TAURUS_COLLECTOR_USER}"@"${TAURUS_COLLECTOR_HOST}" \
    "cd /opt/numenta/products &&
     taurus-collectors-set-opmode hot_standby &&
     supervisorctl -s http://127.0.0.1:8001 restart all &&
     git reset --hard ${COMMIT_SHA} &&
     ./install-taurus-metric-collectors.sh /opt/numenta/anaconda/lib/python2.7/site-packages /opt/numenta/anaconda/bin &&
     cd /opt/numenta/products/taurus.metric_collectors/taurus/metric_collectors/collectorsdb &&
     python migrate.py"

  # Stop taurus services
  ssh -v -t "${TAURUS_SERVER_USER}"@"${TAURUS_COLLECTOR_HOST}" \
    "cd /opt/numenta/products/taurus &&
     supervisorctl -s http://127.0.0.1:9001 shutdown &&
     sudo /usr/sbin/nginx -p . -c conf/nginx-taurus.conf -s stop"

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
     sudo /usr/sbin/nginx -p . -c conf/nginx-taurus.conf &&
     supervisord -c conf/supervisord.conf"

  # Return metric collector to active state
  ssh -v -t "${TAURUS_COLLECTOR_USER}"@"${TAURUS_COLLECTOR_HOST}" \
    "taurus-collectors-set-opmode active
     cd /opt/numenta/products/taurus.metric_collectors/
     supervisorctl -s http://127.0.0.1:8001 restart all"

popd
