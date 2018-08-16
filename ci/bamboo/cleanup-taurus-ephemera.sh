#!/bin/sh

# Originally adapted from disparate bamboo tasks.  This script should be invoked
# without arguments in a bamboo ci setting (i.e. in an "agent" during cleanup)
# with the appropriate environment vars defined

set -o nounset
set -o errexit
set -o xtrace

(docker -H ${bamboo_capability_DockerHost} exec taurus-engine-${bamboo_buildResultKey} cat /opt/numenta/taurus_engine/logs/anomaly_service.log) > anomaly_service.log
(docker -H ${bamboo_capability_DockerHost} exec taurus-engine-${bamboo_buildResultKey} cat /opt/numenta/taurus_engine/logs/dynamodb_service.log) > dynamodb_service.log
(docker -H ${bamboo_capability_DockerHost} exec taurus-engine-${bamboo_buildResultKey} cat /opt/numenta/taurus_engine/logs/model_scheduler.log) > model_scheduler.log
(docker -H ${bamboo_capability_DockerHost} exec taurus-engine-${bamboo_buildResultKey} cat /opt/numenta/taurus_engine/logs/metric_listener.log) > metric_listener.log
(docker -H ${bamboo_capability_DockerHost} exec taurus-engine-${bamboo_buildResultKey} cat /opt/numenta/taurus_engine/logs/taurus-supervisord.log) > taurus-supervisord.log
(docker -H ${bamboo_capability_DockerHost} exec taurus-engine-${bamboo_buildResultKey} cat /opt/numenta/taurus_engine/logs/metric_storer.log) > metric_storer.log
(docker -H ${bamboo_capability_DockerHost} exec taurus-engine-${bamboo_buildResultKey} cat /opt/numenta/taurus_engine/logs/uwsgi.log) > uwsgi.log

docker -H ${bamboo_capability_DockerHost} kill taurus-metric-collectors-${bamboo_buildResultKey} taurus-engine-${bamboo_buildResultKey} taurus-mysql-${bamboo_buildResultKey} taurus-rabbitmq-${bamboo_buildResultKey} taurus-dynamodb-${bamboo_buildResultKey}
docker -H ${bamboo_capability_DockerHost} rm taurus-metric-collectors-${bamboo_buildResultKey} taurus-mysql-${bamboo_buildResultKey} taurus-rabbitmq-${bamboo_buildResultKey} taurus-dynamodb-${bamboo_buildResultKey}
docker -H ${bamboo_capability_DockerHost} network rm ${bamboo_buildResultKey}
