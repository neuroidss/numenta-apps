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


import {ACTIONS} from '../lib/Constants';


/**
 * Action used to send metric data to models
 *
 * @param {FluxibleContext} actionContext - Fluxible action context object
 * @param {Object} payload - Action payload
 * @param {string} payload.modelId - Model to send data
 * @param {Array} payload.data - Data to send in the following format:
 *                             `[timestamp, value]`
 *
 */
export default function (actionContext, payload) {
  let modelClient = actionContext.getModelClient();
  let {modelId, data} = payload;
  actionContext.dispatch(ACTIONS.SEND_METRIC_DATA, modelId);
  modelClient.sendData(modelId, data);
}
