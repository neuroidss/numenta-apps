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
# Formula: htm-it-plumbing.motd

# Installs HTM-IT's motd fragment scripts so /etc/motd shows htm-it version,
# rpms, and whether updates are available for HTM-IT.

/etc/update-motd.d/10-show-htm-it-version:
  file.managed:
    - source: salt://htm-it-plumbing/files/motd/show-htm-it-version
    - user: root
    - group: root
    - mode: 0755

/etc/update-motd.d/40-show-htm-it-rpms:
  file.managed:
    - source: salt://htm-it-plumbing/files/motd/show-htm-it-rpms
    - user: root
    - group: root
    - mode: 0755

/etc/update-motd.d/50-show-available-updates:
  file.managed:
    - source: salt://htm-it-plumbing/files/motd/show-available-updates
    - user: root
    - group: root
    - mode: 0755

# Set up convenience scripts

show-htm-it-info:
  file.symlink:
    - target: /etc/update-motd.d/40-show-htm-it-rpms
    - name: /usr/local/sbin/show-htm-it-info
    - require:
      - file: /etc/update-motd.d/40-show-htm-it-rpms

show-htm-it-version:
  file.symlink:
    - target: /etc/update-motd.d/10-show-htm-it-version
    - name: /usr/local/sbin/show-htm-it-version
    - require:
      - file: /etc/update-motd.d/10-show-htm-it-version

