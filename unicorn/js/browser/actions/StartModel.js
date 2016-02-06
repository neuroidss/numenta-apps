// Copyright © 2015, Numenta, Inc. Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero Public License version 3 as published by the
// Free Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License along with
// this program. If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/


/*eslint-disable*/
/**
 *  @external {csp.chan} https://github.com/ubolonton/js-csp/blob/master/doc/basic.md#channels
 */
 /*eslint-enable*/

import csp from 'js-csp';

import {ACTIONS} from '../lib/Constants';
import ModelStore from '../stores/ModelStore';
import SendMetricDataAction from '../actions/SendMetricData';
import StopModelAction from '../actions/StopModel';
import Utils from '../../main/Utils';
import {
  DatabaseGetError, DatabasePutError, FilesystemGetError
} from '../../main/UserError';


// FUNCTIONS

function getMetricFromDatabase(options) {
  let {actionContext, model} = options;
  let channel = csp.chan();
  let databaseClient = actionContext.getDatabaseClient();
  let metricId = Utils.generateMetricId(model.filename, model.metric);

  databaseClient.getMetric(metricId, (error, results) => {
    if (error && (!('notFound' in error))) {
      csp.putAsync(channel, new DatabaseGetError(error));
    } else {
      csp.putAsync(channel, results);
    }
  });

  return channel;
}

function getMetricStatsFromFilesystem(options) {
  let {actionContext, model} = options;
  let channel = csp.chan();
  let fileClient = actionContext.getFileClient();

  fileClient.getStatistics(model.filename, (error, stats) => {
    if (error) {
      csp.putAsync(channel, new FilesystemGetError(error));
    } else {
      csp.putAsync(channel, stats);
    }
  });

  return channel;
}

function putMetricStatsIntoDatabase(options) {
  let {actionContext, metric} = options;
  let channel = csp.chan();
  let databaseClient = actionContext.getDatabaseClient();

  databaseClient.putMetric(metric, (error) => {
    if (error) {
      csp.putAsync(channel, new DatabasePutError(error));
    } else {
      csp.putAsync(channel, true);
    }
  });

  return channel;
}

/**
 * Check database for previously saved Metric Data.
 * @param {Object} options - Options hash passed in
 * @param {Object} options.actionContext - Fluxible action context object
 * @param {Object} options.model - Model data object
 *
 * @return {csp.chan}
 */
function getMetricDataFromDatabase(options) {
  let {actionContext, model} = options;
  let channel = csp.chan();
  let databaseClient = actionContext.getDatabaseClient();
  databaseClient.getMetricData(model.modelId, (error, results) => {
    if (error) {
      csp.putAsync(channel, new DatabaseGetError(error));
    } else {
      csp.putAsync(channel, results);
    }
  });

  return channel;
}

/**
 * Start streaming data records to the model and emit results.
 * @param {Object} actionContext - Fluxible action context object
 * @param {string} modelId - Unique Model ID to stream data for
 *
 * @return {Promise}
 */
