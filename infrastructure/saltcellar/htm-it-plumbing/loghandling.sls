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
# Formula: htm-it-plumbing.loghandling
#
# Install support for HTM-IT logging, both to S3 and locally on the instance

# Rotate htm-it's logfiles, and upload to S3 if user has enabled it.
shuffle-htm-itlogs:
  file.managed:
    - name: /usr/local/sbin/shuffle_htm_it_logs
    - source: salt://htm-it-plumbing/files/loghandling/shuffle_htm_it_logs
    - user: root
    - group: root
    - mode: 0755
  cron.present:
    - name: /usr/local/sbin/lockrun --lockfile=/var/lock/shuffle_htm_it_logs -- /usr/local/sbin/shuffle_htm_it_logs 2>&1 | logger -t gs-shuffle-htm-itlogs
    - identifier: shuffle_htm_it_logs
    - user: root
    - hour: '*'
    - minute: '7'
    - require:
      - file: shuffle-htm-itlogs

# Enforce absence of old logrotate conf file now that we're rotating our logs
# ourselves.
scrub-stale-logrotate-file:
  file.absent:
    - name: /etc/logrotate.d/htm-it-logs
