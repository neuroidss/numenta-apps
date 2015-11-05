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
# Formula: htm-it-plumbing.supervisor-tooling

# Install our customized supervisord tooling for running HTM-IT. We can't use
# the standard supervisord init script because:
# * We want to run as ec2-user, not root
# * We need a specific supervisord configuration that is in htm-it/conf, not
#   the generic one installed by CentOS

# Put in our own supervisord init script
htm-it-services-init-script:
  file.managed:
    - name: /etc/init.d/htm-it-services
    - source: salt://htm-it-plumbing/files/supervisor-tooling/htm-it-services.initd
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: firstboot-helper
      - file: firstboot-root-helper
      - pkg: nginx

# We need htm-it started as ec2-user. HTM-ITservices drops privilege to ec2-user,
# then runs supervisord-helper to actually start HTM-IT.
supervisord-helper:
  file.managed:
    - name: /opt/numenta/supervisord-helper
    - source: salt://htm-it-plumbing/files/supervisor-tooling/supervisord-helper
    - user: root
    - group: root
    - mode: 0755
    - require:
      - pip: anaconda-supervisor
      - pkg: nginx

# Disable the standard-issue supervisord init script since we use our own.
supervisord:
  service.disabled:
    - enabled: False
    - only_if:
      - cmd: test -f /etc/init.d/supervisord

# Make sure our htm-it-services init script is set to run at boot
htm-it-services:
  service.enabled:
    - require:
      - file: /usr/local/sbin/lockrun
      - file: firstboot-helper
      - file: firstboot-root-helper
      - file: htm-it-preload-init-script
      - file: htm-it-services-init-script
      - file: set-mysql-root-password
      - file: set-rabbitmq-root-password

# Log rabbitmq status to syslog for debuggery
rabbitmq-status-cronjob:
  cron.present:
    - name: lockrun --lockfile=/var/lock/rabbit-status.lock -- rabbitmqctl status 2>&1 | logger -t taurus-rabbit
    - identifier: rabbitmq-status-cronjob
    - user: root
    - hour: "*"
    - minute: "*/5"
    - require:
      - file: /usr/local/sbin/lockrun
      - pkg: rabbitmq-server

# Helpers needed by htm-it-services init script

firstboot-root-helper:
  file.managed:
    - name: /usr/local/sbin/firstboot-root.sh
    - source: salt://htm-it-plumbing/files/supervisor-tooling/firstboot-root.sh
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: set-mysql-root-password
      - file: set-rabbitmq-root-password

firstboot-helper:
  file.managed:
    - name: /usr/local/sbin/firstboot.sh
    - source: salt://htm-it-plumbing/files/supervisor-tooling/firstboot.sh
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: set-mysql-root-password
      - file: set-rabbitmq-root-password

# Password helpers
set-mysql-root-password:
  file.managed:
    - name: /usr/local/sbin/set-mysql-root-password
    - source: salt://htm-it-plumbing/files/supervisor-tooling/set-mysql-root-password
    - user: root
    - group: root
    - mode: 0755

set-rabbitmq-root-password:
  file.managed:
    - name: /usr/local/sbin/set-rabbitmq-root-password
    - source: salt://htm-it-plumbing/files/supervisor-tooling/set-rabbitmq-root-password
    - user: root
    - group: root
    - mode: 0755
