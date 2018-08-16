#!/bin/sh

# Originally adapted from disparate bamboo tasks.  This script should be invoked
# without arguments in a bamboo ci setting (i.e. in an "agent" during deployment)
# with the appropriate environment vars defined

set -o nounset
set -o errexit
set -o xtrace

# Robot pull Taurus engine, collector Docker images from Quay registry
docker -H ${bamboo_capability_DockerHost} login -e="." -u=${bamboo_QUAY_ROBOT_name_password} -p=${bamboo_QUAY_ROBOT_token_password} quay.io
docker -H ${bamboo_capability_DockerHost} pull quay.io/numenta/taurus-engine:${bamboo_buildNumber}
docker -H ${bamboo_capability_DockerHost} pull quay.io/numenta/taurus-metric-collectors:${bamboo_buildNumber}

# Transition collector to hot_standby
set +e
RUNNING=$(docker -H ${bamboo_TAURUS_COLLECTOR_DOCKER_HOST} inspect --format="{{ .State.Running }}" taurus-metric-collectors 2> /dev/null)
set -e

if [ $? -eq 1 ]; then
  echo "Container 'taurus-metric-collectors' does not exist."
elif "${RUNNING}" == "true"; then
  docker -H ${bamboo_TAURUS_COLLECTOR_DOCKER_HOST} exec taurus-metric-collectors taurus-collectors-set-opmode hot_standby
  docker -H ${bamboo_TAURUS_COLLECTOR_DOCKER_HOST} exec taurus-metric-collectors nta-wait-for-supervisord-running http://localhost:8001
  docker -H ${bamboo_TAURUS_COLLECTOR_DOCKER_HOST} exec taurus-metric-collectors supervisorctl --serverurl http://localhost:8001 restart all
fi

# Deploy taurus engine docker container
docker -H ${bamboo_TAURUS_ENGINE_DOCKER_HOST} stop taurus-engine || true
docker -H ${bamboo_TAURUS_ENGINE_DOCKER_HOST} rm taurus-engine || true
docker -H ${bamboo_TAURUS_ENGINE_DOCKER_HOST} run \
  --name taurus-engine \
  -d \
  -p 2003:2003 \
  -p 443:443 \
  -p 9001:9001 \
  -v /taurus-permanent-storage/checkpoints:/root/taurus_model_checkpoints \
  -v /taurus-permanent-storage/logs:/opt/numenta/taurus_engine/logs \
  -e MYSQL_HOST=${bamboo_MYSQL_HOST} \
  -e MYSQL_USER=${bamboo_MYSQL_USER} \
  -e MYSQL_PASSWD=${bamboo_MYSQL_PASSWD_password} \
  -e RABBITMQ_HOST=${bamboo_RABBITMQ_HOST} \
  -e RABBITMQ_USER=${bamboo_RABBITMQ_USER_password} \
  -e RABBITMQ_PASSWD=${bamboo_RABBITMQ_PASSWD_password} \
  -e TAURUS_RMQ_METRIC_DEST=${bamboo_TAURUS_RMQ_METRIC_DEST} \
  -e TAURUS_RMQ_METRIC_PREFIX=${bamboo_TAURUS_RMQ_METRIC_PREFIX} \
  -e DYNAMODB_EXTRAS=${bamboo_DYNAMODB_EXTRAS} \
  -e DYNAMODB_TABLE_SUFFIX=${bamboo_DYNAMODB_TABLE_SUFFIX} \
  -e DYNAMODB_HOST=${bamboo_DYNAMODB_HOST} \
  -e DYNAMODB_PORT=${bamboo_DYNAMODB_PORT} \
  -e TAURUS_API_KEY=${bamboo_TAURUS_API_KEY} \
  -e AWS_ACCESS_KEY_ID=${bamboo_AWS_ACCESS_KEY_ID_password} \
  -e AWS_SECRET_ACCESS_KEY=${bamboo_AWS_SECRET_ACCESS_KEY_password} \
  quay.io/numenta/taurus-engine:${bamboo_buildNumber}

# Stop and remove taurus collector docker container
docker -H ${bamboo_TAURUS_COLLECTOR_DOCKER_HOST} stop taurus-metric-collectors || true
docker -H ${bamboo_TAURUS_COLLECTOR_DOCKER_HOST} rm taurus-metric-collectors || true

