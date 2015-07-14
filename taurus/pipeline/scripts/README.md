A set of helper scripts are provided to automate the process of initializing,
updating, and refreshing a pair of Taurus Server and Taurus Metric Collector
instances:
- initialize-remote-taurus-servers.sh
- update-remote-taurus-servers.sh
- refresh-remote-taurus-servers.sh

Usage
-----

The above scripts make several assumptions about the state of the instances
in use.  In particular, that a baseline set of requirements are satisfied and
that the instances are capable of being used without further manual
modification.  Internally, Numenta uses some tooling to launch and configure
AWS EC2 instances that meet the requirements.

However, before you can run Taurus on an instance pair, you must modify
/opt/numenta/products/taurus.metric_collectors/env.sh and
/opt/numenta/products/taurus/env.sh in the respective Taurus Metric Collector
and Taurus Server instances.  You may automatically generate these files and
copy to the respective destinations or hand-edit them.

You must also have the following environment variables set in your local
environment:
- `TAURUS_SERVER_HOST`
- `TAURUS_SERVER_USER`
- `TAURUS_SERVER_APIKEY`
- `TAURUS_COLLECTOR_USER`
- `TAURUS_COLLECTOR_HOST`
- `COMMIT_SHA`

Assuming the `env.sh` files accurately reflect the desired configuration, you
can start Taurus for the first time by running
`initialize-remote-taurus-servers.sh`, which will install Taurus from scratch
and start services.

To update a running pair of instances, you can run
`update-remote-taurus-servers.sh`, which will push code changes and restart
services gracefully.

To completely refresh a running pair of instances, run
`refresh-remote-taurus-servers.sh` which, in addition to updating the code and
restarting services, will remove traces of metrics.  This is a destructive
change from the perspective of metric lifecycle.
