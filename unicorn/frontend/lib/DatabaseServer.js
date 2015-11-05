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


// externals

import isElectronRenderer from 'is-electron-renderer';
import jsonQuery from 'jsonquery-engine';
import levelQuery from 'level-queryengine';
import leveldown from 'leveldown';
import levelup from 'levelup';
import path from 'path';
import sublevel from 'level-sublevel';
import {Validator} from 'jsonschema';

// internals

import FileSchema from '../database/schema/File.json';
import MetricSchema from '../database/schema/Metric.json';
import MetricDataSchema from '../database/schema/MetricData.json';

let location = path.join('frontend', 'database', 'data');
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
 * Unicorn: DatabaseServer - Respond to a DatabaseClient over IPC.
 *  For sharing our access to a file-based NodeJS database system.
 *  Meant for heavy persistence.
 * @class
 * @module
 * @param {string} [path] - Database location path (optional)
 * @this DatabaseServer
 */
function DatabaseServer(path) {
  let location = path || DB_FILE_PATH;

  this.validator = new Validator();
  // this.validator.addSchema(AddressSchema, '/Address');

  this.levelup = levelup(location, {
    db: leveldown,
    valueEncoding: 'json'
  })
  this.dbh = sublevel(this.levelup);
}


// GETTERS

/**
 * Get a single File.
 * @param {string} uid - Unique ID of file to get
 * @param {Function} callback - Async callback function(error, results)
 */
DatabaseServer.prototype.getFile = function (uid, callback) {
  const table = this.dbh.sublevel('file');
  table.get(uid, callback);
};

/**
 * Get all/queried Files.
 * @param {Object} query - JSONquery object to use, empty object for all results
 * @param {Function} callback - Async callback function(error, results)
 */
DatabaseServer.prototype.queryFile = function (query, callback) {
  let results = [];
  const table = levelQuery(this.dbh.sublevel('file'));
  table.query.use(jsonQuery());
  table.query(query)
    .on('stats', () => {})
    .on('error', callback)
    .on('data', (result) => {
      results.push(result);
    })
    .on('end', (result) => {
      if (result) {
        results.push(result);
      }
      callback(null, results);
    });
};

/**
 * Get a single Metric.
 * @param {string} uid - Unique ID of metric to get
 * @param {Function} callback - Async callback function(error, results)
 */
DatabaseServer.prototype.getMetric = function (uid, callback) {
  const table = this.dbh.sublevel('metric');
  table.get(uid, callback);
};

/**
 * Get all/queried Metrics.
 * @param {Object} query - JSONquery object to use, empty object for all results
 * @param {Function} callback - Async callback function(error, results)
 */
DatabaseServer.prototype.queryMetric = function (query, callback) {
  let results = [];
  const table = levelQuery(this.dbh.sublevel('metric'));
  table.query.use(jsonQuery());
  table.ensureIndex('file_uid');
  table.query(query)
    .on('stats', () => {})
    .on('error', (error) => {
      callback(error, null);
    })
    .on('data', (result) => {
      results.push(result);
    })
    .on('end', (result) => {
      if (result) {
        results.push(result);
      }
      callback(null, results);
    });
};

/**
 * Get all/queried MetricData records.
 * @callback
 * @method
 * @param {Object} query - DB Query filter object (jsonquery-engine),
 *  empty object "{}" for all results.
 * @param {Function} [callback] - Async callback: function (error, results)
 * @public
 * @this DatabaseServer
 */
DatabaseServer.prototype.queryMetricData = function (query, callback) {
  let results = [];
  const table = levelQuery(this.dbh.sublevel('metricData'));
  table.query.use(jsonQuery());
  table.ensureIndex('metric_uid');
  table.query(query)
    .on('stats', () => {})
    .on('error', (error) => {
      callback(error, null);
    })
    .on('data', (result) => {
      results.push(result);
    })
    .on('end', (result) => {
      if (result) {
        results.push(result);
      }

      // sort by uid, metric_uid, rowid
      results.sort((prev, next) => {
        if (prev.metric_uid === next.metric_uid) {
          if (prev.uid === next.uid) {
            if (prev.rowid > next.rowid) {
              return 1;
            }
            if (prev.rowid < next.rowid) {
              return -1;
            }
            return 0;
          }
          return prev.metric_uid.localeCompare(next.metric_uid);
        }
        return prev.uid.localeCompare(next.uid);
      });

      callback(null, results);
    });
};


// SETTERS

