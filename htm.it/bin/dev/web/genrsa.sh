#!/bin/bash
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

# Bash shell script for generating self-signed certs. Run this in a folder, as
# it generates a few files. Large portions of this script were taken from the
# following article:
# 
# https://gist.github.com/bradland/1690807
#
# NOTE: This should be run only rarely as replacing the self signed certificate
# will break the mobile application.
  
DOMAIN="$1"
if [ -z "$DOMAIN" ]; then
  echo "Usage: $(basename $0) <domain>"
  exit 11
fi
   
fail_if_error() {
  [ $1 != 0 ] && {
    unset PASSPHRASE
    exit 10
  }
}
 
# Generate a passphrase
export PASSPHRASE="$2"
 
# Certificate details
# Update the <TAGS> with your details before running.
subj="
C=US
ST=CA
O=<ORG_NAME>
localityName=<LOCALITY>
commonName=<DOMAIN_NAME>
organizationalUnitName=<ORGANIZATIONAL_UNIT_NAME>
emailAddress=<EMAIL_ADDRESS>
"

case "${subj}" in
  *"<"*)
    echo "You must change the tags in the certificate subject first"
    exit 12
    ;;
  *">"*)
    echo "You must change the tags in the certificate subject first"
    exit 12
    ;;
esac

# Generate the server private key
openssl genrsa -des3 -out $DOMAIN.key -passout env:PASSPHRASE 1024
fail_if_error $?

# Generate the CSR
openssl req \
    -new \
    -batch \
    -subj "$(echo -n "${subj}" | tr "\n" "/")" \
    -key $DOMAIN.key \
    -out $DOMAIN.csr \
    -passin env:PASSPHRASE
fail_if_error $?
cp $DOMAIN.key $DOMAIN.key.bak
fail_if_error $?

# Strip the password so we don't have to type it every time we restart nginx
openssl rsa -in $DOMAIN.key.bak -out $DOMAIN.key -passin env:PASSPHRASE
fail_if_error $?

# Generate the cert (good for 1 year)
openssl x509 -req -days 365 -in $DOMAIN.csr -signkey $DOMAIN.key -out $DOMAIN.crt
fail_if_error $?
