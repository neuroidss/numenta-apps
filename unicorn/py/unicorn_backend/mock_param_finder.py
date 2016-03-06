#!/usr/bin/env python
# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
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

import json
import sys

PARAM_FINDER_OUTPUT = {
  "aggInfo": {
    "windowSize": 1209,
    "func": "mean"
  },
  "modelInfo": {
    "modelId": "1",
    "valueFieldName": "c1",
    "timestampFieldName": "c0",
    "inferenceArgs": {
      "predictionSteps": [1],
      "predictedField": "c1",
      "inputPredictedField": "auto"
    },
    "modelConfig": {
      "aggregationInfo": {
        "seconds": 0,
        "fields": [],
        "months": 0,
        "days": 0,
        "years": 0,
        "hours": 0,
        "microseconds": 0,
        "weeks": 0,
        "minutes": 0,
        "milliseconds": 0
      },
      "model": "CLA",
      "version": 1,
      "predictAheadTime": None,
      "modelParams": {
        "sensorParams": {
          "verbosity": 0,
          "encoders": {
            "c0_dayOfWeek": None,
            "c0_timeOfDay": {
              "type": "DateEncoder",
              "timeOfDay": [21, 9],
              "fieldname": "c0",
              "name": "c0"
            },
            "c1": {
              "name": "c1",
              "resolution": 1.0166818794743933,
              "seed": 42,
              "fieldname": "c1",
              "type": "RandomDistributedScalarEncoder"
            },
            "c0_weekend": None
          },
          "sensorAutoReset": None
        },
        "clEnable": False,
        "spParams": {
          "columnCount": 2048,
          "spVerbosity": 0,
          "maxBoost": 1.0,
          "spatialImp": "cpp",
          "inputWidth": 0,
          "synPermInactiveDec": 0.0005,
          "synPermConnected": 0.1,
          "synPermActiveInc": 0.0015,
          "seed": 1956,
          "numActiveColumnsPerInhArea": 40,
          "globalInhibition": 1,
          "potentialPct": 0.8
        },
        "trainSPNetOnlyIfRequested": False,
        "clParams": {
          "alpha": 0.035828933612158,
          "clVerbosity": 0,
          "steps": "1",
          "regionName": "CLAClassifierRegion"
        },
        "tpParams": {
          "columnCount": 2048,
          "activationThreshold": 13,
          "pamLength": 3,
          "cellsPerColumn": 32,
          "permanenceInc": 0.1,
          "minThreshold": 10,
          "verbosity": 0,
          "maxSynapsesPerSegment": 32,
          "outputType": "normal",
          "globalDecay": 0.0,
          "initialPerm": 0.21,
          "permanenceDec": 0.1,
          "seed": 1960,
          "maxAge": 0,
          "newSynapseCount": 20,
          "maxSegmentsPerCell": 128,
          "temporalImp": "cpp",
          "inputWidth": 2048
        },
        "anomalyParams": {
          "anomalyCacheRecords": None,
          "autoDetectThreshold": None,
          "autoDetectWaitRecords": 5030
        },
        "spEnable": True,
        "inferenceType": "TemporalAnomaly",
        "tpEnable": True
      }
    }
  }
}

sys.stdout.write(json.dumps(PARAM_FINDER_OUTPUT))
sys.stdout.flush()