# Run collector resource accessibility deployment tests before starting services
docker -H ${bamboo_TAURUS_COLLECTOR_DOCKER_HOST} run \
  --rm \
  -p 8001:8001 \
  -v /taurus-permanent-storage/logs:/opt/numenta/taurus_metric_collectors/logs \
  -e MYSQL_HOST=${bamboo_MYSQL_HOST} \
  -e MYSQL_USER=${bamboo_MYSQL_USER} \
  -e MYSQL_PASSWD=${bamboo_MYSQL_PASSWD_password} \
  -e RABBITMQ_HOST=${bamboo_RABBITMQ_HOST} \
  -e RABBITMQ_USER=${bamboo_RABBITMQ_USER_password} \
  -e RABBITMQ_PASSWD=${bamboo_RABBITMQ_PASSWD_password} \
  -e TAURUS_API_KEY=${bamboo_TAURUS_API_KEY} \
  -e AWS_ACCESS_KEY_ID=${bamboo_AWS_ACCESS_KEY_ID_password} \
  -e AWS_SECRET_ACCESS_KEY=${bamboo_AWS_SECRET_ACCESS_KEY_password} \
  -e TAURUS_SERVER_HOST=${bamboo_TAURUS_HTM_SERVER} \
  -e TAURUS_HTM_SERVER=${bamboo_TAURUS_HTM_SERVER} \
  -e XIGNITE_API_TOKEN=${bamboo_XIGNITE_API_TOKEN_password} \
  -e TAURUS_TWITTER_ACCESS_TOKEN=${bamboo_TAURUS_TWITTER_ACCESS_TOKEN_password} \
  -e TAURUS_TWITTER_ACCESS_TOKEN_SECRET=${bamboo_TAURUS_TWITTER_ACCESS_TOKEN_SECRET_password} \
  -e TAURUS_TWITTER_CONSUMER_KEY=${bamboo_TAURUS_TWITTER_CONSUMER_KEY_password} \
  -e TAURUS_TWITTER_CONSUMER_SECRET=${bamboo_TAURUS_TWITTER_CONSUMER_SECRET_password} \
  -e ERROR_REPORT_EMAIL_AWS_REGION=${bamboo_ERROR_REPORT_EMAIL_AWS_REGION} \
  -e ERROR_REPORT_EMAIL_RECIPIENTS=${bamboo_ERROR_REPORT_EMAIL_RECIPIENTS} \
  -e ERROR_REPORT_EMAIL_SENDER_ADDRESS=${bamboo_ERROR_REPORT_EMAIL_SENDER_ADDRESS} \
  -e ERROR_REPORT_EMAIL_SES_ENDPOINT=${bamboo_ERROR_REPORT_EMAIL_SES_ENDPOINT} \
  quay.io/numenta/taurus-metric-collectors:${bamboo_buildNumber} \
  "py.test /opt/numenta/taurus_metric_collectors/tests/deployment/resource_accessibility_test.py"

# Run taurus collector docker container
docker -H ${bamboo_TAURUS_COLLECTOR_DOCKER_HOST} run \
  --name taurus-metric-collectors \
  -d \
  -p 8001:8001 \
  -v /taurus-permanent-storage/logs:/opt/numenta/taurus_metric_collectors/logs \
  -e MYSQL_HOST=${bamboo_MYSQL_HOST} \
  -e MYSQL_USER=${bamboo_MYSQL_USER} \
  -e MYSQL_PASSWD=${bamboo_MYSQL_PASSWD_password} \
  -e RABBITMQ_HOST=${bamboo_RABBITMQ_HOST} \
  -e RABBITMQ_USER=${bamboo_RABBITMQ_USER_password} \
  -e RABBITMQ_PASSWD=${bamboo_RABBITMQ_PASSWD_password} \
  -e TAURUS_API_KEY=${bamboo_TAURUS_API_KEY} \
  -e AWS_ACCESS_KEY_ID=${bamboo_AWS_ACCESS_KEY_ID_password} \
  -e AWS_SECRET_ACCESS_KEY=${bamboo_AWS_SECRET_ACCESS_KEY_password} \
  -e TAURUS_SERVER_HOST=${bamboo_TAURUS_HTM_SERVER} \
  -e TAURUS_HTM_SERVER=${bamboo_TAURUS_HTM_SERVER} \
  -e XIGNITE_API_TOKEN=${bamboo_XIGNITE_API_TOKEN_password} \
  -e TAURUS_TWITTER_ACCESS_TOKEN=${bamboo_TAURUS_TWITTER_ACCESS_TOKEN_password} \
  -e TAURUS_TWITTER_ACCESS_TOKEN_SECRET=${bamboo_TAURUS_TWITTER_ACCESS_TOKEN_SECRET_password} \
  -e TAURUS_TWITTER_CONSUMER_KEY=${bamboo_TAURUS_TWITTER_CONSUMER_KEY_password} \
  -e TAURUS_TWITTER_CONSUMER_SECRET=${bamboo_TAURUS_TWITTER_CONSUMER_SECRET_password} \
  -e ERROR_REPORT_EMAIL_AWS_REGION=${bamboo_ERROR_REPORT_EMAIL_AWS_REGION} \
  -e ERROR_REPORT_EMAIL_RECIPIENTS=${bamboo_ERROR_REPORT_EMAIL_RECIPIENTS} \
  -e ERROR_REPORT_EMAIL_SENDER_ADDRESS=${bamboo_ERROR_REPORT_EMAIL_SENDER_ADDRESS} \
  -e ERROR_REPORT_EMAIL_SES_ENDPOINT=${bamboo_ERROR_REPORT_EMAIL_SES_ENDPOINT} \
  quay.io/numenta/taurus-metric-collectors:${bamboo_buildNumber}

# Run engine deployment tests in already-running container
docker -H ${bamboo_TAURUS_ENGINE_DOCKER_HOST} exec taurus-engine py.test taurus_engine/tests/deployment

# Run collector health check deployment tests in already-running container
docker -H ${bamboo_TAURUS_COLLECTOR_DOCKER_HOST} exec taurus-metric-collectors py.test taurus_metric_collectors/tests/deployment/health_check_test.py

# Transition taurus collector to active
set +e
RUNNING=$(docker -H ${bamboo_TAURUS_COLLECTOR_DOCKER_HOST} inspect --format="{{ .State.Running }}" taurus-metric-collectors 2> /dev/null)
set -e

if [ $? -eq 1 ]; then
  echo "Container 'taurus-metric-collectors' does not exist."
elif "${RUNNING}" == "true"; then
  docker -H ${bamboo_TAURUS_COLLECTOR_DOCKER_HOST} exec taurus-metric-collectors taurus-collectors-set-opmode active
  docker -H ${bamboo_TAURUS_COLLECTOR_DOCKER_HOST} exec taurus-metric-collectors nta-wait-for-supervisord-running http://localhost:8001
  docker -H ${bamboo_TAURUS_COLLECTOR_DOCKER_HOST} exec taurus-metric-collectors supervisorctl --serverurl http://localhost:8001 restart all
fi
