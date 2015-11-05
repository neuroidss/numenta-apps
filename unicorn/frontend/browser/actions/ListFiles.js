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


// internals

import {ACTIONS} from '../lib/Constants';
import {
  DatabaseGetError, DatabasePutError, FilesystemGetError
} from '../../lib/UserError';
import Utils from '../../lib/Utils';


// MAIN

/**
 * Get List of files from backend
 */
export default (actionContext) => {
  return new Promise((resolve, reject) => {

    let databaseClient = actionContext.getDatabaseClient();
    let fileClient = actionContext.getFileClient();
    let log = actionContext.getLoggerClient();

    log.debug('load existing files from db, from previous runs');
    databaseClient.queryFile({}, (error, files) => {
      if (error) {
        actionContext.dispatch(
          ACTIONS.LIST_FILES_FAILURE,
          new DatabaseGetError(error)
        );
        reject(error);
      } else if (files.length) {
        log.debug('files in db already, not first run, straight to UI');
        actionContext.dispatch(ACTIONS.LIST_FILES_SUCCESS, files);
        resolve(files);
      } else {
        log.debug('no files in db, first run, so load them from fs');
        fileClient.getSampleFiles((error, files) => {
          if (error) {
            actionContext.dispatch(
              ACTIONS.LIST_FILES_FAILURE,
              new FilesystemGetError(error)
            );
            reject(error);
          } else {
            log.debug('got file list from fs, saving to db for next runs');
            files = files.map((file) => {
              file.uid = Utils.generateId(file.filename);
              return file;
            });

            databaseClient.putFileBatch(files, (error) => {
              if (error) {
                actionContext.dispatch(
                  ACTIONS.LIST_FILES_FAILURE,
                  new DatabasePutError(error)
                );
                reject(error);
              } else {
                log.debug('DB now has Files, on to UI.');
                actionContext.dispatch(ACTIONS.LIST_FILES_SUCCESS, files);
                resolve(files);
              }
            }); // databaseClient.putFiles()
          }
        }); // fileClient.getSampleFiles()
      }
    }); // databaseClient.queryFile()

  }); // Promise
};
