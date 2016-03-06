// Copyright © 2016, Numenta, Inc. Unless you have purchased from
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

import fs from 'fs';
import os from 'os';
import isElectronRenderer from 'is-electron-renderer';
import fileService from './FileService';
import instantiator from 'json-schema-instantiator';
import json2csv from 'json2csv-stream';
import leveldown from 'leveldown';
import levelup from 'levelup';
import path from 'path';
import sublevel from 'level-sublevel';
import Batch from 'level-sublevel/batch';
import {Validator} from 'jsonschema';
import Utils from './Utils';

// Schemas
import {
  DBFileSchema,
  DBMetricDataSchema,
  DBMetricSchema,
  DBModelDataSchema,

  MRAggregationSchema,
  MRInputSchema,
  MRModelSchema,

  PFInputSchema,
  PFOutputSchema
} from '../database/schema';

const SCHEMAS = [
  DBFileSchema, DBMetricDataSchema, DBMetricSchema, DBModelDataSchema,
  MRAggregationSchema, MRInputSchema, MRModelSchema,
  PFInputSchema, PFOutputSchema
];


/**
 * Calculate default database location. If running inside `Electron` then use
 * the application user data folder.
 * See https://github.com/atom/electron/blob/master/docs/api/app.md
 * @return {string} Full path name
 */
function _getDefaultDatabaseLocation() {
  let location = path.join(os.tmpdir());
  if (!isElectronRenderer) {
    try {
      // This module is only available inside 'Electron' main process
      const app = require('app'); // eslint-disable-line
      location = path.join(app.getPath('userData'), 'database');
    } catch (error) { /* no-op */ }
  }
  return location;
}

/**
 * Helper function used to stringify the callback results. This is required when
 * transmiting objects via Electron's `remote` function.
 * @param  {Function} callback The original callback
 * @return {Function}          A callback that will call the original callback
 *                             with the results stringified
 */
function stringifyResultsCallback(callback) {
  return (error, data) => callback(error, JSON.stringify(data));
}


/**
 * Unicorn: DatabaseService - Respond to a DatabaseClient over IPC.
 *  For sharing our access to a file-based NodeJS database system.
 *  Meant for heavy persistence.
 * @param {string} [path] - Database location path (optional)
 */
export class DatabaseService {

  constructor(path) {
    let location = path || _getDefaultDatabaseLocation();

    // Configure schema validator
    this.validator = new Validator();
    SCHEMAS.forEach((schema) => {
      this.validator.addSchema(schema);
    });

    this.levelup = levelup(location, {
      db: leveldown,
      valueEncoding: 'json'
    });
    this._root = sublevel(this.levelup);
    this._files = this._root.sublevel('File');
    this._metrics = this._root.sublevel('Metric');
    this._metricData = this._root.sublevel('MetricData');
    this._modelData = this._root.sublevel('ModelData');
  }

  /**
   * Get a single File.
   * @param {string} uid Unique ID of file to get
   * @param {Function} callback Async callback function(error, results).
   *                            The results will be JSON.stringified
   */
  getFile(uid, callback) {
    this._files.get(uid, stringifyResultsCallback(callback));
  }

  /**
   * Get all Files.
   * @param {Function} callback Async callback function(error, results)
   *                            The results will be JSON.stringified
*/
  getAllFiles(callback) {
    let results = [];
    this._files.createValueStream()
      .on('data', (file) => {
        results.push(file);
      })
      .on('error', callback)
      .on('end', () => {
        let remoteCallback = stringifyResultsCallback(callback);
        remoteCallback(null, results);
      });
  }

  /**
   * Get a single Metric.
   * @param {string} uid - Unique ID of metric to get
   * @param {Function} callback Async callback function(error, results)
   *                            The results will be JSON.stringified
   */
  getMetric(uid, callback) {
    this._metrics.get(uid, stringifyResultsCallback(callback));
  }

  /**
   * Get all Metrics.
   * @param {Function} callback Async callback function(error, results)
   *                            The results will be JSON.stringified
   */
  getAllMetrics(callback) {
    let results = [];
    this._metrics.createValueStream()
      .on('data', (metric) => {
        results.push(metric);
      })
      .on('error', callback)
      .on('end', () => {
        let remoteCallback = stringifyResultsCallback(callback);
        remoteCallback(null, results);
      });
  }

  /**
   * Get all metrics of the given file Id
   * @param {string}   fileId    The ID of the file to get metrics
   * @param {Function} callback Async callback function(error, results)
   *                            The results will be JSON.stringified
   */
  getMetricsByFile(fileId, callback) {
    let results = [];
    // Metric UID is based on file Id. See Util.generateMetricId
    this._metrics.createValueStream({
      gte: `${fileId}`,
      lt: `${fileId}\xff`
    })
    .on('data', (metric) => {
      results.push(metric);
    })
    .on('error', callback)
    .on('end', () => {
      let remoteCallback = stringifyResultsCallback(callback);
      remoteCallback(null, results);
    });
  }

