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
# Formula: nta-nucleus.packages
#
# Install the base package set for nta-nucleus

# We want these packages on all of our instances, our formulas expect
# them to be available.
core-packages:
  pkg:
    - latest
    - pkgs:
      - curl
      - logrotate
      - nta-git
      - ntp
{% if grains['os_family'] == 'RedHat' and grains['osmajorrelease'][0] == '6' %}
      - pbzip2
{% endif %}
      - pigz
      - tmpwatch
      - unzip
      - wget
      - zsh

# Some standard command line utilities for when we have to debug an instance
human-use-packages:
  pkg:
    - latest
    - require:
      - cmd: epel-installed
    - pkgs:
      - htop
      - iotop
      - mosh
      - pv
      - reptyr
      - screen
      - stow
      - telnet
      - tmux
      - vim-enhanced

remove-deprecated-packages:
  pkg:
    - removed
    - pkgs:
      - git
    - require:
      - pkg: core-packages
      - pkg: human-use-packages
