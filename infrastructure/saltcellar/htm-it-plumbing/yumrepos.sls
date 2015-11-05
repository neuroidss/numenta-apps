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
# Formula: htm-it-plumbing.yumrepos
#
# HTM-IT and NuPIC are installed via RPMs from our internal yum repositories.
# Ensure they're installed on the AMI.

# Enable HTM-IT-specific S3 repos
{% for repo in ['htm-it-release-candidates.repo',
                'htm-it-development.repo',
                'htm-it-releases.repo'] %}
/etc/yum.repos.d/{{ repo }}:
  file.managed:
    - user: root
    - group: root
    - source: salt://htm-it-plumbing/files/repos/{{ repo }}
    - mode: 0644
    - require:
      - file: remove-stale-htm-it-repo
    - watch_in:
      - cmd: reload-yum-database
{% endfor %}

# Nuke stale repo files.
{% for forbidden in ['htm_it_development.repo',
                     'htm_it_releases.repo'] %}
stale-repo-{{ forbidden }}:
  file.absent:
    - name: /etc/yum.repos.d/{{ forbidden }}
    - watch_in:
      - cmd: reload-yum-database
{% endfor %}
