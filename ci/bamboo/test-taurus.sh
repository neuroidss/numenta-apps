#!/bin/sh

# Originally adapted from disparate bamboo tasks.  This script should be invoked
# without arguments in a bamboo ci setting (i.e. in an "agent" during testing)
# with the appropriate environment vars defined

set -o nounset
set -o errexit
set -o xtrace

# Build Taurus Collector Docker Image
docker -H ${bamboo_capability_DockerHost} build -t quay.io/numenta/taurus-metric-collectors:${bamboo_buildNumber} -f taurus_metric_collectors/Dockerfile .

# Build Taurus Engine Docker Image
docker -H ${bamboo_capability_DockerHost} build -t quay.io/numenta/taurus-engine:${bamboo_buildNumber} -f taurus_engine/Dockerfile .

# Provision Environment - Run all taurus services in docker containers

# Build dynamodb image
docker -H ${bamboo_capability_DockerHost} build \
  -q \
  -t dynamodb:latest \
  -f taurus_engine/external/dynamodb_test_tool/Dockerfile \
  taurus_engine/external/dynamodb_test_tool

# Create docker network (all containers in this test will be on the same network)
docker -H ${bamboo_capability_DockerHost} network inspect ${bamboo_buildResultKey} > /dev/null 2> /dev/null || docker -H ${bamboo_capability_DockerHost} network create ${bamboo_buildResultKey}

# Run taurus dynamodb test tool container
docker -H ${bamboo_capability_DockerHost} run \
  --net ${bamboo_buildResultKey} \
  --name taurus-dynamodb-${bamboo_buildResultKey} \
  -p 8300 \
  -d \
  dynamodb:latest

# Run taurus mysql container
docker -H ${bamboo_capability_DockerHost} run \
  --net ${bamboo_buildResultKey} \
  --name taurus-mysql-${bamboo_buildResultKey} \
  -p 3306 \
  -e MYSQL_ROOT_PASSWORD=taurus \
  -e MYSQL_USER=taurus \
  -e MYSQL_PASSWORD=taurus \
  -d \
  mysql:5.6

# Run taurus rabbitmq container
docker -H ${bamboo_capability_DockerHost} run \
  --net ${bamboo_buildResultKey} \
  --name taurus-rabbitmq-${bamboo_buildResultKey} \
  -p 15672 \
  -p 5672 \
  -e RABBITMQ_DEFAULT_USER=taurus \
  -e RABBITMQ_DEFAULT_PASS=taurus \
  -d \
  rabbitmq:3.6.1-management

# Wait for dynamodb, mysql, and rabbitmq services to become available
docker -H ${bamboo_capability_DockerHost} run \
  --net ${bamboo_buildResultKey} \
  --entrypoint /bin/bash \
  quay.io/numenta/taurus-engine:${bamboo_buildNumber} \
    -c "for i in {1..5}; do nc -z taurus-dynamodb-${bamboo_buildResultKey} 8300 && nc -z taurus-mysql-${bamboo_buildResultKey} 3306 && nc -z taurus-rabbitmq-${bamboo_buildResultKey} 15672 && break || sleep 3; done"

# Determine ip address for rabbitmq container.  Referencing by name does not seem to work properly.
RABBIT_IP=`docker -H ${bamboo_capability_DockerHost} run \
  --rm \
  --net ${bamboo_buildResultKey} \
  --entrypoint /bin/bash \
  quay.io/numenta/taurus-engine:${bamboo_buildNumber} \
    -c "getent hosts taurus-rabbitmq-${bamboo_buildResultKey}" | awk '{print $1}'`

# Start taurus engine container
docker -H ${bamboo_capability_DockerHost} run \
  --net ${bamboo_buildResultKey} \
  --name taurus-engine-${bamboo_buildResultKey} \
  --volumes-from=${bamboo_capability_name} \
  -p 2003 \
  -p 443 \
  -e APPLICATION_CONFIG_PATH=/opt/numenta/taurus_engine/conf \
  -e TAURUS_API_KEY=taurus \
  -e MYSQL_HOST=taurus-mysql-${bamboo_buildResultKey} \
  -e MYSQL_USER=root \
  -e MYSQL_PASSWD=taurus \
  -e RABBITMQ_HOST=${RABBIT_IP} \
  -e RABBITMQ_USER=taurus \
  -e RABBITMQ_PASSWD=taurus \
  -e DYNAMODB_TABLE_SUFFIX=test \
  -e DYNAMODB_HOST=taurus-dynamodb-${bamboo_buildResultKey} \
  -e DYNAMODB_PORT=8300 \
  -e DYNAMODB_EXTRAS=--security-off \
  -e OBLITERATE_DATABASE="YES.  Delete everything." \
  -d \
  quay.io/numenta/taurus-engine:${bamboo_buildNumber}

