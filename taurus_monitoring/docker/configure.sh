#!/bin/bash
# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2017, Numenta, Inc.  Unless you have purchased from
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

# Be extra verbose and sensitive to failures
set -o errexit
set -o pipefail
set -o verbose
set -o xtrace
set -o nounset

mkdir -p logs

taurus-set-monitorsdb-login \
    --host=${DB_HOST} \
    --user=${DB_USER} \
    --password=${DB_PASSWORD}

cat << MONITORING_CONF_EOF > conf/monitoring.conf
[S1]
TAURUS_API_KEY=${TAURUS_API_KEY}
TAURUS_MODELS_URL=${TAURUS_MODELS_URL}
EMAIL_AWS_REGION=${EMAIL_AWS_REGION}
EMAIL_SES_ENDPOINT=${EMAIL_SES_ENDPOINT}
EMAIL_SES_AWS_ACCESS_KEY_ID=${EMAIL_SES_AWS_ACCESS_KEY_ID}
EMAIL_SES_AWS_SECRET_ACCESS_KEY=${EMAIL_SES_AWS_SECRET_ACCESS_KEY}
EMAIL_SENDER_ADDRESS=${EMAIL_SENDER_ADDRESS}
EMAIL_RECIPIENTS=${EMAIL_RECIPIENTS}
TAURUS_DYNAMODB_REGION=${TAURUS_DYNAMODB_REGION}
TAURUS_DYNAMODB_AWS_ACCESS_KEY_ID=${TAURUS_DYNAMODB_AWS_ACCESS_KEY_ID}
TAURUS_DYNAMODB_AWS_SECRET_ACCESS_KEY=${TAURUS_DYNAMODB_AWS_SECRET_ACCESS_KEY}
MONITORED_RESOURCE=${MONITORED_RESOURCE}
MONITORING_CONF_EOF