  /**
   * Get all/queried ModelData records.
   * @callback
   * @param {string} metricId Metric ID
   * @param {Function} callback Async callback: function (error, results)
   *                            The results will be JSON.stringified
   */
  getModelData(metricId, callback) {
    let results = [];
    // Metric Data ID is based on metricId. See Util.generateMetricDataId
    this._modelData.createValueStream({
      gte: `${metricId}`,
      lt: `${metricId}\xff`
    })
    .on('data', (metric) => {
      results.push(metric);
    })
    .on('error', callback)
    .on('end', () => {
      let remoteCallback = stringifyResultsCallback(callback);
      remoteCallback(null, results);
    });
  }

  /**
   * Get all/queried MetricData records.
   * @callback
   * @param {string} metricId Metric ID
   * @param {Function} callback Async callback: function (error, results)
   *                            The results will be JSON.stringified
   */
  getMetricData(metricId, callback) {
    let results = [];
    // Metric Data ID is based on metricId. See Util.generateMetricDataId
    this._metricData.createValueStream({
      gte: `${metricId}`,
      lt: `${metricId}\xff`
    })
    .on('data', (metric) => {
      results.push(metric);
    })
    .on('error', callback)
    .on('end', () => {
      let remoteCallback = stringifyResultsCallback(callback);
      remoteCallback(null, results);
    });
  }

  /**
   * Put a single File to DB.
   * @param {Object} file - Data object of File info to save
   * @param {Function} callback - Async done callback: function(error, results)
   */
  putFile(file, callback) {
    if (typeof file === 'string') {
      file = JSON.parse(file);
    }

    const validation = this.validator.validate(file, DBFileSchema);

    if (validation.errors.length) {
      callback(validation.errors, null);
      return;
    }

    this._files.put(file.uid, file, callback);
  }

  /**
   * Put multiple Files into DB.
   * @callback
   * @param {Array} files - List of File objects to insert
   * @param {Function} callback - Async done handler: function (error, results)
   */
  putFileBatch(files, callback) {
    if (typeof files === 'string') {
      files = JSON.parse(files);
    }

    for (let i = 0; i < files.length; i++) {
      const validation = this.validator.validate(files[i], DBFileSchema);
      if (validation.errors.length) {
        callback(validation.errors, null);
        return;
      }
    }

    let ops = files.map((file) => {
      return {
        type: 'put',
        key: file.uid,
        value: file
      };
    });

    this._files.batch(ops, callback);
  }

  /**
   * Put a single Metric to DB.
   * @param {Object} metric - Data object of Metric info to save
   * @param {Function} callback - Async done callback: function(error, results)
   */
  putMetric(metric, callback) {
    if (typeof metric === 'string') {
      metric = JSON.parse(metric);
    }

    const validation = this.validator.validate(metric, DBMetricSchema);
    if (validation.errors.length) {
      callback(validation.errors, null);
      return;
    }

    this._metrics.put(metric.uid, metric, callback);
  }

  /**
   * Put multiple Metrics into DB.
   * @param {Array} metrics - Data objects of Metrics info to save
   * @param {Function} callback - Async done callback: function(error, results)
   */
  putMetricBatch(metrics, callback) {
    if (typeof metrics === 'string') {
      metrics = JSON.parse(metrics);
    }

    for (let i = 0; i < metrics.length; i++) {
      const validation = this.validator.validate(metrics[i], DBMetricSchema);
      if (validation.errors.length) {
        callback(validation.errors, null);
        return;
      }
    }

    let ops = metrics.map((metric) => {
      return {
        type: 'put',
        key: metric.uid,
        value: metric
      };
    });

    this._metrics.batch(ops, callback);
  }

