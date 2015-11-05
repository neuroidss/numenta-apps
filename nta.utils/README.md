nta.utils
=========

`nta.utils` is a library implements commonly used patterns in Numenta
applications.

Installation
------------

    python setup.py develop --install-dir=<site-packages in $PYTHONPATH>

- `--install-dir` must specify a location in your PYTHONPATH, typically
  something that ends with "site-packages".  If not specified, system default
  is used.

### Requirements

- Python 2.7, including [setuptools](https://pypi.python.org/pypi/setuptools)

*Note:* `nta.utils` is a mostly generic collection of utilities shared by
multiple Numenta applications.  For example, there are utilities for
interacting with an AMQP message broker such as
[rabbitmq](https://www.rabbitmq.com/download.html), as well as
[MySQL](https://www.mysql.com/).  You don't necessarily need `rabbitmq` or
`mysql` installed and running on the same instance as your application, but
the tests will require _access_ to some `mysql` and `rabbitmq` host.  As such,
you should be prepared to configure your application to use the following:

- [rabbitmq](https://www.rabbitmq.com/download.html) 3.5 (or higher)
- [mysql](http://dev.mysql.com/downloads/mysql/) 5.6 (or higher)

Environment Variables
---------------------

`AWS_ACCESS_KEY_ID`: The AWS access key; used by `error_reporting.py` for
  sending emails via SES

`AWS_SECRET_ACCESS_KEY`: The AWS secret key; used by `error_reporting.py` for
  sending emails via SES

`ERROR_REPORT_EMAIL_AWS_REGION`: AWS region for SES; used by
  `error_reporting.py` for sending emails via SES

`ERROR_REPORT_EMAIL_SES_ENDPOINT`: AWS SES endpoint for error report email

`ERROR_REPORT_EMAIL_RECIPIENTS`: Recipients of the error report emails. Email
      addresses need to be comma-separated
      Example => recipient1@organization.com, recipient2@organization.com

`ERROR_REPORT_EMAIL_SENDER_ADDRESS`: Sender email address for error report email

