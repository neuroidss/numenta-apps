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
 * Stop running model
 * @param {FluxibleContext} actionContext - Fluxible action context object
 * @param {string} modelId - Model ID
 * @returns {Promise} - Fluxible resolves with return value
 * @see http://fluxible.io/api/actions.html#api-code-actions-code-
 */
export default function (actionContext, modelId) {
  let modelClient = actionContext.getModelClient();
  modelClient.removeModel(modelId);
  return actionContext.dispatch(ACTIONS.STOP_MODEL, modelId);
}
