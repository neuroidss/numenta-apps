from setuptools import setup, find_packages

requirements = [str.strip(ln) for ln in open("requirements.txt").readlines()]

name = "taurus.monitoring"

setup(
  name = name,
  description = "Monitors Database",
  namespace_packages = ["taurus"],
  packages = find_packages(),
  install_requires = requirements,
  entry_points = {
    "console_scripts": [
      "taurus-reset-monitorsdb = %s.monitorsdb:resetMonitorsdbMain" % name,
      ("taurus-set-monitorsdb-login = "
       "%s.monitorsdb.set_monitorsdb_login:main" % name),
      ("taurus-models-monitor = "
       "%s.models_monitor.taurus_models_monitor:main" % name),
      ("taurus-metric-order-monitor = "
       "%s.metric_order_monitor.metric_order_monitor:main" % name),
      ("taurus-server-supervisor-monitor = "
       "%s.supervisord_monitor.taurus_server_supervisord_monitor:main" % name),
      ("taurus-collector-supervisor-monitor = "
       "%s.supervisord_monitor.taurus_collector_supervisord_monitor:main" % name),
      ("taurus-model-latency-monitor = "
       "%s.latency_monitor.model_latency_monitor:main" % name)
    ]
  }
)
