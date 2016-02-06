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
 * Create new model
 *
 * @param {FluxibleContext} actionContext -
 * @param {Object} payload - Action payload object
 * @param {string} payload.modelId - Model Unique ID.
 *                                	See {@link Utls.generateModelId}
 * @param {string} payload.filename - File full path name
 * @param {string} payload.timestampField - Timestamp field name
 * @param {string} payload.metric - Metric field name
 *
 * @return {Promise}
 * @todo Persist model reference
 */
export default function (actionContext, payload) {
  return actionContext.dispatch(ACTIONS.ADD_MODEL, payload);
}
