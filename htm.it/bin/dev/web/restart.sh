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
    die "Please cd to HTM-IT repo dir, and run: bin/dev/web/restart.sh"
fi
if [[ ! $SCRIPT_DIR =~ bin\/dev\/web ]]; then
    die "Please cd to HTM-IT repo dir, and run: bin/dev/web/restart.sh"
fi

echo "Stopping..."
$START_DIR/bin/dev/web/stop.sh || exit
echo "Starting..."
$START_DIR/bin/dev/web/start.sh || exit

exit 0