# Wait for metric listener to become available
docker -H ${bamboo_capability_DockerHost} exec taurus-engine-${bamboo_buildResultKey} /bin/bash -c "for i in {1..5}; do nc -z 127.0.0.1 2003 && break || sleep 3; done"

# Determine ip address for taurus engine container.  Referencing by name does not seem to work properly.
TAURUS_IP=`docker -H ${bamboo_capability_DockerHost} run \
  --rm \
  --net ${bamboo_buildResultKey} \
  --entrypoint /bin/bash \
  quay.io/numenta/taurus-metric-collectors:${bamboo_buildNumber} \
    -c "getent hosts taurus-engine-${bamboo_buildResultKey}" | awk '{print $1}'`

# Start taurus collector container
docker -H ${bamboo_capability_DockerHost} run \
  --net ${bamboo_buildResultKey} \
  --name taurus-metric-collectors-${bamboo_buildResultKey} \
  --volumes-from=${bamboo_capability_name} \
  -e APPLICATION_CONFIG_PATH=/opt/numenta/taurus_metric_collectors/conf \
  -e MYSQL_HOST=taurus-mysql-${bamboo_buildResultKey} \
  -e MYSQL_USER=root \
  -e MYSQL_PASSWD=taurus \
  -e RABBITMQ_HOST=${RABBIT_IP} \
  -e RABBITMQ_USER=taurus \
  -e RABBITMQ_PASSWD=taurus \
  -e TAURUS_HTM_SERVER=${TAURUS_IP} \
  -e OBLITERATE_DATABASE="YES.  Delete everything." \
  -d \
  quay.io/numenta/taurus-metric-collectors:${bamboo_buildNumber}

# Run tests
# Run taurus engine tests via `docker exec`
docker -H ${bamboo_capability_DockerHost} exec \
  taurus-engine-${bamboo_buildResultKey} \
    py.test --junitxml ${bamboo_working_directory}/taurus-engine-test-results.xml \
            --cov nta.utils/nta \
            --cov htmengine/htmengine \
            --cov taurus_engine/taurus_engine \
            nta.utils/tests/unit \
            nta.utils/tests/integration \
            htmengine/tests/unit \
            htmengine/tests/integration \
            taurus_engine/tests/unit \
            taurus_engine/tests/integration

# Generate html coverage report
docker -H ${bamboo_capability_DockerHost} exec \
  taurus-engine-${bamboo_buildResultKey} \
    coverage html -d ${bamboo_working_directory}/taurus-engine-coverage

# Run taurus collector tests via `docker exec`
docker -H ${bamboo_capability_DockerHost} exec \
  taurus-metric-collectors-${bamboo_buildResultKey} \
    py.test --junitxml ${bamboo_working_directory}/taurus-collector-test-results.xml \
            --cov taurus_metric_collectors/taurus_metric_collectors \
            taurus_metric_collectors/tests/unit \
            taurus_metric_collectors/tests/integration

# Generate html coverage report
docker -H ${bamboo_capability_DockerHost} exec \
  taurus-metric-collectors-${bamboo_buildResultKey} \
    coverage html -d ${bamboo_working_directory}/taurus-collector-coverage

# Save Taurus Collector Artifact
docker -H ${bamboo_capability_DockerHost} save quay.io/numenta/taurus-metric-collectors:${bamboo_buildNumber} | gzip > taurus-metric-collectors-${bamboo_buildNumber}.tar.gz

# Save Taurus Engine Artifact
docker -H ${bamboo_capability_DockerHost} save quay.io/numenta/taurus-engine:${bamboo_buildNumber} | gzip > taurus-engine-${bamboo_buildNumber}.tar.gz