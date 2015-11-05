#!/bin/bash
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

SCRIPT=${BASH_SOURCE[0]}
SCRIPT_DIR=$(dirname $SCRIPT)
START_DIR=$PWD

function die {
    echo $1
    exit 1
}

if [[ ! $START_DIR =~ htm.it ]]; then
    die "Please cd to HTM-IT repo dir, and run: bin/dev/web/start.sh"
fi
if [[ ! $SCRIPT_DIR =~ bin\/dev\/web ]]; then
    die "Please cd to HTM-IT repo dir, and run: bin/dev/web/start.sh"
fi

echo "MySQL starting..."
mysql.server start
echo "RabbitMQ starting..."
rabbitmq-server -detached
echo "Nginx starting..."
sudo nginx -p . -c $START_DIR/conf/htm-it-api.conf
echo "Supervisor starting..."
supervisord -c $START_DIR/conf/supervisord.conf
echo "done."

exit 0
