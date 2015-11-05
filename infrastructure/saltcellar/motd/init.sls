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
# Formula: motd

# Install tooling for automatic motd generation.

# Install the motd driver script
acta-diurna:
  file.managed:
    - name: /usr/local/bin/acta-diurna
    - source: https://raw.githubusercontent.com/unixorn/acta-diurna/master/acta-diurna.py
    - source_hash: md5=747f4457e0de9ebb7b5791e3d71cb91f
    - user: root
    - group: wheel
    - mode: 0755
{% if grains['os_family'] == 'RedHat' and grains['osmajorrelease'][0] == '6' %}
    - require:
      - file: python-27-symlink
      - sls: numenta-python
{% endif %}

# motd fragment scripts go here
/etc/update-motd.d:
  file.directory:
    - user: root
    - group: wheel
    - mode: 0755

/etc/update-motd.d.disabled:
  file.directory:
    - user: root
    - group: wheel
    - mode: 0755

# Add Numenta logo to motd
/etc/update-motd.d/00-print-logo.motd:
  file.managed:
    - source: salt://motd/files/motd.logo
    - user: root
    - group: wheel
    - mode: 0644
    - require:
      - file: /etc/update-motd.d
    - watch_in:
      - cmd: update-motd

# Add Standard banner information to motd
/etc/update-motd.d/20-banner.motd:
  file.managed:
    - source: salt://motd/files/20-banner.motd
    - user: root
    - group: wheel
    - mode: 0755
    - require:
      - file: /etc/update-motd.d
    - watch_in:
      - cmd: update-motd

# Add salt version to motd
/etc/update-motd.d/30-salt-version.motd:
  file.managed:
    - source: salt://motd/files/30-salt-version.motd
    - user: root
    - group: wheel
    - mode: 0755
    - require:
      - file: /etc/update-motd.d
    - watch_in:
      - cmd: update-motd

update-motd:
# Install our motd cronjob script
  file.managed:
    - name: /usr/local/sbin/update-motd
    - source: salt://motd/files/update-motd.centos
    - user: root
    - group: wheel
    - mode: 0755
    - require:
      - cmd: clean-update-motd-script-source
      - cmd: cleanup-motd-cronjob-symlink
      - file: acta-diurna
# Run the update-motd job, but only when a fragment script is added or changed
  cmd.wait:
    - name: /usr/local/sbin/update-motd
    - cwd: /
    - require:
      - file: acta-diurna

clean-update-motd-script-source:
  cmd.run:
    - name: rm -f /usr/local/sbin/update-motd
    - onlyif: test -L /usr/local/sbin/update-motd

cleanup-motd-cronjob-symlink:
  cmd.run:
    - name: rm -f /etc/cron.daily/update-motd
    - unless: test -L /etc/cron.daily/update-motd

{% if grains['os_family'] == 'RedHat' and grains['osmajorrelease'][0] == '6' %}

motd-cronjob:
# Install the actual cronjob
  cron.present:
    - name: /etc/cron.daily/update-motd 2>&1 > /dev/null
    - identifier: motd-updates
    - user: root
    - minute: '*/15'
    - require:
      - cron: set-sane-path-in-crontab
      - file: /etc/cron.daily/update-motd
      - file: /etc/update-motd.d
      - file: acta-diurna

update-motd-symlink:
  file.symlink:
    - name: /etc/cron.daily/update-motd
    - target: /usr/local/sbin/update-motd
    - require:
      - cmd: clean-update-motd-script-source
      - cmd: cleanup-motd-cronjob-symlink

{% endif %}
