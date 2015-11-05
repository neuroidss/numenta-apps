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

"""
Implements Unicorn's model interface.
"""
import os
import sys



def _scriptIsFrozen():
  """ Returns True if all of the modules are built-in to the interpreter by
  cxFreeze, for example.
  """
  return hasattr(sys, "frozen")



# Update pyproj datadir to point to the frozen directory
# See http://cx-freeze.readthedocs.org/en/latest/faq.html#using-data-files
if _scriptIsFrozen():
  os.environ["PROJ_DIR"] = os.path.join(os.path.dirname(sys.executable),
                                        "pyproj", "data")

from datetime import datetime
import json
import logging
from argparse import ArgumentParser
import traceback

import validictory

from nupic.algorithms.anomaly_likelihood import AnomalyLikelihood
from nupic.data import fieldmeta
from nupic.data import record_stream
from nupic.frameworks.opf.modelfactory import ModelFactory

from nupic.frameworks.opf.common_models.cluster_params import (
  getScalarMetricWithTimeOfDayAnomalyParams)



g_log = logging.getLogger(__name__)



_REPLACE_PATH_SEPARATOR = "/" # Path separator between components in
                              # replacement parameters.
                              # e.g. modelConfig/modelParams/clParams



class _CommandLineArgError(Exception):
  """ Error parsing command-line options """
  pass



class _Options(object):
  """Options returned by _parseArgs"""


  __slots__ = ("modelId", "stats", "replaceParams")


  def __init__(self, modelId, stats, replaceParams):
    """
    :param str modelId: model identifier
    :param dict stats: Metric data stats per stats_schema.json in the
      unicorn_backend package
    :param sequence replaceParams: Parameter replacement PATH REPLACEMENT pairs
    """
    self.modelId = modelId
    self.stats = stats
    self.replaceParams = replaceParams


  @property
  def __dict__(self): # pylint: disable=C0103
    """ Required for **vars() usage
    """
    return {slot:getattr(self, slot) for slot in self.__slots__}



def _parseArgs():
  """ Parse command-line args

  :rtype: _Options object
  :raises _CommandLineArgError: on command-line arg error
  """
  class SilentArgumentParser(ArgumentParser):
    def error(self, msg):
      """Override `error()` to prevent unstructured output to stderr"""
      raise _CommandLineArgError(msg)

  parser = SilentArgumentParser(description=("Start Unicorn ModelRunner that "
                                             "runs a single model."))

  parser.add_argument("--model",
                      type=str,
                      dest="modelId",
                      required=True,
                      help="REQUIRED: Model id string")

  parser.add_argument("--stats",
                      type=str,
                      required=True,
                      help="REQUIRED: See unicorn_backend/stats_schema.json")

  parser.add_argument("--replaceParam",
                      nargs=2,
                      dest="replaceParams", # Note: Difference in name
                                            # accounts for the fact that
                                            # multiple --replaceParam arguments
                                            # are aggregated into a single
                                            # list.
                      action="append",
                      metavar=("PATH", "REPLACEMENT"),
                      default=[],
                      help=(
                        "You may override the default model param by "
                        "specifying a PATH and REPLACEMENT value where PATH "
                        "is a `/`-delimited string composed of keys in the "
                        "swarm params dict returned by `nupic.frameworks.opf"
                        ".common_models.cluster_params"
                        ".getScalarMetricWithTimeOfDayAnomalyParams(), and "
                        "REPLACEMENT is any JSON value.  For example, to set"
                        " verbosity in the spatial pooler, pass "
                        "`--replaceParam "
                        "modelConfig/modelParams/spParams/spVerbosity 1`."
                        "\n\n"
                        "Multiple `--replaceParam PATH REPLACEMENT` args "
                        "are allowed, should you need to replace multiple "
                        "params."))

  options = parser.parse_args()

  if not options.modelId:
    parser.error("Missing or empty --modelId option value")

  if not options.stats:
    parser.error("Missing or empty --stats option value")

  try:
    stats = json.loads(options.stats)
  except ValueError:
    parser.error("Invalid JSON value for --stats")

  # Parse replacement json values into native objects
  replaceParams = [(path, json.loads(replacement))
                   for path, replacement in options.replaceParams]

  # Path to stats schema file is different depending on whether or not the
  # script is frozen. See http://stackoverflow.com/a/2632297
  if _scriptIsFrozen():
    modelRunnerDir = os.path.dirname(os.path.realpath(sys.executable))
  else:
    modelRunnerDir = os.path.dirname(os.path.realpath(__file__))

  try:
    # Assume that stats_schema.json is in the same dir as this script.
    statsSchemaFile = os.path.join(modelRunnerDir, "stats_schema.json")
    with open(statsSchemaFile, "rb") as statsSchema:
      validictory.validate(stats, json.load(statsSchema))
  except validictory.ValidationError as ex:
    parser.error("--stats option value failed schema validation: %r" % (ex,))


  return _Options(modelId=options.modelId,
                  stats=stats,
                  replaceParams=replaceParams)



def _recurseDictAndReplace(targetDict, path, replacementValue):
  """ Recurse dict and replace value at matching key.  Changes are applied
  in-place in mutable dict.

  :param dict targetDict: Target dictionary in which to apply replacement
  :param list path: List of keys comprising the path from root of dict to
    target key; i.e. given targetDict={"a": {"b": {"c": ...}}}, path value of
    ["a", "b", "c"] is equivalent to targetDict["a"]["b"]["c"].
  :param object replacementValue: Replacement value.
  :returns: None;  targetDict is mutated!
  """
  if len(path) == 1:
    targetDict[path[0]] = replacementValue
    return

  for key in targetDict.keys():
    if key == path[0]:
      _recurseDictAndReplace(targetDict[key], path[1:], replacementValue)



