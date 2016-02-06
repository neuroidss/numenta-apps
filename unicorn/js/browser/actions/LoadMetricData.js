// Copyright © 2015, Numenta, Inc.  Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero Public License version 3 as published by the Free
// Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License along with
// this program.  If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/


import {ACTIONS} from '../lib/Constants';

/**
 * Load metric data directly from the file.
 * Original File must exist in the file system.
 *
 * @param {FluxibleContext} actionContext Fluxible action context object
 * @param  {string} metricId Metric to load. Infers filename from metric
 * @return {Promise} Promise resolving to the metric data
 */
function loadMetricDataFromFile(actionContext, metricId) {
  let db = actionContext.getDatabaseClient();
  let fileClient = actionContext.getFileClient();

  // Get Metric name and file from database
  return new Promise((resolve, reject) => {
    db.getMetric(metricId, (error, metric) => {
      if (error) return reject(error);

      resolve({
        fileId: metric.file_uid,
        valueField: metric.name
      });
    })
  }).then((payload) => {
    let {fileId, valueField} = payload;

    // Get File name from database
    return new Promise((resolve, reject) => {
      db.getFile(fileId, (error, file) => {
        if (error) return reject(error);

        resolve({
          filename: file.filename,
          fileId,
          valueField
        });
      });
    });
  }).then((payload) => {
    let {filename, fileId, valueField} = payload;

    // Get first timestamp field from file
    return new Promise((resolve, reject) => {
      db.getMetricsByFile(fileId, (error, metrics) => {
        if (error) return reject(error);

        // Select first timestamp field
        let timestampField = metrics.find((field) => {
          return field.type === 'date';
        });
        if (!timestampField) {
          return reject('Missing timestamp');
        }
        resolve({
          filename,
          valueField,
          timestampField: timestampField.name
        });
      });
    });
  }).then((payload) => {
    let {filename, valueField, timestampField} = payload;

    // Read all data from file
    return new Promise((resolve, reject) => {
      let results = [];
      fileClient.getData(filename, (error, data) => {
        if (error) return reject(error);

        if (data) {
          let row = JSON.parse(data);
          results.push([
            new Date(row[timestampField]),
            new Number(row[valueField])]).valueOf();
        } else {
          // No more data
          resolve(results);
        }
      });
    });
  });
}

export default function (actionContext, metricId) {
  return new Promise((resolve, reject) => {
    // Try to load metric data from database
    let db = actionContext.getDatabaseClient();
    db.getMetricData(metricId, (error, metricData) => {
      if (error) return reject(error);

      if (metricData.length === 0) {
        // Metric data was not found in the database. Load data from file
        loadMetricDataFromFile(actionContext, metricId).then((data) => {
          actionContext.dispatch(ACTIONS.LOAD_METRIC_DATA, {metricId, data});
          resolve(data);
        }).catch(reject);
      } else {
        // Found metric data in database
        let data = metricData.map((row) => {
          return [new Date(row.timestamp), row.metric_value];
        });
        actionContext.dispatch(ACTIONS.LOAD_METRIC_DATA, {metricId, data});
        resolve(data);
      }
    });
  });
}
