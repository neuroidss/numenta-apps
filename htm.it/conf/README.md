#  HTM-IT Configuration

 - Link `htm-it-app` to `/usr/local/htmit`
 - Link `htm-it-api.conf` to `/etc/nginx/conf.d/htm-it-api.conf`

# SSL Keys

## Why do we include a specific self-signed SSL key in this repository?

Due to strict security requirements, android applications cannot normally open SSL connections to servers using self-signed certificates. Requiring a real certificate before the mobile app becomes functional is a burden to the user, so we embed the certificate from htm.it/conf/ssl in the mobile app as a trusted certificate.

Note that if you change htm.it/conf/ssl/localhost.crt, you will also have to change htm-it-mobile/keys/localhost.crt to match.
