# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
# Numenta, Inc. a separate commercial license for this software code, the
# following terms and conditions apply:
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License version 3 as
# published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see http://www.gnu.org/licenses.
#
# http://numenta.org/licenses/
# ----------------------------------------------------------------------
# Formula: grok-plumbing

# Install grok's support requirements on a server. Essentially, everything
# except Grok & NuPic so we can have as much as possible already in place
# when Jenkins starts to bake a new Grok AMI.

# Ensure the directories we need are in place
etc-grok:
  file.directory:
    - name: /etc/grok
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

grok-directory:
  file.directory:
    - name: /opt/numenta/products/grok
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: products-directory

grok-bin-directory:
  file.directory:
    - name: /opt/numenta/products/grok/bin
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: grok-directory

numenta-log-directory:
  file.directory:
    - name: /opt/numenta/logs
    - user: root
    - group: root
    - mode: 0755

# Pull in the other formulas required for a grok server
include:
  - nta-nucleus
  - aws-support
  - saltsolo
  - grok-plumbing.yumrepos
  - grok-plumbing.loghandling
  - grok-plumbing.motd
  - grok-plumbing.support-tools
  - grok-plumbing.supervisor-tooling
  - grok-plumbing.grok-updater-support
  - grok-plumbing.zap-public-keys
  - grok-plumbing.nginx-tooling
  - mysql
  - rabbitmq
  - rabbitmq.grok

# Set rpm name to use in salt solo
set-saltsolo-formula-rpm-to-grok:
  file.managed:
    - name: /etc/numenta/saltsolo-rpmname
    - require:
      - file: /etc/numenta
    - contents: grok-saltcellar

# Add the grok test helper
/usr/local/bin/run-grok-tests:
  file.managed:
    - source: salt://grok-plumbing/files/run-grok-tests
    - user: ec2-user
    - group: ec2-user
    - mode: 755

# Grok boxes should only run salt during bake or during a grok update. They're
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
    - contents: Never run salt manually or via cron on Grok instances. Salt should only run during AMI bake or when triggered by the grok-updater"
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
    - source: salt://grok-plumbing/files/updater/s3cfg
    - user: root
    - group: root
    - mode: 0600

root-s3cmd-configuration:
  file.managed:
    - name: /home/ec2-user/.s3cfg
    - source: salt://grok-plumbing/files/updater/s3cfg
    - user: ec2-user
    - group: ec2-user
    - mode: 0600

# The install-grok-packages script handles downloading grok/nupic/etc rpms and
# wheels and then installing them
grok-installer:
  file.managed:
    - name: /usr/local/bin/install-grok-packages
    - source: salt://grok-plumbing/files/install-grok-packages
    - user: root
    - group: root
    - mode: 755
    - require:
      - file: etc-grok
      - file: root-s3cmd-configuration
      - pkg: aws-tools
      - pkg: numenta-infrastructure-python
