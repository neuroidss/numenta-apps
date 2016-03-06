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


import BaseStore from 'fluxible/addons/BaseStore';
import Utils from '../../main/Utils';

/**
 * Metric type stored in the {@link MetricStore}
 * @see ../database/schema/Metric.json
 *
 * @typedef {Object} MetricStore.Metric
 * @property {string} uid: Metric ID
 * @property {string} file_uid: File ID
 * @property {string} name: Metric Name
 * @property {string} type: Metric type ('string' | 'number' | 'date')
 * @property {string} type: Metric type ('string' | 'number' | 'date')
 */


/**
 * Metric store, it maintains a collection of {@link MetricStore.Metric}
 */

export default class MetricStore extends BaseStore {

  static get storeName() {
    return 'MetricStore';
  }

  /**
   * @listens {LIST_METRICS}
   * @listens {DELETE_FILE}
   * @listens {SHOW_CREATE_MODEL_DIALOG}
   * @listens {HIDE_CREATE_MODEL_DIALOG}
   * @listens {START_PARAM_FINDER}
   * @listens {RECEIVE_PARAM_FINDER_DATA}
   */
  static get handlers() {
    return {
      DELETE_FILE: '_handleDeleteFile',
      LIST_METRICS: '_handleListMetrics',
      SHOW_CREATE_MODEL_DIALOG: '_handleShowCreateModelDialog',
      HIDE_CREATE_MODEL_DIALOG: '_handleHideCreateModelDialog',
      START_PARAM_FINDER: '_handleStartParamFinder',
      RECEIVE_PARAM_FINDER_DATA: '_handleReceiveParamFinderData'
    }
  }

  constructor(dispatcher) {
    super(dispatcher);
    this._metrics = new Map();
    this._reset();
  }

  _reset() {
    // CreateModelDialog
    this.fileName = null;
    this.metricName = null;
    this.open = false;

    // Param Finder
    this.paramFinderResults = new Map();
    this.inputOpts = new Map();
  }

  /**
   * Get input opts
   * @param  {string} metricId The metric id
   * @return {MetricStore.Metric} The metric object or `null`
   */
  getInputOpts(metricId) {
    return this.inputOpts.get(metricId);
  }

  /**
   * Get param finder results
   * @param  {string} metricId The metric id
   * @return {MetricStore.Metric} The metric object or `null`
   */
  getParamFinderResults(metricId) {
    return this.paramFinderResults.get(metricId);
  }

  /**
   * Get all metrics
   * @return {MetricStore.Metric} The metric object or `null`
   */
  getMetrics() {
    return this._metrics;
  }

  /**
   * Get metric by Id
   * @param  {string} metricId The metric id
   * @return {MetricStore.Metric} The metric object or `null`
   */
  getMetric(metricId) {
    return this._metrics[metricId];
  }

  /**
   * Get all metrics related to the give file name
   * @param  {string} fileId File id to get metrics from
   * @return {Array<MetricStore.Metric>}  Array of metrics
   */
  getMetricsByFileId(fileId) {
    let metrics = [];
    this._metrics.forEach((value, key, map) => {
      if (value.file_uid === fileId) {
        metrics.push(value);
      }
    });
    return metrics;
  }

  /**
   * Get all metrics related to the give file name
   * @param  {string} filename File name to get metrics from
   * @return {Array<MetricStore.Metric>}  Array of metrics
   */
  getMetricsByFileName(filename) {
    let fileId = Utils.generateFileId(filename);
    return this.getMetricsByFileId(fileId);
  }

  /**
   * Delete all metrics associated with the file
   * @param  {string} filename The name of the file to delete
   */
  _handleDeleteFile(filename) {
    let fileId = Utils.generateFileId(filename);
    this._metrics.forEach((value, key, map) => {
      if (value.file_uid === fileId) {
        map.delete(key);
      }
    });
    this.emitChange();
  }

  /**
   * Update store with list of metrics
   * @param  {Array} metrics List of metrics to add to the store
   */
  _handleListMetrics(metrics) {
    if (metrics) {
      metrics.forEach((metric) => {
        this._metrics.set(metric.uid, Object.assign({}, metric));
      });
      this.emitChange();
    }
  }

  _handleStartParamFinder(payload) {
    let metricId = payload.metricId;
    let inputOpts = payload.inputOpts;
    this.inputOpts.set(metricId, inputOpts);
    this.emitChange();
  }

  _handleShowCreateModelDialog(payload) {
    this.fileName = payload.fileName;
    this.metricName = payload.metricName;
    this.open = true;
    this.emitChange();
  }

  _handleHideCreateModelDialog() {
    this._reset();
    this.emitChange();
  }

  _handleReceiveParamFinderData(payload) {
    let paramFinderResults = JSON.parse(payload.paramFinderResults);
    let metricId = payload.metricId;
    this.paramFinderResults.set(metricId, paramFinderResults);
    this.emitChange();
  }

}
