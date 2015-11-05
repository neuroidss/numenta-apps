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
# Formula: htm-it-plumbing

# Install htm-it's support requirements on a server. Essentially, everything
# except HTM-IT & NuPic so we can have as much as possible already in place
# when Jenkins starts to bake a new HTM-IT AMI.

# Ensure the directories we need are in place
etc-htm-it:
  file.directory:
    - name: /etc/htm.it
    - user: ec2-user
    - group: ec2-user
    - mode: 0755

products-directory:
  file.directory:
    - name: /opt/numenta/products
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: /opt/numenta

htm-it-directory:
  file.directory:
    - name: /opt/numenta/products/htm-it
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: products-directory

htm-it-bin-directory:
  file.directory:
    - name: /opt/numenta/products/htm-it/bin
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: htm-it-directory

numenta-log-directory:
  file.directory:
    - name: /opt/numenta/logs
    - user: root
    - group: root
    - mode: 0755

# Pull in the other formulas required for a htm-it server
include:
  - nta-nucleus
  - aws-support
  - saltsolo
  - htm-it-plumbing.yumrepos
  - htm-it-plumbing.loghandling
  - htm-it-plumbing.motd
  - htm-it-plumbing.support-tools
  - htm-it-plumbing.supervisor-tooling
  - htm-it-plumbing.htm-it-updater-support
  - htm-it-plumbing.zap-public-keys
  - htm-it-plumbing.nginx-tooling
  - mysql
  - rabbitmq
  - rabbitmq.htm-it

# Set rpm name to use in salt solo
set-saltsolo-formula-rpm-to-htm-it:
  file.managed:
    - name: /etc/numenta/saltsolo-rpmname
    - require:
      - file: /etc/numenta
    - contents: htm-it-saltcellar

# Add the htm-it test helper
/usr/local/bin/run-htm-it-tests:
  file.managed:
    - source: salt://htm-it-plumbing/files/run-htm-it-tests
    - user: ec2-user
    - group: ec2-user
    - mode: 0755

# HTM-IT boxes should only run salt during bake or during a htm-it update. They're
# a special case since they're customer machines and we can't go in and fix
# them if an update to the salt formulas breaks them.
#
# Other boxes that run solo, like our webservers, should still run salt out
# of cron. If a formula push breaks something on them, we have the power to
# either spin up replacements or go in and do whatever fix is required.
#
# Only external customer boxes get to not run salt out of cron.

disable-salt-cronjob:
  file.managed:
    - name: /etc/numenta/no-salt-cron
    - contents: Never run salt manually or via cron on HTM-IT instances. Salt should only run during AMI bake or when triggered by the htm-it-updater"
    - require:
      - file: /etc/numenta

# Install numenta pipeline utilities.
numenta-infrastructure-python:
  pkg.latest

# We'll need grokcli
anaconda-grokcli:
  pip.installed:
    - name: grokcli >= 1.1.1
    - bin_env: /opt/numenta/anaconda/bin/pip
    - watch_in:
      - cmd: enforce-anaconda-permissions
    - require:
      - pkg: anaconda-python

# Configure s3cmd for root & ec2-user
ec2user-s3cmd-configuration:
  file.managed:
    - name: /root/.s3cfg
    - source: salt://htm-it-plumbing/files/updater/s3cfg
    - user: root
    - group: root
    - mode: 0600

root-s3cmd-configuration:
  file.managed:
    - name: /home/ec2-user/.s3cfg
    - source: salt://htm-it-plumbing/files/updater/s3cfg
    - user: ec2-user
    - group: ec2-user
    - mode: 0600

# The install-htm-it-packages script handles downloading htm-it/nupic/etc rpms and
# wheels and then installing them
htm-it-installer:
  file.managed:
    - name: /usr/local/bin/install-htm-it-packages
    - source: salt://htm-it-plumbing/files/install-htm-it-packages
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: etc-htm-it
      - file: root-s3cmd-configuration
      - pkg: aws-tools
      - pkg: numenta-infrastructure-python
