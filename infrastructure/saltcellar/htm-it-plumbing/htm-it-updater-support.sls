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
# Formula: htm-it
#
# Installs htm-it-updater tooling

# Set up the support directories for the HTM-IT updater
updater-directory:
  file.directory:
    - name: /opt/numenta/products/htm-it/bin/updaters
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: htm-it-bin-directory

updater-status-directory:
  file.directory:
    - name: /etc/htm.it/updater_statuses
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: etc-htm-it

{% for dirpath in ['/opt/numenta/updater',
                   '/opt/numenta/updater/installed_versions',
                   '/opt/numenta/updater/logs',
                   '/opt/numenta/updater/python',
                   '/opt/numenta/updater/repo_d',
                   '/opt/numenta/updater/updater_manifests'] %}
{{ dirpath }}:
  file.directory:
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: /opt/numenta
{% endfor %}

# Install the htm-it updater and its dependencies
htm-it-updater-packages:
  pkg:
    - latest
    - pkgs:
      - createrepo
      - s3cmd

# TODO: TAUR-758 Re-enable installing htm-it-updater once we have a version that is 1.7-savvy
#      - htm-it-updater

# Install and enable the htm-itupdates init script
htm-itupdates:
  file.managed:
    - name: /etc/init.d/htm-itupdates
    - source: salt://htm-it-plumbing/files/updater/htm-itupdates.initd
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: ec2user-s3cmd-configuration
      - file: root-s3cmd-configuration
      - pkg: htm-it-updater-packages
  service.enabled:
    - enable: True
    - require:
      - file: htm-itupdates
      - file: ec2user-s3cmd-configuration
      - file: root-s3cmd-configuration
      - pkg: htm-it-updater-packages

# If you don't create a repo in the local directory you're going to tell
# yum is a repo, _before_ you add the repo definition, yum will have a
# conniption and you will be sad.

create-local-cache-repo:
  cmd.run:
    - name: createrepo /opt/numenta/updater/repo_d
    - creates: /opt/numenta/updater/repo_d/repodata/repomd.xml
    - require:
      - file: /opt/numenta/updater/repo_d
      - pkg: htm-it-updater-packages

updater-local-yum-repo:
  file.managed:
    - name: /etc/yum.repos.d/updater-local.repo
    - source: salt://htm-it-plumbing/files/updater/updater-local.repo
    - user: root
    - group: root
    - mode: 0644
    - require:
      - cmd: create-local-cache-repo

# Check for HTM-IT updates
check-for-gs-updates-cronjob:
  cron.present:
    - name: lockrun --lockfile=/var/lock/gs-check-for-updates.lock -- /usr/local/sbin/gs-check-for-updates > /dev/null 2>&1
    - identifier: check-for-gs-updates-cronjob
    - user: root
    - hour: '*'
    - minute: '13'
    - require:
      - file: /usr/local/sbin/lockrun
      - pkg: htm-it-updater-packages

# Check every minute to see if the user has enabled an update run
check-for-htm-it-update-trigger:
  cron.present:
    - name: lockrun --lockfile=/var/lock/gs-check-update-trigger.lock -- /usr/local/sbin/gs-check-update-trigger > /dev/null 2>&1
    - identifier: check-for-htm-it-update-trigger
    - user: root
    - hour: '*'
    - minute: '*'
    - require:
      - file: /usr/local/sbin/lockrun
      - pkg: htm-it-updater-packages

# Make sure we update the updater every night. We want the users running the
# most current htm-it-updater when they do an update.
check-for-htm-it-updater-updates:
  cron.present:
    - name: lockrun --lockfile=/var/lock/htm-it-updater-cronjob.lock -- yum install -y htm-it-updater 2>&1 | logger -t htm-it-updater
    - identifier: check-for-htm-it-updater-updates
    - user: root
    - hour: '23'
    - minute: '45'
    - require:
      - file: /usr/local/sbin/lockrun
      - pkg: htm-it-updater-packages
