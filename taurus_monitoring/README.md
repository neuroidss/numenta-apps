## This project is in Maintenance Mode
We have no plans to further develop this codebase or release new versions of applications contained within this repository. 

# taurus.monitors

`taurus.monitors` implements several monitors of the Taurus infrastructure and
a supporting database.

## Installation

### Configuration files

The configuration files for production reside in `conf/`.  It is recommended
that you copy and rename this directory so that you may make the required
local changes without conflicts:

    cp -r conf conf-user

Alternatively, the configuration files' path can be overidden using the
TAURUS_MONITORS_DB_CONFIG_PATH environment variable.

### First, install `nta.utils`.  Then, to install `taurus.monitors`:

    python setup.py develop --install-dir=<site-packages in $PYTHONPATH> --script-dir=<somewhere in $PATH>

- `--install-dir` must specify a location in your PYTHONPATH, typically
  something that ends with "site-packages".  If not specified, system default
  is used.
- `--script-dir` must specify a location in your PATH.  The Taurus installation
  defines and installs some CLI utilities into this location.  If not
  specified, the generated scripts go into the location specified in
  `--install-dir`.

### Set up `monitorsdb` sql database connection

1. The configuration in `conf-user/taurus-monitors-sqldb.conf` defaults to
host=localhost with the default user/password for mysql. To override mysql
host, username and password, use the following command, substituting the
appropriate strings for HOST, USER and PASSWORD:
```
    >>> taurus-set-monitorsdb-login --host=HOST --user=USER --password=PASSWORD
```

### Set up monitor config

Use the following template to specify core monitoring configuration
directives.  Save the result somewhere, say `conf/monitoring.conf`:

```
[S1]
TAURUS_API_KEY=
TAURUS_MODELS_URL=https://<taurus server host>/_models
EMAIL_AWS_REGION=us-east-1
EMAIL_SES_ENDPOINT=email.us-east-1.amazonaws.com
EMAIL_SES_AWS_ACCESS_KEY_ID=
EMAIL_SES_AWS_SECRET_ACCESS_KEY=
EMAIL_SENDER_ADDRESS=support@numenta.com
EMAIL_RECIPIENTS=support@numenta.com
TAURUS_DYNAMODB_REGION=
TAURUS_DYNAMODB_AWS_ACCESS_KEY_ID=
TAURUS_DYNAMODB_AWS_SECRET_ACCESS_KEY=
MONITORED_RESOURCE=
```

### Running monitors

The following (and possibly more) are expected to be executed periodically as
cron jobs:

#### taurus-server-supervisor-monitor
```
taurus-server-supervisor-monitor \
  --monitorConfPath=<absolute path to monitoring conf file> \
  --loggingLevel=INFO \
  --serverUrl=<URL to taurus server supervisor api e.g. http://127.0.0.1:9001>
```

#### taurus-collector-supervisor-monitor
```
taurus-collector-supervisor-monitor \
  --monitorConfPath=<absolute path to monitoring conf file> \
  --loggingLevel=INFO \
  --serverUrl=<URL to taurus collector supervisor api e.g. http://127.0.0.1:8001>
```

#### taurus-model-latency-monitor
```
taurus-model-latency-monitor \
  --monitorConfPath=<absolute path to monitoring conf file> \
  --metricDataTable=<metric data dynamodb table name. e.g. taurus.metric_data.production> \
  --loggingLevel=INFO
```

Additionally, should you need to manually clear out all notifications, there
is a helper utility, `taurus-clear-monitor-notifications`, that will prompt
the user to delete all notifications.

### Docker

A [Dockerfile](https://docs.docker.com/engine/reference/builder/) is included
to support a docker-based workflow.  To build a docker image, run the following
command from the root of the `numenta-apps` repository (the parent directory
of `taurus_monitoring/`):

```
docker build -t taurus-monitoring:latest -f taurus_monitoring/Dockerfile .
```

See `Dockerfile` for specific environment variable configuration directives.

Prefix each of the commands in the "Running monitors" section above with
the following, substituting correct environment variable values:

```
docker run \
    --env-file=monitoring-infrastructure.env \
    taurus-monitoring:latest 
```
