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
# Formula: agamotto

{% if grains['os_family'] == 'RedHat' and grains['osmajorrelease'][0] == '6' %}

include:
  - numenta-python

# Agamotto requires nose.
nose:
  pip.installed:
    - bin_env: /opt/numenta/anaconda/bin/pip
    - require:
      - pkg: anaconda-python
    - watch_in:
      - cmd: enforce-anaconda-permissions

# Install the agamotto test helpers. Agamotto is used for AMI testing, health
# checks on the webservers, and monitoring scripts.
agamotto:
  pip.installed:
    - bin_env: /opt/numenta/anaconda/bin/pip
    - require:
      - pip: nose
      - pkg: anaconda-python
    - watch_in:
      - cmd: enforce-anaconda-permissions

{% endif %}
