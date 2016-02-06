// Copyright © 2015, Numenta, Inc. Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify it
// under the terms of the GNU Affero Public License version 3 as published by
// the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for
// more details.
//
// You should have received a copy of the GNU Affero Public License along with
// this program. If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/


// NOTE: Must be ES5 for now, Electron's `remote` does not like ES6 Classes!


import fs from 'fs';
import isElectronRenderer from 'is-electron-renderer';
import json2csv from 'json2csv-stream';
import leveldown from 'leveldown';
import levelup from 'levelup';
import path from 'path';
import sublevel from 'level-sublevel';
import Batch from 'level-sublevel/batch';
import {Validator} from 'jsonschema';

import MetricDataSchema from '../database/schema/MetricData.json';
import MetricSchema from '../database/schema/Metric.json';
import FileSchema from '../database/schema/File.json';

let location = path.join('js', 'database', 'data');
if (! isElectronRenderer) {
  try {
    // This module is only available inside 'Electron' main process
    // See https://github.com/atom/electron/blob/master/docs/api/app.md
    const app = require('app'); // eslint-disable-line
    location = path.join(app.getPath('userData'), 'database');
  } catch (error) { /* no-op */ }
}
const DB_FILE_PATH = location;


/**
 * Unicorn: DatabaseService - Respond to a DatabaseClient over IPC.
 *  For sharing our access to a file-based NodeJS database system.
 *  Meant for heavy persistence.
 * @param {string} [path] - Database location path (optional)
 */
function DatabaseService(path) {
  let location = path || DB_FILE_PATH;

  this.validator = new Validator();
  this.levelup = levelup(location, {
    db: leveldown,
    valueEncoding: 'json'
  });
  this._root = sublevel(this.levelup);
  this._files = this._root.sublevel('File');
  this._metrics = this._root.sublevel('Metric');
  this._metricData = this._root.sublevel('MetricData');
}


// GETTERS

/**
 * Get a single File.
 * @param {string} uid - Unique ID of file to get
 * @param {Function} callback - Async callback function(error, results)
 */
DatabaseService.prototype.getFile = function (uid, callback) {
  this._files.get(uid, callback);
};

/**
 * Get all Files.
 * @param {Function} callback - Async callback function(error, results)
 */
DatabaseService.prototype.getAllFiles = function (callback) {
  let results = [];
  this._files.createValueStream()
    .on('data', (file) => {
      results.push(file);
    })
    .on('error', callback)
    .on('end', () => {
      callback(null, results);
    });
};

/**
 * Get a single Metric.
 * @param {string} uid - Unique ID of metric to get
 * @param {Function} callback - Async callback function(error, results)
 */
DatabaseService.prototype.getMetric = function (uid, callback) {
  this._metrics.get(uid, callback);
};

/**
 * Get all Metrics.
 * @param {Function} callback - Async callback function(error, results)
 */
DatabaseService.prototype.getAllMetrics = function (callback) {
  let results = [];
  this._metrics.createValueStream()
    .on('data', (metric) => {
      results.push(metric);
    })
    .on('error', callback)
    .on('end', () => {
      callback(null, results);
    });
};

/**
 * Get all metrics of the given file Id
 * @param {string}   fileId    The ID of the file to get metrics
 * @param {Function} callback - Async callback function(error, results)
 */
DatabaseService.prototype.getMetricsByFile = function (fileId, callback) {
  let results = [];
  // Metric UID is based on file Id. See Util.generateMetricId
  this._metrics.createValueStream({
    gte: `${fileId}`,
    lt:  `${fileId}\xff`
  })
  .on('data', (metric) => {
    results.push(metric);
  })
  .on('error', callback)
  .on('end', () => {
    callback(null, results);
  });
};

/**
 * Get all/queried MetricData records.
 * @callback
 * @param {string} metricId Metric ID
 * @param {Function} callback - Async callback: function (error, results)
 */
DatabaseService.prototype.getMetricData = function (metricId, callback) {
  let results = [];
  // Metric Data ID is based on metricId. See Util.generateMetricDataId
  this._metricData.createValueStream({
    gte: `${metricId}`,
    lt:  `${metricId}\xff`
  })
  .on('data', (metric) => {
    results.push(metric);
  })
  .on('error', callback)
  .on('end', () => {
    callback(null, results);
  });
};


// SETTERS

/**
 * Put a single File to DB.
 * @param {Object} file - Data object of File info to save
 * @param {Function} callback - Async callback on done: function(error, results)
 */
DatabaseService.prototype.putFile = function (file, callback) {
  const validation = this.validator.validate(file, FileSchema);

  if (validation.errors.length) {
    callback(validation.errors, null);
    return;
  }

  this._files.put(file.uid, file, callback);
};

/**
 * Put multiple Files into DB.
 * @callback
 * @param {Array} files - List of File objects to insert
 * @param {Function} callback - Async result handler: function (error, results)
 */
DatabaseService.prototype.putFileBatch = function (files, callback) {
  // validate
  for (let i=0; i<files.length; i++) {
    const validation = this.validator.validate(files[i], FileSchema);
    if (validation.errors.length) {
      callback(validation.errors, null);
      return;
    }
  }

  // prepare
  let ops = files.map((file) => {
    return {
      type: 'put',
      key: file.uid,
      value: file
    };
  });

  // execute
  this._files.batch(ops, callback);
};

/**
 * Put a single Metric to DB.
 * @param {Object} metric - Data object of Metric info to save
 * @param {Function} callback - Async callback on done: function(error, results)
 */
DatabaseService.prototype.putMetric = function (metric, callback) {
  const validation = this.validator.validate(metric, MetricSchema);

  if (validation.errors.length) {
    callback(validation.errors, null);
    return;
  }

  this._metrics.put(metric.uid, metric, callback);
};

