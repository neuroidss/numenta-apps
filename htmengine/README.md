HTM Engine
==========

HTM Engine is the framework upon which anomaly detection applications may be
built.

Installation
------------

First, install [`nta.utils`](../nta.utils).  Then, to install `htmengine`:

    python setup.py develop --install-dir=<site-packages in $PYTHONPATH>

- `--install-dir` must specify a location in your PYTHONPATH, typically
  something that ends with "site-packages".  If not specified, system default
  is used.

### Requirements

- [MySQL](https://www.mysql.com/)
- [RabbitMQ](https://www.rabbitmq.com/)

Environment Variables
---------------------

`APPLICATION_CONFIG_PATH` **(REQUIRED)**: Directory path where active
application-specific configuration files are located.


Usage
-----

HTM Engine exposes a number of services that can be used to process custom
metrics.

### Metric Listener

    htmengine.runtime.metric_listener

Lightweight service that listens on a socket, exposes a graphite-compatible
interface for accepting metric data and forwards to Metric Storer.

### Metric Storer

    htmengine.runtime.metric_storer

Background process that saves metric data to database.

### Model Scheduler

    htmengine.model_swapper.model_scheduler_service

Streams metric data to models and records results.

### Anomaly Service

    htmengine.runtime.anomaly_service

Computes log-likelihood anomaly scores for each metric.

---

See `conf/supervisord-base.conf` for invocation of individual services.  To
include `htmengine` services in an application, include
`conf/supervisord-base.conf` in a complete supervisord configuration.  For
example:

    [unix_http_server]
    file=%(here)s/../taurus-supervisor.sock   ; (the path to the socket file)

    [inet_http_server]
    port=127.0.0.1:9001

    [supervisord]
    environment=APPLICATION_CONFIG_PATH=/opt/numenta/taurus/conf
    pidfile=%(here)s/../taurus-supervisord.pid
    identifier=taurus-supervisor
    logfile=%(here)s/../logs/taurus-supervisord.log
    # NOTE: logfile_maxbytes=0 turns off supervisor log rotation to prevent conflict
    # with Taurus' higher-level log rotation triggered by crontab
    logfile_maxbytes=0
    logfile_backups=10
    loglevel=info
    nodaemon=false
    minfds=1024
    minprocs=200

    [rpcinterface:supervisor]
    supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

    [rpcinterface:supervisor]
    supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

    [supervisorctl]
    serverurl=http://:

    [include]
    files = ../../htmengine/conf/supervisord-base.conf

