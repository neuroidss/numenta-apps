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


export default class ModelDataStore extends BaseStore {

  static get storeName() {
    return 'ModelDataStore';
  }

  static get handlers() {
    return {
      RECEIVE_DATA_SUCCESS: '_handReceiveData',
      DELETE_MODEL_SUCCESS: '_handleDeleteModel'
    };
  }

  constructor(dispatcher) {
    super(dispatcher);
    this._models = new Map();
  }

  /**
   * Received new data for a specific model.
   * @param  {Object} payload The action payload in the following format:
   *                          <code>
   *                          {
   *                          	modelId: {String}, // Required model id
   *                          	data:{Array}},     // New data to be appended
   *                          }
   *                          </code>
   */
  _handReceiveData(payload) {
    if (payload && 'modelId' in payload) {
      let model = this._models.get(payload.modelId);
      if (model) {
        // Append payload data to existing model
        Reflect.apply(Array.prototype.push, model.data, payload.data);
        // Record last time this model was modified
        model.modified = new Date();
      } else {
        // New model
        this._models.set(payload.modelId, {
          modelId: payload.modelId,
          data: payload.data || [],
          // Record last time this model was modified
          modified: new Date()
        });
      }
      this.emitChange();
    }
  }

  /**
   * Delete model data.
   * @param {string} modelId - Model to delete
   */
  _handleDeleteModel(modelId) {
    this._models.delete(modelId);
    this.emitChange();
  }

  /**
   * Get data for the given model.
   * @param  {string} modelId  Model to get data from
   * @return {Array}           Model data in the following format:
   *         <code>
   *         [
   *         	 {
   *          	 modelId: "id", // The model id
   *             data: [[val11, val12], [val21, val22], ...],
   *             modified: {Date} // Last time the data was modified
   *           }
   *         ]
   *         </code>
   */
  getData(modelId) {
    return this._models.get(modelId) || {modelId, data:[], modified:0};
  }

}
