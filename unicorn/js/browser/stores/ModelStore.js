// Copyright © 2015, Numenta, Inc. Unless you have purchased from
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

import BaseStore from 'fluxible/addons/BaseStore';


/**
 * @typedef {Object} ModelStore.Model
 * @property {string} modelId - Model Unique ID.
 * @property {string} filename - File full path name
 * @property {string} timestampField - Timestamp field name
 * @property {string} metric - Metric field name
 * @property {boolean} active - Whether or not this model is running
 * @property {boolean} ran - Whether not this metric model has run once
 * @property {boolean} visible - Whether or not this model is visible
 * @property {?string} error - Last known error or null for no error
 */
const DEFAULT_VALUES = {
  modelId: null,
  filename: null,
  timestampField: null,
  metric: null,
  active: false,
  ran: false,
  visible: false,
  error: null
};


/**
 * Manages nupic models UI properties
 */
export default class ModelStore extends BaseStore {

  /**
   * ModelStore
   */
  static get storeName() {
    return 'ModelStore';
  }

  static get handlers() {
    return {
      ADD_MODEL: '_addModels',
      DELETE_MODEL: '_deleteModel',
      LIST_MODELS: '_addModels',
      STOP_MODEL: '_stopModel',
      START_MODEL: '_startModel',
      SHOW_MODEL: '_showModel',
      HIDE_MODEL: '_hideModel',

      DELETE_MODEL_FAILED: '_handleModelFailed',
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
   * Load model(s) into the store.
   * @param  {ModelStore.Model|ModelStore.Model[]} models model(s) to add to
   *                                                      the store
   */
  _addModels(models) {
    if (Array.isArray(models)) {
      models.forEach((model) => {
        this._models.set(model.modelId,
          Object.assign({}, DEFAULT_VALUES, model));
      });
    } else if ('modelId' in models) {
      this._models.set(models.modelId,
        Object.assign({}, DEFAULT_VALUES, models));
    }
    this.emitChange();
  }

  /**
   * Delete model from the store.
   * @param {string} modelId - Model to delete
   */
  _deleteModel(modelId) {
    this._models.delete(modelId);
    this.emitChange();
  }

  /**
   * Mark model as hidden from the UI
   * @param  {string} modelId - The model to update
   */
  _hideModel(modelId) {
    let model = this._models.get(modelId);
    if (model) {
      model.visible = false;
      this.emitChange();
    }
  }

  /**
   * Mark model as visible to the UI
   * @param  {string} modelId - The model to update
   */
  _showModel(modelId) {
    let model = this._models.get(modelId);
    if (model) {
      model.visible = true;
      this.emitChange();
    }
  }

  /**
   * Mark the model as active.
   * @param {string} modelId - The model to update
   */
  _startModel(modelId) {
    let model = this._models.get(modelId);
    if (model) {
      model.active = true;
      model.ran = true;
      model.error = null;
      this.emitChange();
    }
  }

  /**
   * Mark the model as stopped.
   * @param {string} modelId The model to update
   */
  _stopModel(modelId) {
    let model = this._models.get(modelId);
    if (model) {
      model.active = false;
      model.error = null;
      this.emitChange();
    }
  }

  /**
   * Handles model failures
   *
   * @param {Object} payload - Action payload
   * @param {string} payload.modelId - Model ID to update error
   * @param {string} payload.error - Error message
   */
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
   * @return {?ModelStore.Model} The model object or null if the model
   *                             can't be found
   */
  getModel(modelId) {
    return this._models.get(modelId);
  }

  /**
   * Returns a list of all models currently kept in this store.
   * @return {ModelStore.Model[]} All models
   */
  getModels() {
    return Array.from(this._models.values());
  }

}
