// Numenta Platform for Intelligent Computing (NuPIC)
// Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero Public License version 3 as
// published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License
// along with this program.  If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/


import BaseStore from 'fluxible/addons/BaseStore';


/**
 * Unicorn File Datasource Store
 */
export default class FileStore extends BaseStore {

  static get storeName() {
    return 'FileStore';
  }

  static get handlers() {
    return {
      UPDATE_FILE_SUCCESS: '_handleSetFile',
      UPLOADED_FILE_SUCCESS: '_handleSetFile',
      LIST_FILES_SUCCESS: '_handleListFiles',
      LIST_METRICS_SUCCESS: '_handleListMetrics'
    }
  }

  constructor(dispatcher) {
    super(dispatcher);
    this._files = new Map();
  }

  getFiles() {
    return Array.from(this._files.values());
  }


  /**
   * Get file from store
   *
   * @param  {string} filename File Name
   * @return {FileStore.File} The file object.
   */
  getFile(filename) {
    return this._files.get(filename);
  }
  _handleListFiles(files) {
    if (files) {
      files.forEach((file) => {
        file.metrics = [];
        this._files.set(file.filename, file);
      });
      this.emitChange();
    }
  }

  _handleSetFile(file) {
    this._files.set(file.filename, file);
    this.emitChange();
  }

  _handleListMetrics(payloads) {
    let changed = false;

    payloads.forEach((payload) => {
      let file = this._files.get(payload.filename);
      if (file) {
        file.metrics = payload.metrics;
        changed = true;
      }
    });

    if (changed) {
      this.emitChange();
    }
  }

  /**
   * Metric type stored in the {@link FileStore.File}
   * @see ../database/schema/Metric.json
   *
   * @typedef {Object} FileStore.Metric
   * @property {string} uid: Metric ID
   * @property {string} file_uid: File ID
   * @property {string} name: Metric Name
   * @property {string} type: Metric type ('string' | 'number' | 'date')
   */

   /**
    * Metric type stored in the {@link FileStore}
    * @see ../database/schema/File.json
    *
    * @typedef {Object} FileStore.File
    * @property {string} name Short File Name
    * @property {string} filename Full file path
    * @property {string} type File type ('upoaded' | 'sample')
    * @property {FileStore.Metric[]} metrics
    */
}
