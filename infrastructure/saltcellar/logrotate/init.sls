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
# Formula: logrotate

# Install files required by logrotate

# Ensure logrotate directory has proper permissions
logrotate-directory:
  file.directory:
    - name: /etc/logrotate.d
    - user: root
    - group: root
    - mode: 0755

# Install our syslog logrotate config
/etc/logrotate.d/syslog:
  file.managed:
    - source: salt://logrotate/files/syslog.logrotate
    - user: root
    - group: root
    - mode: 0644
    - require:
      - file: logrotate-directory

install-htm-itlog_rotator:
  file.managed:
    - name: /usr/local/sbin/htm-itlog_rotator
    - source: salt://logrotate/files/htm-itlog_rotator
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: logrotate-directory