class _ModelRunner(object):
  """ Use OPF Model to process metric data samples from stdin and and emit
  anomaly likelihood results to stdout
  """

  # Input column meta info compatible with parameters generated by
  # getScalarMetricWithTimeOfDayAnomalyParams
  _INPUT_RECORD_SCHEMA = (
    fieldmeta.FieldMetaInfo("c0", fieldmeta.FieldMetaType.datetime,
                            fieldmeta.FieldMetaSpecial.timestamp),
    fieldmeta.FieldMetaInfo("c1", fieldmeta.FieldMetaType.float,
                            fieldmeta.FieldMetaSpecial.none),
  )


  def __init__(self, modelId, stats, replaceParams):
    """
    :param str modelId: model identifier
    :param dict stats: Metric data stats per stats_schema.json in the
      unicorn_backend package.
    :param sequence replaceParams: Parameter replacement PATH REPLACEMENT pairs
    """
    self._modelId = modelId

    # NOTE: ModelRecordEncoder is implemented in the pull request
    # https://github.com/numenta/nupic/pull/2432 that is not yet in master.
    self._modelRecordEncoder = record_stream.ModelRecordEncoder(
      fields=self._INPUT_RECORD_SCHEMA)

    self._model = self._createModel(stats=stats, replaceParams=replaceParams)

    self._anomalyLikelihood = AnomalyLikelihood()


  @classmethod
  def _createModel(cls, stats, replaceParams):
    """Instantiate and configure an OPF model

    :param dict stats: Metric data stats per stats_schema.json in the
      unicorn_backend package.
    :param sequence replaceParams: Parameter replacement PATH REPLACEMENT pairs
    :returns: OPF Model instance
    """
    # Generate swarm params
    swarmParams = getScalarMetricWithTimeOfDayAnomalyParams(
      metricData=[0],
      minVal=stats["min"],
      maxVal=stats["max"],
      minResolution=stats.get("minResolution"))

    for path, replacement in replaceParams:
      _recurseDictAndReplace(swarmParams,
                             path.split(_REPLACE_PATH_SEPARATOR),
                             replacement)

    model = ModelFactory.create(modelConfig=swarmParams["modelConfig"])
    model.enableLearning()
    model.enableInference(swarmParams["inferenceArgs"])

    return model


  @classmethod
  def _readInputMessages(cls):
    """Create a generator that waits for and yields input messages from
    stdin

    yields two-tuple (<timestamp>, <scalar-value>), where <timestamp> is the
    `datetime.datetime` timestamp of the metric data sample and <scalar-value>
    is the floating point value of the metric data sample.
    """
    while True:
      message = sys.stdin.readline()

      if message:
        timestamp, scalarValue = json.loads(message)
        yield (datetime.utcfromtimestamp(timestamp), scalarValue)
      else:
        # Front End closed the pipe (or died)
        break


  @classmethod
  def _emitOutputMessage(cls, rowIndex, anomalyProbability):
    """Emit output message to stdout

    :param int rowIndex: 0-based index of corresponding input sample
    :param float anomalyProbability: computed anomaly probability value
    """
    message = "%s\n" % (json.dumps([rowIndex, anomalyProbability]),)

    sys.stdout.write(message)
    sys.stdout.flush()


  def _computeAnomalyProbability(self, inputRow):
    """ Compute anomaly log likelihood score

    :param tuple inputRow: Two-tuple input metric data row
      (<datetime-timestamp>, <float-scalar>)

    :returns: Log-scaled anomaly probability
    :rtype: float
    """
    # Generate raw anomaly score
    inputRecord = self._modelRecordEncoder.encode(inputRow)
    rawAnomalyScore = self._model.run(inputRecord).inferences["anomalyScore"]

    # Generate anomaly likelihood score
    anomalyProbability = self._anomalyLikelihood.anomalyProbability(
      value=inputRow[1],
      anomalyScore=rawAnomalyScore,
      timestamp=inputRow[0])

    return self._anomalyLikelihood.computeLogLikelihood(anomalyProbability)


  def run(self):
    """ Run the model: ingest and process the input metric data and emit output
    messages containing anomaly scores
    """
    g_log.info("Processing model=%s", self._modelId)

    for rowIndex, inputRow in enumerate(self._readInputMessages()):
      anomalyProbability = self._computeAnomalyProbability(inputRow)

      self._emitOutputMessage(rowIndex=rowIndex,
                              anomalyProbability=anomalyProbability)



def main():
  # Use NullHandler for now to avoid getting the unwanted unformatted warning
  # message from logger on stderr "No handlers could be found for logger".
  g_log.addHandler(logging.NullHandler())
  try:

    _ModelRunner(**vars(_parseArgs())).run()

  except Exception as ex:  # pylint: disable=W0703
    g_log.exception("ModelRunner failed")

    errorMessage = {
      "errorText": str(ex) or repr(ex),
      "diagnosticInfo": traceback.format_exc()
    }

    errorMessage = "%s\n" % (json.dumps(errorMessage))

    try:
      sys.stderr.write(errorMessage)
      sys.stderr.flush()
    except Exception:  # pylint: disable=W0703
      g_log.exception("Failed to emit error message to stderr; msg=%s",
                      errorMessage)

    # Use os._exit to abort the process instead of an exception to prevent
    # the python runtime from dumping traceback to stderr (since we dump a json
    # message to stderr, and don't want the extra text to interfere with parsing
    # in the Front End)
    os._exit(1)  # pylint: disable=W0212



if __name__ == "__main__":
  main()
