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
    die "Please cd to HTM-IT repo dir, and run: bin/dev/web/stop.sh"
fi
if [[ ! $SCRIPT_DIR =~ bin\/dev\/web ]]; then
    die "Please cd to HTM-IT repo dir, and run: bin/dev/web/stop.sh"
fi

echo "Shutting down supervisor..."
supervisorctl shutdown
echo "Stopping nginx..."
sudo nginx -s stop -p $START_DIR -c $START_DIR/conf/htm-it-api.conf
echo "RabbitMQ stopping app..."
rabbitmqctl stop_app
echo "RabbitMQ resetting..."
rabbitmqctl reset
echo "RabbitMQ stopping..."
rabbitmqctl stop
echo "MySQL stopping..."
mysql.server stop
echo "done."

exit 0
