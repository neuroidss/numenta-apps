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
import Utils from '../../main/Utils';
import {
  DatabaseGetError, DatabasePutError, FilesystemGetError
} from '../../main/UserError';


// MAIN

/**
 * List all available metrics of the given file
 */
export default function (actionContext, files) {
  return new Promise((resolve, reject) => {

    let databaseClient = actionContext.getDatabaseClient();
    let fileClient = actionContext.getFileClient();
    let log = actionContext.getLoggerClient();
    let payload = [];

    log.debug('load existing metrics from db, from previous runs');
    databaseClient.getAllMetrics((error, metrics) => {
      if (error) {
        actionContext.dispatch(
          ACTIONS.LIST_METRICS_FAILURE,
          new DatabaseGetError(error)
        );
        reject(error);
      } else if (metrics.length) {
        log.debug('metrics in db already, not first run, straight to UI.');
        files.forEach((file) => {
          payload.push({
            filename: file.filename,
            metrics: metrics.filter((value) => {
              return value['file_uid'] === Utils.generateFileId(file.filename);
            })
          });
        });

        log.debug('DB already had Metrics, now to UI');
        actionContext.dispatch(ACTIONS.LIST_METRICS, payload);
        resolve(payload);
      } else {
        log.debug('no metrics in db, is first run, so load them from fs');
        let fieldsFileMap = {};
        let fieldsList = [];
        let fileCount = 0;

        files.forEach((file) => {
          fileClient.getFields(file.filename, (error, fields) => {
            if (error) {
              console.error(error);
              actionContext.dispatch(
                ACTIONS.LIST_METRICS_FAILURE,
                new FilesystemGetError(error)
              );
              reject(error);
            } else {
              fieldsFileMap[file.filename] = fields;
              fieldsList = fieldsList.concat(fields);

              // @TODO better async flow than "poor persons parallel"
              fileCount++;
              if (fileCount >= files.length) {

                log.debug('got files from fs, saving to db for next runs');
                databaseClient.putMetricBatch(fieldsList, (error) => {
                  if (error) {
                    console.error(error);
                    actionContext.dispatch(
                      ACTIONS.LIST_METRICS_FAILURE,
                      new DatabasePutError(error)
                    );
                    reject(error);
                  } else {
                    log.debug('DB has Metrics, now to UI');
                    Object.keys(fieldsFileMap).forEach((file) => {
                      payload.push({
                        filename: file,
                        metrics: fieldsFileMap[file]
                      });
                    });
                    actionContext.dispatch(
                      ACTIONS.LIST_METRICS,
                      payload
                    );
                    resolve(payload);
                  }
                }); // databaseClient.putMetrics()

              } // fileCount
            }
          }); // fileClient.getFields()
        }); // files.forEach()
      }
    }); // databaseClient.getMetrics()

  }); // Promise
}
