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

import CreateModelAction from '../actions/CreateModel';
import FileUpdateAction from '../actions/FileUpdate';
import StartModelAction from '../actions/StartModel';


/**
 * File Details Save action is called when the user updates the File information
 * from the {FileDetails} page.
 * @param {FluxibleContext} actionContext FluxibleContext
 * @param {Object} payload Action payload
 * @param {FileStore.File} payload.file  The file to be update
 * @param {FileStore.Metric[]} [payload.metrics]  Optional List of metrics to
 *                                                automatically create models
 * @return {Promise}  Promise
 */
export default function (actionContext, payload) {
  let {file, metrics} = payload;
  return actionContext.executeAction(FileUpdateAction, file)
    .then(() => {
      if (metrics) {
        // Add models
        let promises = [];
        for (let [, metric] of metrics) {
          if (metric) {
            metric.visible = true; // make sure to show new "auto-created" model
            promises.push(
              actionContext.executeAction(CreateModelAction, metric)
            );
          }
        }
        return Promise.all(promises);
      }
    })
    .then(() => {
      if (metrics) {
        // Start models
        let promises = [];
        for (let [, metric] of metrics) {
          if (metric) {
            promises.push(
              actionContext.executeAction(StartModelAction, metric.modelId)
            );
          }
        }
        return Promise.all(promises);
      }
    });
}
