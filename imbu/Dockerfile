# ----------------------------------------------------------------------
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

FROM numenta/nupic:latest

RUN apt-get update && apt-get -y install  apt-transport-https \
                                          build-essential \
                                          nginx \
                                          python-matplotlib \
                                          python-software-properties \
                                          software-properties-common
# Install latest Node JS
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv 68576280 && \
    apt-add-repository 'deb https://deb.nodesource.com/node_4.x precise main' && \
    apt-get update && apt-get -y install nodejs

# Pass real Cortical.io API key using '-e CORTICAL_API_KEY=$CORTICAL_API_KEY'
ENV CORTICAL_API_KEY=OVERRIDE_ME
# Select the retina to use  using '-e IMBU_RETINA_ID=$IMBU_RETINA_ID'
ENV IMBU_RETINA_ID=OVERRIDE_ME
# Default cache dir in container
ENV MODEL_CACHE_DIR=/opt/numenta/imbu/cache
# Enable development-mode htmresearch (optional)
ENV PYTHONPATH=/opt/numenta/nupic.research:${PYTHONPATH}

EXPOSE 80

WORKDIR /opt/numenta/imbu

# Install python packages
COPY requirements.txt /opt/numenta/imbu/requirements.txt
COPY setup.py /opt/numenta/imbu/setup.py
RUN python setup.py develop

# Install javascript packages
COPY package.json /opt/numenta/imbu/package.json
RUN npm install

# Build javascript app
COPY . /opt/numenta/imbu
RUN npm run build

# Setup persistent model cache
RUN mkdir -p cache
VOLUME cache

CMD ./start_imbu.sh

VOLUME /opt/numenta/nupic.research
