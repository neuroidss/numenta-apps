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
 * Unicorn: FileClient - Talk to a FileService over IPC or HTTP, gaining
 *  access to the Node/io.js layer of filesystem, so we can CRUD files.
 *  Connects via HTTP or IPC adapter. FileClientIPC adpater is currently a
 *  pseudo-library, using the magic of Electron's `remote` module.
 */

let remote = require('remote'); // eslint-disable-line


/**
 * Get all metrics from the given files as a {@link Promise}
 * @param {FileClient} fs instance to {FileClient} object
 * @param  {Array<FileStore.File>} files Array of files
 * @return {Promise}   A promise resolving to all metrics
 */
export function promiseMetricsFromFiles(fs, files) {
  return Promise.all(files.map((file) => {
    return new Promise((resolve, reject) => {
      fs.getFields(file.filename, (error, metrics) => {
        if (error) {
          reject(error);
        } else {
          resolve(metrics);
        }
      });
    });
  }))
  .then((arrayOfMetrics) => {
    // Combine array of metrics created by Promise.all into one single array
    return [].concat(...arrayOfMetrics);
  });
}

/**
 * Get all sameple files as a {@link Promise}
 * @param {FileClient} fs instance to {FileClient} object
 * @return {Promise}   A promise resolving to all sample files
 */
export function promiseLoadSampleFilesFromDisk(fs) {
  return new Promise((resolve, reject) => {
    // Load sample files
    fs.getSampleFiles((error, files) => {
      if (error) {
        reject(error);
      } else {
        resolve(files);
      }
    });
  });
}


let client = remote.require('./FileService').default; // Get singleton
export default client;
