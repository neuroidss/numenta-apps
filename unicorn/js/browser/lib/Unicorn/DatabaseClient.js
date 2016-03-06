// Copyright © 2016, Numenta, Inc. Unless you have purchased from
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


/**
 * Unicorn: DatabaseClient - Talk to a DatabaseService over IPC, gaining
 *  access to the Node/io.js layer of filesystem, so we can CRUD against a
 *  flat-file database. Connects via IPC adapter. DatabaseClientIPC
 *  adpater is currently a pseudo-library, using the magic of Electron's
 *  `remote` module.
 */

let remote = require('remote'); // eslint-disable-line


/**
 * Get all metrics from the database as a {@link Promise}
 * @param {DatabaseClient} db instance to {DatabaseClient} object
 * @return {Promise}   A promise resolving to all metrics
 */
export function promiseMetricsFromDB(db) {
  return new Promise((resolve, reject) => {
    db.getAllMetrics((error, metrics) => {
      if (error) {
        reject(error);
      } else {
        resolve(metrics);
      }
    });
  });
}

/**
 * Creates a {@link Promise} used to save the given metrics to the database
 * @param {DatabaseClient} db instance to {DatabaseClient} object
 * @param  {Array<MetricStore.Metric>} metrics Metrics to save
 * @return {Promise}   A promise resolving to all saved metrics
 */
export function promiseSaveMetricsToDB(db, metrics) {
  return new Promise((resolve, reject) => {
    db.putMetricBatch(metrics, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(metrics);
      }
    });
  });
}

/**
 * Creates a {@link Promise} used to save the given files to the database
 * @param {DatabaseClient} db instance to {DatabaseClient} object
 * @param  {Array<FilesStore.File>} files Files to save
 * @return {Promise}   A promise resolving to all saved files
 */
export function promiseSaveFilesIntoDB(db, files) {
  return new Promise((resolve, reject) => {
    db.putFileBatch(files, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(files);
      }
    });
  });
}


let client = remote.require('./DatabaseService').default; // Get singleton
export default client;
