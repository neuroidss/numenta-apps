#!/usr/bin/env bash
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

set -o nounset
set -o pipefail

export NUMENTA=/opt/numenta

mkdir -p /etc/htm.it

# If you stop writing to $STAMPFILE, or change the path, you will break
# integration testing. The integration test suite uses the presence of
# $STAMPFILE to tell that the htm-it services have been configured.
STAMPFILE="/etc/htm.it/firstboot.run"
export PIP_SCRATCH_D=$(mktemp --directory /tmp/pip_scratch_d.XXXXX)

log_info() {
  echo "$*"
  logger -t firstboot-root -p local0.info "$*"
}

log_error() {
  echo "$*"
  logger -t firstboot-root -p local0.error "$*"
}

die() {
  log_error "$*"
  exit 1
}

if [ -r /etc/htm.it/supervisord.vars ]; then
  log_info "Loading environment from /etc/htm.it/supervisord.vars"
  source /etc/htm.it/supervisord.vars
else
  die "Could not load supervisord.vars"
fi

initialize_htm-it() {
  pushd "${HTM_IT_HOME}"
    log_info "Running htm-it init"
    python setup.py init 2>&1
    if [ "$?" -ne 0 ]; then
      die "python setup.py init failed in ${HTM_IT_HOME}"
    fi
  popd
}

set_htm_it_edition() {
  log_info "Setting edition"
  EDITION="standard"
  "${HTM_IT_HOME}/bin/set_edition.py" "${EDITION}"
  if [ "$?" -ne 0 ]; then
    die "set_edition.py failed"
  fi
}

update_htm_it_quota() {
  log_info "first boot: running update_quota.py"
  "${HTM_IT_HOME}/bin/update_quota.py" 2>&1
  if [ "$?" -ne 0 ]; then
    die "update_quota.py failed"
  fi
}

log_htm_it_server_details() {
  if [ -f "${HTM_IT_HOME}/bin/log_server_details.py" ]; then
    log_info "Logging server details"
    pushd "${HTM_IT_HOME}"
      bin/log_server_details.py 2>&1
      if [ "$?" -ne 0 ]; then
        die "log_htm_it_server_details.py failed"
      fi
    popd
  fi
}

htm_it_postconfigure_housekeeping() {
  if [ -f "${STAMPFILE}" ]; then
    # Yes, update_quota.py is called from two places in the script. This is
    # deliberate.
    #
    # At boot, we want to make sure we only run update_quota after
    # python setup.py init, so only run it here when we see the ${STAMPFILE}.
    # Otherwise, wait till after setup.py later in the script.
    log_info "running update_quota.py after first instance boot"
    update_htm_it_quota
    log_htm_it_server_details
  fi
}

cd "${HTM_IT_HOME}"

# Everything after this check is run only on the very first boot for
# an instance.
# We only want to run this once, on the first boot
if [ -f "${STAMPFILE}" ]; then
  htm_it_postconfigure_housekeeping

  log_info "Found ${STAMPFILE}, exiting firstboot.sh"
  ls -l "${STAMPFILE}"
  exit 0
fi

initialize_htm-it
set_htm_it_edition
update_htm_it_quota
log_htm_it_server_details

date > "${STAMPFILE}"