function streamData(actionContext, modelId) {
  let databaseClient = actionContext.getDatabaseClient();
  let fileClient = actionContext.getFileClient();
  let log = actionContext.getLoggerClient();
  let modelStore = actionContext.getStore(ModelStore);
  let model = modelStore.getModel(modelId);
  let rowId = 0;
  let rows = [];

  return new Promise((resolve, reject) => {
    csp.go(function* () {

      log.debug('see if metric data is already saved in DB first');
      let opts = {actionContext, model};
      let metricData = yield csp.take(getMetricDataFromDatabase(opts));
      if (metricData instanceof Error) {
        reject(metricData);
        log.error(new DatabaseGetError(metricData));
        return;
      }
      if (metricData.length > 0) {
        log.debug('yes metric data is already in DB, use it');
        metricData.forEach((row) => {
          actionContext.executeAction(SendMetricDataAction, {
            modelId: model.modelId,
            data: [
              new Date(row[model.timestampField]).getTime() / 1000,
              new Number(row['metric_value']).valueOf()
            ]});
        });

        log.debug('on to UI');
        resolve(model.modelId);
        return;
      }

      log.debug('No metric data in DB, load direct from filesystem and save');
      fileClient.getData(model.filename, (error, data) => {
        let row, timestamp, value;

        if (error) {
          actionContext.executeAction(StopModelAction, model.modelId);
          reject(error);
        } else if (data) {
          try {
            row = JSON.parse(data);
          } catch (error) {
            reject(error);
          }

          // queue for DB
          timestamp = new Date(row[model.timestampField]);
          value = new Number(row[model.metric]).valueOf();
          rows.push({ // getting around Electron IPC remote() memory leaks
            uid: Utils.generateMetricDataId(model.filename, model.metric,
                                            timestamp),
            metric_uid: Utils.generateMetricId(model.filename, model.metric),
            rowid: rowId,
            timestamp: timestamp.toISOString(),
            metric_value: value,
            display_value: value
          });
          rowId++;

          // send new row to UI
          actionContext.executeAction(SendMetricDataAction, {
            modelId: model.modelId,
            data: [(timestamp.getTime() / 1000), value]
          });
        } else {
          log.debug('End of data - Save to DB for future runs.');
          // JSONized here to get around Electron IPC remote() memory leaks
          rows = JSON.stringify(rows);
          databaseClient.putMetricDataBatch(rows, (error) => {
            if (error) {
              reject(error);
            } else {
              log.debug('on to UI');
              resolve(model.modelId);
            }
          });
        }
      }); // fileClient.getData

    }); // csp.go
  }); // Promise
}


// MAIN

/**
 * Action used to Start streaming data to the nupic model. The file will be
 *  streamed one record at the time. 'ReceiveModelData' Action will be fired as
 *  results become available.
 * @param {FluxibleContext} actionContext - Fluxible action context object
 * @param {string} model - An object with model+data to start
 * @return {Promise} - Promise object to stream data in on, resolves when done
 */
export default function (actionContext, modelId) {
  let log = actionContext.getLoggerClient();
  let modelClient = actionContext.getModelClient();
  let modelStore = actionContext.getStore(ModelStore);
  let model = modelStore.getModel(modelId);

  let fileStats, opts;
  let metric = {};
  let stats = {};

  return new Promise((resolve, reject) => {
    csp.go(function* () {

      log.debug('see if metric min/max is already in DB');
      metric = yield csp.take(getMetricFromDatabase({actionContext, model}));
      if (metric instanceof Error) {
        reject(metric);
        log.error(metric);
        return;
      }
      if (metric && ('min' in metric) && ('max' in metric)) {
        log.debug('yes, metric min/max was already in DB, so prep for use');
        stats.min = metric.min;
        stats.max = metric.max;
      } else {
        log.debug('metric min/max was NOT in DB, so load from FS');
        opts = {actionContext, model};
        fileStats = yield csp.take(getMetricStatsFromFilesystem(opts));
        if (
          (fileStats instanceof Error) ||
          (!(model.metric in fileStats.fields))
        ) {
          reject(fileStats);
          log.error(fileStats);
          return;
        }

        stats = fileStats.fields[model.metric];

        log.debug('Now save min/max back to DB, never have to ping FS again');
        opts = {
          actionContext,
          metric: { // electron ipc remote() needs this obj to rebuilt here :(
            uid: metric.uid,
            file_uid: metric['file_uid'],
            model_uid: modelId,
            name: metric.name,
            type: metric.type,
            min: stats.min,
            max: stats.max
          }
        };
        fileStats = yield csp.take(putMetricStatsIntoDatabase(opts));
        if (fileStats instanceof Error) {
          reject(fileStats);
          log.error(fileStats);
          return;
        }
      }

      log.debug('metric min/max retrieved (either from DB or FS), ready!');
      actionContext.dispatch(ACTIONS.START_MODEL, modelId);
      modelClient.createModel(modelId, {min: stats.min, max: stats.max});
      return streamData(actionContext, modelId);

    }); // csp.go
  }); // promise
} // function
