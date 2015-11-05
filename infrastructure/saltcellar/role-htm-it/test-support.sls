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
# Formula: role-htm.it.test-support
#
# Install htm-it testing tooling

# Install HTM-IT AMI test runner
/usr/local/sbin/gs-run-ami-tests:
  file.managed:
    - source: salt://role-htm-it/files/tests/gs-run-ami-tests
    - user: ec2-user
    - group: root
    - mode: 0755

# Install HTM-IT tests
{% for htm_it_ami_test in ['__init__',
                         'test_ami_for_keys',
                         'test_htm-itami',
                         'test_htm_it_packages'] %}

htm-it-ami-test-{{ htm_it_ami_test }}:
  file.managed:
    - name: /etc/numenta/tests/{{ htm_it_ami_test }}.py
    - source: salt://role-htm-it/files/tests/{{ htm_it_ami_test }}.py
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: ami-test-directory

{% endfor %}
