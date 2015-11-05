# .bash_profile
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

# Numenta's standard .bash_profile for user accounts

# If you make changes here, they will not apply to non-interactive sessions.
# If you want to change the environment in a way that applies to both login
# and non-login sessions, make your changes in .bashrc
#
# If you want changes made globally on an instance, including for already
# existing accounts, add a fragment file to /etc/profile.d.

# Get the aliases and functions
if [ -f ~/.bashrc ]; then
  . ~/.bashrc
fi

# User specific environment and startup programs

# set up bash prompt. Leave the single-quotes in place so Bash doesn't
# break the prompt.
export PS1=$'[\u@\h \W]\$ '

# Use anaconda PYTHONPATH
export PYTHONPATH=/opt/numenta/anaconda/lib/python2.7/site-packages

# CentOS adds -i aliases. There's a reason it is an option and not POSIX
# default behavior. Disable.
UNDO_ALIASING_CP=$(alias | grep -c 'cp -i')
if [ "${UNDO_ALIASING_CP}" != 0 ]; then
  unalias cp
fi
UNDO_ALIASING_MV=$(alias | grep -c 'mv -i')
if [ "${UNDO_ALIASING_MV}" != 0 ]; then
  unalias mv
fi
UNDO_ALIASING_RM=$(alias | grep -c 'rm -i')
if [ "${UNDO_ALIASING_RM}" != 0 ]; then
  unalias rm
fi
unset UNDO_ALIASING_CP
unset UNDO_ALIASING_MV
unset UNDO_ALIASING_RM

hgrep() {
  history | grep -i "$@"
}

alias listdbs="mysql -u root --execute 'show databases;'"

# Make it easier for children of numenta-base to add things to .bash_profile
#
# If you need to add a function, extend/change PATH or PYTHONPATH, add a file
# in /etc/.sh_fragments.d. Files there will be sourced in alphanumeric order. If
# the fragment uses bash-specific syntax, put it into ~/.bash_profile.d

# Generic shell - fragments here should work in both bash and zsh

# Handle global shell fragments
# Check that there are fragment files first, otherwise we'll get a complaint
# about $dotfile not existing
if [ -n "$(ls /etc/.sh_fragments.d)" ]; then
  for dotfile in /etc/.sh_fragments.d/*
  do
    if [ -r "${dotfile}" ]; then
      source "${dotfile}"
    fi
  done
fi

# Handle account-specific shell fragments
mkdir -p ~/.sh_fragments.d
if [ -n "$(ls ~/.sh_fragments.d)" ]; then
  for dotfile in ~/.sh_fragments.d/*
  do
    if [ -r "${dotfile}" ]; then
      source "${dotfile}"
    fi
  done
fi

# Bash-specific
mkdir -p ~/.bash_profile.d
if [ -n "$(ls ~/.bash_profile.d)" ]; then
  for dotfile in ~/.bash_profile.d/*
  do
    if [ -r "${dotfile}" ]; then
      source "${dotfile}"
    fi
  done
fi

if [ -f ~/.sh_aliases ]; then
  source ~/.sh_aliases
fi

SSHkeylist=$(ssh-add -l 2>&1)
if [[ $? == "0" ]]; then
  echo
  echo "SSH keys:"
  echo "${SSHkeylist}"
fi
