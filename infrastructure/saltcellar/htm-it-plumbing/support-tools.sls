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
# Formula: htm-it-plumbing.support-tools

# Install everything needed for remote support of HTM-IT

# These directories are required by gs-support-access-tool
# and gs-get-support-keys
{% for dirpath in ['/etc/htm.it/sshkeys.d',
                   '/etc/htm.it/sshkeys.d/originals'] %}
{{ dirpath }}:
  file.directory:
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: etc-htm-it
{% endfor %}

# gs-support-access-tool enables remote support on an instance once the
# customer enables it in the GUI
gs-support-access-tool:
  file.managed:
    - name: /usr/local/sbin/gs-support-access-tool
    - source: salt://htm-it-plumbing/files/support-tools/gs-support-access-tool
    - user: root
    - group: root
    - mode: 0755

# Install helper script to download the HTM-IT support public keys from S3
gs-get-support-keys:
  file.managed:
    - name: /usr/local/sbin/gs-get-support-keys
    - source: salt://htm-it-plumbing/files/support-tools/gs-get-support-keys
    - user: root
    - group: root
    - mode: 0755

# Check every minute to see if the user has enabled remote support on the instance
check-for-support-access-permission:
  cron.present:
    - name: lockrun --lockfile=/var/lock/gs-support-access-tool -- /usr/local/sbin/gs-support-access-tool 2>&1 | logger -t gs-support-access-tool
    - identifier: check-for-support-access-permission
    - user: root
    - minute: '*'
    - require:
      - file: gs-support-access-tool
      - cron: set-sane-path-in-crontab