  /**
   * Put a single ModelData record to DB.
   * @param {Object} data - ModelData object to save
   * @param {Function} callback - Async done callback: function(error, results)
   */
  putModelData(data, callback) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    const validation = this.validator.validate(data, DBModelDataSchema);
    if (validation.errors.length) {
      callback(validation.errors, null);
      return;
    }
    let {metric_uid, timestamp} = data;
    let key = Utils.generateMetricDataId(metric_uid, timestamp);
    this._modelData.put(key, data, callback);
  }

  /**
   * Put multiple ModelData records into DB.
   * @param {Array} data - List of ModelData objects to save
   * @param {Function} callback - Async done callback: function(error, results)
   */
  putModelDataBatch(data, callback) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    for (let i = 0; i < data.length; i++) {
      const validation = this.validator.validate(data[i], DBModelDataSchema);
      if (validation.errors.length) {
        callback(validation.errors, null);
        return;
      }
    }

    let ops = data.map((value) => {
      let {metric_uid, timestamp} = value;
      let key = Utils.generateMetricDataId(metric_uid, timestamp);
      return {
        type: 'put', key, value
      };
    });

    this._modelData.batch(ops, callback);
  }

  /**
   * Put a single MetricData record to DB.
   * @param {Object} metricData - Data object of MetricData info to save
   * @param {Function} callback - Async done callback: function(error, results)
   */
  putMetricData(metricData, callback) {
    if (typeof metricData === 'string') {
      metricData = JSON.parse(metricData);
    }
    const validation = this.validator.validate(metricData, DBMetricDataSchema);

    if (validation.errors.length) {
      callback(validation.errors, null);
      return;
    }
    let {metric_uid, timestamp} = metricData;
    let key = Utils.generateMetricDataId(metric_uid, timestamp);
    this._metricData.put(key, metricData, callback);
  }

  /**
   * Put multiple MetricData records into DB.
   * @param {Array} data - List of Metric Data objects of MetricDatas to save
   * @param {Function} callback - Async done callback: function(error, results)
   */
  putMetricDataBatch(data, callback) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    for (let i = 0; i < data.length; i++) {
      const validation = this.validator.validate(data[i], DBMetricDataSchema);
      if (validation.errors.length) {
        callback(validation.errors, null);
        return;
      }
    }

    let ops = data.map((value) => {
      let {metric_uid, timestamp} = value;
      let key = Utils.generateMetricDataId(metric_uid, timestamp);
      return {
        type: 'put', key, value
      };
    });

    this._metricData.batch(ops, callback);
  }

  /**
   * Completely remove an existing database directory.
   * @param  {Function} callback called when the destroy operation is complete,
   *                             with a possible error argument
   */
  destroy(callback) {
    leveldown.destroy(this.levelup.location, callback);
  }

  /**
   * Closes the underlying LevelDB store.
   * @param {Function} callback - Receive any error encountered during closing
   *  as the first argument.
   */
  close(callback) {
    this.levelup.db.close(callback);
  }

  /**
   * Exports model results into a CSV file
   * @param  {string}   metricId The metric from which to export results
   * @param  {string}   filename Full path name for the destination file (.csv)
   * @param  {Function} callback called when the export operation is complete,
   *                             with a possible error argument
   */
  exportModelData(metricId, filename, callback) {
    const output = fs.createWriteStream(filename);
    const parser = json2csv({
      keys: ['timestamp', 'metric_value', 'anomaly_score']
    });
    parser.pipe(output);

    // Metric Data id is based on metric Id. See Util.generateMetricDataId
    this._modelData.createValueStream({
      gte: `${metricId}`,
      lt: `${metricId}\xff`
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
   * Delete raw data for the given metric
   * @param  {string}   metricId Metric to delete data
   * @param  {Function} callback called when the operation is complete,
   *                             with a possible error argument
   */
  deleteMetricData(metricId, callback) {
    let batch = new Batch(this._metricData);
    this._metricData.createKeyStream({
      gte: `${metricId}`,
      lt: `${metricId}\xff`
    })
    .on('data', (uid) => {
      batch.del(uid);
    })
    .on('error', callback)
    .on('end', () => {
      batch.write(callback);
    });
  }

  /**
   * Delete model data for the given metric
   * @param  {string}   metricId Metric to delete model data
   * @param  {Function} callback called when the operation is complete,
   *                             with a possible error argument
   */
  deleteModelData(metricId, callback) {
    let batch = new Batch(this._modelData);
    this._modelData.createKeyStream({
      gte: `${metricId}`,
      lt: `${metricId}\xff`
    })
    .on('data', (uid) => {
      batch.del(uid);
    })
    .on('error', callback)
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
  deleteMetric(metricId, callback) {
    this._metrics.del(metricId, (error) => {
      if (error) {
        callback(error);
        return;
      }
      this.deleteMetricData(metricId, (error) => {
        if (error) {
          callback(error);
          return;
        }
        this.deleteModelData(metricId, callback);
      });
    })
  }

  /**
   * Delete all metrics for the given file
   * @param {string}   fileId    The ID of the file to delete the metrics from
   * @param  {Function} callback called when the operation is complete,
   *                             with a possible error argument
   */
  deleteMetricsByFile(fileId, callback) {
    let metrics = [];
    this._metrics.createKeyStream({
      gte: `${fileId}`,
      lt: `${fileId}\xff`
    })
    .on('data', (id) => {
      metrics.push(id);
    })
    .on('error', callback)
    .on('end', () => {
      for (let i = 0; i < metrics.length; i++) {
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
  deleteFileById(fileId, callback) {
    this._files.del(fileId, (error) => {
      if (error) {
        callback(error);
        return;
      }
      this.deleteMetricsByFile(fileId, callback);
    });
  }

  /**
   * Delete metric and associated metrics from database.
   * @param  {string}   filename   File to delete
   * @param  {Function} callback called when the operation is complete,
   *                             with a possible error argument
   */
  deleteFile(filename, callback) {
    let fileId = Utils.generateFileId(filename);
    this._files.del(fileId, (error) => {
      if (error) {
        callback(error);
        return;
      }
      this.deleteMetricsByFile(fileId, callback);
    });
  }

  /**
   * Update aggregation options for the given metric. Usually this value is
   * obtained via the {@link ParamFinderService}
   *
   * @param {string} metricId  Metric to update
   * @param {object} options   Aggregation options, usually obtained via
   *                             {@link ParamFinderService}
   * @param  {Function} callback called when the operation is complete,
   *                             with a possible error argument
   */
  setMetricAggregationOptions(metricId, options, callback) {
    if (typeof options === 'string') {
      options = JSON.parse(options);
    }

    this._metrics.get(metricId, (error, metric) => {
      if (error) {
        callback(error);
        return;
      }
      metric['aggregation_options'] = options;
      this.putMetric(metric, callback);
    });
  }

  /**
   * Update model options for the given metric. Usually this value is
   * obtained via the {@link ParamFinderService}
   * @param {String} metricId - Metric to update
   * @param {Object} options - Model option to use for the given metric.
   *                           Usually obtained via {@link ParamFinderService}
   * @param {Function} callback - Called when the operation is complete,
   *                              with a possible error argument.
   */
  setMetricModelOptions(metricId, options, callback) {
    if (typeof options === 'string') {
      options = JSON.parse(options);
    }

    this._metrics.get(metricId, (error, metric) => {
      if (error) {
        callback(error);
        return;
      }
      metric['model_options'] = options;
      this.putMetric(metric, callback);
    });
  }

  /**
   * Update input options for the given metric. Usually this value is
   * obtained via the {@link ParamFinderService}
   * @param {String} metricId - Metric to update
   * @param {Object} options - Input option to use for the given metric.
   *                           Usually obtained via {@link ParamFinderService}
   * @param {Function} callback - Called when the operation is complete,
   *                              with a possible error argument.
   */
  setMetricInputOptions(metricId, options, callback) {
    if (typeof options === 'string') {
      options = JSON.parse(options);
    }

    this._metrics.get(metricId, (error, metric) => {
      if (error) {
        callback(error);
        return;
      }
      metric['input_options'] = options;
      this.putMetric(metric, callback);
    });
  }

  /**
   * Upload a new file to the database performing the following steps:
   *  1) Save file metadata
   *  2) Save fields/metrics metadata
   *  3) Save metric data
   *
   * @param {string|File} fileToUpload - Full path name or preconfigured File
   *                                     object. See {@link DBFileSchema}.
   * @param {Function} callback - Called when the operation is complete with the
   *                              uploaded file record or error.
   */
  uploadFile(fileToUpload, callback) {
    let file = fileToUpload;
    if (typeof file === 'string') {
      file = instantiator.instantiate(DBFileSchema);
      file.uid = Utils.generateFileId(fileToUpload);
      file.filename = fileToUpload;
      file.name = path.basename(fileToUpload);
      file.type = 'uploaded';
    } else {
      // Validate file object
      const validation = this.validator.validate(file, DBFileSchema);
      if (validation.errors.length) {
        callback(validation.errors);
        return;
      }
    }
    let promisify = Utils.promisify;
    // Save file
    promisify(::this.putFile, file)
      // Load metrics from file
      .then(() => promisify(::fileService.getFields, file.filename))
      // Create metrics for each numeric and timestamp fields
      .then((fields) => {
        let metrics = fields.filter((field) => {
          return ['date', 'number'].includes(field.type);
        });
        return promisify(::this.putMetricBatch, metrics)
          .then(() => Promise.resolve(metrics));
      })
      // Load data
      .then((metrics) => {
        // Find timestamp field
        let timestampField = metrics.find((field) => {
          return field.type === 'date';
        }).name;

        // Load data from file
        fileService.getData(
          file.filename,
          {objectMode: true},
          (error, data) => {
            if (error) {
              throw error;
            }
            if (data) {
              metrics.forEach((field) => {
                // Save metric for each numeric field
                if (field.type === 'number') {
                  let mid = Utils.generateMetricId(file.filename, field.name);
                  let metricData = {
                    metric_uid: mid,
                    timestamp: data[timestampField],
                    metric_value: parseFloat(data[field.name])
                  };
                  // Save data
                  this.putMetricData(metricData, (error) => { // eslint-disable-line
                    if (error) {
                      throw error;
                    }
                  });
                }
              });
            } else {
              // No more data
              callback(null, file);
              return;
            }
          }
        );
      })
      .catch(callback);
  }

}

// Returns singleton
const INSTANCE = new DatabaseService();
export default INSTANCE;