/**
 * Put multiple Metrics into DB.
 * @param {Array} metrics - Data objects of Metrics info to save
 * @param {Function} callback - Async callback on done: function(error, results)
 */
DatabaseService.prototype.putMetricBatch = function (metrics, callback) {
  // validate
  for (let i=0; i<metrics.length; i++) {
    const validation = this.validator.validate(metrics[i], MetricSchema);
    if (validation.errors.length) {
      callback(validation.errors, null);
      return;
    }
  }

  // prepare
  let ops = metrics.map((metric) => {
    return {
      type: 'put',
      key: metric.uid,
      value: metric
    };
  });

  // execute
  this._metrics.batch(ops, callback);
};

/**
 * Put a single MetricData record to DB.
 * @param {Object} metricData - Data object of MetricData info to save
 * @param {Function} callback - Async callback on done: function(error, results)
 */
DatabaseService.prototype.putMetricData = function (metricData, callback) {
  const validation = this.validator.validate(metricData, MetricDataSchema);

  if (typeof metricData === 'string') {
    // JSONify here to get around Electron IPC remote() memory leaks
    metricData = JSON.parse(metricData);
  }

  if (validation.errors.length) {
    callback(validation.errors, null);
    return;
  }

  this._metricData.put(metricData.uid, metricData, callback);
};

/**
 * Put multiple MetricData records into DB.
 * @param {Array} data - List of Metric Data objects of MetricDatas to save
 * @param {Function} callback - Async callback on done: function(error, results)
 */
DatabaseService.prototype.putMetricDataBatch = function (data, callback) {
  if (typeof data === 'string') {
    // JSONify here to get around Electron IPC remote() memory leaks
    data = JSON.parse(data);
  }

  // validate
  for (let i=0; i<data.length; i++) {
    const validation = this.validator.validate(data[i], MetricDataSchema);
    if (validation.errors.length) {
      callback(validation.errors, null);
      return;
    }
  }

  // prepare
  let ops = data.map((metricData) => {
    return {
      type: 'put',
      key: metricData.uid,
      value: metricData
    };
  });

  // execute
  this._metricData.batch(ops, callback);
};

/**
 * Completely remove an existing database directory.
 * @param  {Function} callback called when the destroy operation is complete,
 *                             with a possible error argument
 */
DatabaseService.prototype.destroy = function (callback) {
  leveldown.destroy(this.levelup.location, callback);
};

/**
 * Closes the underlying LevelDB store.
 * @param {Function} callback - Receive any error encountered during closing as
 *  the first argument.
 */
DatabaseService.prototype.close = function (callback) {
  this.levelup.db.close(callback);
};


/**
 * Exports model results into a CSV file
 * @param  {string}   metricId The metric from which to export results
 * @param  {string}   filename Full path name for the destination file (.csv)
 * @param  {Function} callback called when the export operation is complete,
 *                             with a possible error argument
 */
DatabaseService.prototype.exportMetricData =
function (metricId, filename, callback) {
  const output = fs.createWriteStream(filename);
  const parser = json2csv({
    keys: ['timestamp', 'metric_value', 'anomaly_likelihood']
  });
  parser.pipe(output);

  // Metric Data id is based on metric Id. See Util.generateMetricDataId
  this._metricData.createValueStream({
    gte: `${metricId}`,
    lt:  `${metricId}\xff`
  })
  .on('error', (error) => {
    parser.destroy();
    callback(error);
  })
  .on('data', (result) => {
    parser.write(JSON.stringify(result));
  })
  .on('end', () => {
    parser.end();
    callback();
  });
}

/**
 * Delete all data for the given metric
 * @param  {string}   metricId Metric to delete data
 * @param  {Function} callback called when the operation is complete,
 *                             with a possible error argument
 */
DatabaseService.prototype.deleteMetricData = function (metricId, callback) {
  let batch = new Batch(this._metricData);
  this._metricData.createKeyStream({
    gte: `${metricId}`,
    lt:  `${metricId}\xff`
  })
  .on('data', (uid) => {
    batch.del(uid);
  })
  .on('error',callback)
  .on('end', () => {
    batch.write(callback);
  });
}

/**
 * Delete metric and associated data from database.
 * @param  {string}   metricId Metric to delete
 * @param  {Function} callback called when the operation is complete,
 *                             with a possible error argument
 */
DatabaseService.prototype.deleteMetric = function (metricId, callback) {
  this._metrics.del(metricId, (error) => {
    if (error) {
      callback(error);
      return;
    }
    this.deleteMetricData(metricId, callback);
  })
}

/**
 * Delete all metrics for the given file
 * @param {string}   fileId    The ID of the file to delete the metrics from
 * @param  {Function} callback called when the operation is complete,
 *                             with a possible error argument
 */
DatabaseService.prototype.deleteMetricsByFile = function (fileId, callback) {
  let metrics = [];
  this._metrics.createKeyStream({
    gte: `${fileId}`,
    lt:  `${fileId}\xff`
  })
  .on('data', (id) => {
    metrics.push(id);
  })
  .on('error', callback)
  .on('end', () => {
    for (let i=0; i<metrics.length; i++) {
      this.deleteMetric(metrics[i], (error) => {
        if (error) {
          callback(error);
          return;
        }
      });
    }
    callback();
  });
}

/**
 * Delete metric and associated metrics from database.
 * @param  {string}   fileId   File to delete
 * @param  {Function} callback called when the operation is complete,
 *                             with a possible error argument
 */
DatabaseService.prototype.deleteFile = function (fileId, callback) {
  this._files.del(fileId, (error) => {
    if (error) {
      callback(error);
      return;
    }
    this.deleteMetricsByFile(fileId, callback);
  });
}

// EXPORTS
export default DatabaseService;
