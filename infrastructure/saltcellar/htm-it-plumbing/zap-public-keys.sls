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
# Module: htm-it-plumbing.zap-stale-keys

# Help the instance pass marketplace acceptance by ensuring we don't leave
# any stale SSH public keys on the instance.

# Kill every pubkey in the /etc/htm.it/sshkeys.d tree with fire.
zap-ssh-public-keys:
  cmd.run:
    - name: find /etc/htm.it/sshkeys.d -type f -name '*.pub' -delete
