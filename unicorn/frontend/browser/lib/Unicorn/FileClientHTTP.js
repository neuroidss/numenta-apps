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


/**
 * Unicorn: FileClientHTTP - HTTP Adapter (one of many) for FileClient (talks to
 *  a FileServer) to access the Node/io.js layer of filesystem, so we can
 *  CRUD files.
 */
export default class FileClientHTTP {

  /**
   * @constructor
   */
  constructor() {}

  /**
   * @param {Function} callback - Async callback function(error, results) after
   */
  getFile(callback) {
    // callback(error, null);
    callback(null, {file: ['data and such']});
  }

  /**
   * @param {Function} callback - Async callback function(error, results) after
   */
  getFiles(callback) {
    // callback(error, null);
    callback(null, {
      files: ['uno.csv', 'dos.csv']
    });
  }

}
