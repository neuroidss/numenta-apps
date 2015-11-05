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

import {ACTIONS} from '../lib/Constants';

/**
 * Update file properties
 * @param  {FluxContext} actionContext The context to use
 * @param  {File} file File Object
 * @return {Promise}
 */
export default (actionContext, file) => {
  let db = actionContext.getDatabaseClient();
  return new Promise((resolve, reject) => {
    db.putFile(file, (error, results) => {
      if (error) {
        reject(error);
      } else {
        actionContext.dispatch(ACTIONS.UPDATE_FILE_SUCCESS, file);
        resolve();
      }
    });
  });
};