/**
 * Put a single File to DB.
 * @param {Object} file - Data object of File info to save
 * @param {Function} callback - Async callback on done: function(error, results)
 */
DatabaseServer.prototype.putFile = function (file, callback) {
  const table = this.dbh.sublevel('file');
  const validation = this.validator.validate(file, FileSchema);

  if (validation.errors.length) {
    callback(validation.errors, null);
    return;
  }

  table.put(file.uid, file, callback);
};

/**
 * Put multiple Files into DB.
 * @callback
 * @method
 * @param {Array} files - List of File objects to insert
 * @param {Function} callback - Async result handler: function (error, results)
 * @public
 * @this DatabaseServer
 */
DatabaseServer.prototype.putFileBatch = function (files, callback) {
  let ops = [];
  const table = this.dbh.sublevel('file');

  // validate
  files.forEach((file) => {
    const validation = this.validator.validate(file, FileSchema);
    if (validation.errors.length) {
      callback(validation.errors, null);
      return;
    }
  });

  // prepare
  ops = files.map((file) => {
    return {
      type: 'put',
      key: file.uid,
      value: file
    };
  });

  // execute
  table.batch(ops, callback);
};

/**
 * Put a single Metric to DB.
 * @param {Object} metric - Data object of Metric info to save
 * @param {Function} callback - Async callback on done: function(error, results)
 */
DatabaseServer.prototype.putMetric = function (metric, callback) {
  const table = this.dbh.sublevel('metric');
  const validation = this.validator.validate(metric, MetricSchema);

  if (validation.errors.length) {
    callback(validation.errors, null);
    return;
  }

  table.put(metric.uid, metric, callback);
};

/**
 * Put multiple Metrics into DB.
 * @param {Array} metrics - Data objects of Metrics info to save
 * @param {Function} callback - Async callback on done: function(error, results)
 */
DatabaseServer.prototype.putMetricBatch = function (metrics, callback) {
  const table = this.dbh.sublevel('metric');
  let ops = [];

  // validate
  metrics.forEach((metric) => {
    const validation = this.validator.validate (metric, MetricSchema);
    if (validation.errors.length) {
      callback(validation.errors, null);
      return;
    }
  });

  // prepare
  ops = metrics.map((metric) => {
    return {
      type: 'put',
      key: metric.uid,
      value: metric
    };
  });

  // execute
  table.batch(ops, callback);
};

/**
 * Put a single MetricData record to DB.
 * @param {Object} metricData - Data object of MetricData info to save
 * @param {Function} callback - Async callback on done: function(error, results)
 */
DatabaseServer.prototype.putMetricData = function (metricData, callback) {
  const table = this.dbh.sublevel('metricData');
  const validation = this.validator.validate(metricData, MetricDataSchema);

  if (typeof metricDatas === 'string') {
    // JSONify here to get around Electron IPC remote() memory leaks
    metricData = JSON.parse(metricData);
  }

  if (validation.errors.length) {
    callback(validation.errors, null);
    return;
  }

  table.put(metricData.uid, metricData, callback);
};

/**
 * Put multiple MetricData records into DB.
 * @param {Array} metricDatas - List of Data objects of MetricDatas to save
 * @param {Function} callback - Async callback on done: function(error, results)
 */
DatabaseServer.prototype.putMetricDataBatch = function (metricDatas, callback) {
  const table = this.dbh.sublevel('metricData');
  let ops = [];

  if (typeof metricDatas === 'string') {
    // JSONify here to get around Electron IPC remote() memory leaks
    metricDatas = JSON.parse(metricDatas);
  }

  // validate
  metricDatas.forEach((metricData) => {
    const validation = this.validator.validate(metricData, MetricDataSchema);
    if (validation.errors.length) {
      callback(validation.errors, null);
      return;
    }
  });

  // prepare
  ops = metricDatas.map((metricData) => {
    return {
      type: 'put',
      key: metricData.uid,
      value: metricData
    };
  });

  // execute
  table.batch(ops, callback);
};

/**
 * Completely remove an existing database directory.
 * @param  {Function} callback called when the destroy operation is complete,
 *                             with a possible error argument
 */
DatabaseServer.prototype.destroy = function (callback) {
  leveldown.destroy(this.levelup.location, callback);
};

/**
 * Closes the underlying LevelDB store.
 * @param {Function} callback - Receive any error encountered during closing as
 *  the first argument.
 */
DatabaseServer.prototype.close = function (callback) {
  this.levelup.db.close(callback);
};


// EXPORTS
module.exports = DatabaseServer;
