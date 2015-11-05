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


export default class ModelStore extends BaseStore {

  static get storeName() {
    return 'ModelStore'
  }

  static get handlers() {
    return {
      ADD_MODEL_SUCCESS: '_handleAddModel',
      DELETE_MODEL_SUCCESS: '_handleDeleteModel',
      LIST_MODELS_SUCCESS: '_handleListModels',
      STOP_MODEL_SUCCESS: '_handleStopModel',
      START_MODEL_SUCCESS: '_handleStartModel',
      STOP_MODEL_FAILED: '_handleModelFailed',
      START_MODEL_FAILED: '_handleModelFailed',
      UNKNOWN_MODEL_FAILURE: '_handleModelFailed'
    };
  }

  constructor(dispatcher) {
    super(dispatcher);
    this._models = new Map();
  }

  /**
   * Handles adding or replacing a model in the store.
   * @param  {Object} payload The action payload in the following format:
   *             <code>
   *             {
   *               modelId: {string},   // Required model id
   *               filename: {string},  // File name
   *               metric: {string},    // Metric Name
   *               timestampField: {string},    // Timestamp field Name
   *               active: {boolean}    // Whether or not this model is running
   *             }
   *             </code>
   */
  _handleAddModel(payload) {
    if (payload && 'modelId' in payload) {
      this._models.set(payload.modelId, payload);
      this.emitChange();
    }
  }

  /**
   * Load model list into the store.
   * @param  {Object} payload The action payload in the following format:
   *    <code>
   *    [
   *      {
   *      	modelId: "id",
   *      	filename: "filename",
   *      	metric: "metric",
   *      	timestampField: "timestamp",
   *      	active: true|false
   *      }
   *      ...
   *    ]
   *    </code>
   */
  _handleListModels(payload) {
    if (Array.isArray(payload) && payload.length) {
      payload.forEach((model) => {
        if ('modelId' in model) {
          this._models.set(model.modelId, model);
        }
      });
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
   * Mark the model as stopped.
   * @param {string} modelId The model to update
   */
  _handleStopModel(modelId) {
    let model = this._models.get(modelId);
    if (model) {
      model.active = false;
      model.error = null;
      this.emitChange();
    }
  }

  /**
   * Mark the model as active.
   * @param {string} modelId - The model to update
   */
  _handleStartModel(modelId) {
    let model = this._models.get(modelId);
    if (model) {
      model.active = true;
      model.error = null;
      this.emitChange();
    }
  }

  _handleModelFailed(payload) {
    let {modelId, error} = payload;
    let model = this._models.get(modelId);
    if (model) {
      model.active = false;
      model.error = error;
      this.emitChange();
    }
  }

  /**
   * Get model from store.
   * @param  {string} modelId Model to get
   * @return {Object} The model object in the following format:
   *             <code>
   *             {
   *               modelId: {string},  // Required model id
   *               filename: {string}, // File name
   *               metric: {string}    // Metric Name
   *               timestampField: {string},    // Timestamp field Name
   *               active: {boolean}    // Whether or not this model is running
   *             }
   *             </code>
   *             or undefined if the model can't be found
   */
  getModel(modelId) {
    return this._models.get(modelId);
  }

  /**
   * Returns a list of all models currently kept in this store.
   * @return {Array} All models
   *    <code>
   *    [
   *      {
   *      	modelId: "id",
   *      	filename: "filename",
   *      	metric: "metric",
   *      	timestampField: "timestamp",
   *      	active: true|false
   *      }
   *      ...
   *    ]
   *    </code>
   */
  getModels() {
    return Array.from(this._models.values());
  }

  /**
   * Whether or not the model is active/running.
   * @param {string} modelId - The model to check
   * @return {boolean} - Returns true if the model is active.
   */
  isModelActive(modelId) {
    let model = this._models.get(modelId);
    if (model) {
      return model.active;
    }
    return false;
  }

}
