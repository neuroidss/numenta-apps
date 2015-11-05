// Numenta Platform for Intelligent Computing (NuPIC)
//
// Copyright © 2015, Numenta, Inc. Unless you have purchased from Numenta, Inc.
// a separate commercial license for this software code, the following terms
// and conditions apply:
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
// this program.  If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/


// externals

import csp from 'js-csp';

// internals

import {ACTIONS} from '../lib/Constants';
import {
  DatabaseGetError, DatabasePutError, FilesystemGetError
} from '../../lib/UserError';
import Utils from '../../lib/Utils';


// FUNCTIONS

/**
 * CSP channel wrapper around method to Get File Upload via File Client.
 * @function
 * @param {Object} options - Options passed as properties to this method
 * @param {Object} options.actionContext - Fluxible ActionContext
 * @param {Object} options.file - File info to use to lookup from FS
 * @return {Object} - CSP Channel async=>sync `yield csp.take(chan)`
 * @throws {FilesystemGetError}
 */
function getFileFromUpload(options) {
  let {actionContext, file} = options;
  let channel = csp.chan();
  let fileClient = actionContext.getFileClient();

  fileClient.getUploadedFiles(file, (error, formattedFile) => {
    if (error) {
      csp.putAsync(channel, new FilesystemGetError(error));
    } else {
      csp.putAsync(channel, formattedFile);
    }
    channel.close();
  });

  return channel;
}

/**
 * CSP channel wrapper around method to Get File via DB Client.
 * @function
 * @param {Object} options - Options passed as properties to this method
 * @param {Object} options.actionContext - Fluxible ActionContext
 * @param {Object} options.file - File info to use to lookup from DB
 * @return {Object} - CSP Channel async=>sync `yield csp.take(chan)`
 * @throws {DatabaseGetError}
 */
function getFileFromDB(options) {
  let {actionContext, file} = options;
  let channel = csp.chan();
  let databaseClient = actionContext.getDatabaseClient();
  let fileId = Utils.generateId(file.path);

  databaseClient.getFile(fileId, (error, results) => {
    if (error && (!('notFound' in error))) {
      csp.putAsync(channel, new DatabaseGetError(error));
    } else {
      csp.putAsync(channel, results);
    }
    channel.close();
  });

  return channel;
}

/**
 * CSP channel wrapper around method to Get Metrics via DB Client.
 * @function
 * @param {Object} options - Options passed as properties to this method
 * @param {Object} options.actionContext - Fluxible ActionContext
 * @param {Object} options.file - File info to use to lookup from DB
 * @return {Object} - CSP Channel async=>sync `yield csp.take(chan)`
 * @throws {DatabaseGetError}
 */
function getMetricsFromDB(options) {
  let {actionContext, file} = options;
  let channel = csp.chan();
  let databaseClient = actionContext.getDatabaseClient();
  let fileId = Utils.generateId(file.path);

  databaseClient.queryMetric({file_uid: fileId}, (error, results) => {
    if (error && (!('notFound' in error))) {
      csp.putAsync(channel, new DatabaseGetError(error));
    } else {
      csp.putAsync(channel, results);
    }
    channel.close();
  });

  return channel;
}

/**
 * CSP channel wrapper around method to Put File via DB Client.
 * @function
 * @param {Object} options - Options passed as properties to this method
 * @param {Object} options.actionContext - Fluxible ActionContext
 * @param {Object} options.file - File data to put into DB
 * @return {Object} - CSP Channel async=>sync `yield csp.take(chan)`
 * @throws {DatabasePutError}
 */
function putFileIntoDB(options) {
  let {actionContext, file} = options;
  let channel = csp.chan();
  let databaseClient = actionContext.getDatabaseClient();
  let payload = {
    uid: Utils.generateId(file.filename),
    name: file.name,
    filename: file.filename,
    type: file.type
  };

  databaseClient.putFile(payload, (error) => {
    if (error) {
      csp.putAsync(channel, new DatabasePutError(error));
    } else {
      csp.putAsync(channel, true);
    }
    channel.close();
  });

  return channel;
}

/**
 * CSP channel wrapper around method to Put Metrics via DB Client.
 * @function
 * @param {Object} options - Options passed as properties to this method
 * @param {Object} options.actionContext - Fluxible ActionContext
 * @param {Object} options.file - File data to put into DB
 * @return {Object} - CSP Channel async=>sync `yield csp.take(chan)`
 * @throws {DatabasePutError}
 */
function putMetricsIntoDB(options) {
  let {actionContext, file} = options;
  let channel = csp.chan();
  let databaseClient = actionContext.getDatabaseClient();
  let payload = file.metrics.map((metric) => {
    return {
      uid: Utils.generateModelId(file.filename, metric.name),
      file_uid: Utils.generateId(file.filename),
      name: metric.name,
      type: metric.type
    };
  });

  databaseClient.putMetricBatch(payload, (error) => {
    if (error) {
      csp.putAsync(channel, new DatabasePutError(error));
    } else {
      csp.putAsync(channel, true);
    }
    channel.close();
  });

  return channel;
}


// MAIN

/**
 * Get uploaded file
 */
export default (actionContext, file) => {
  return csp.go(function* () {
    let fileFormatted, fileHandle, fileMetrics, result;
    let log = actionContext.getLoggerClient();
    let opts = {actionContext, file};

    log.debug('see if uploaded file is already in DB');
    fileHandle = yield csp.take(getFileFromDB(opts));
    if (fileHandle instanceof Error) {
      actionContext.dispatch(ACTIONS.UPLOADED_FILE_FAILED, {
        error: fileHandle,
        filename: file.name
      });
      return fileHandle;
    }
    if (fileHandle && ('uid' in fileHandle)) {
      log.debug('yes file is already in DB, load metrics');
      fileMetrics = yield csp.take(getMetricsFromDB(opts));
      if (fileMetrics instanceof Error) {
        actionContext.dispatch(ACTIONS.UPLOADED_FILE_FAILED, {
          error: fileMetrics,
          filename: file.name
        });
        return fileMetrics;
      }
      fileFormatted = {
        uid: Utils.generateId(file.path),
        name: file.name,
        filename: file.path,
        type: 'uploaded',
        metrics: fileMetrics
      };

      log.debug('on to UI');
      actionContext.dispatch(ACTIONS.UPLOADED_FILE_SUCCESS, fileFormatted);
      return fileFormatted;
    }

    log.debug('NO file is not already in DB, get from upload');
    fileFormatted = yield csp.take(getFileFromUpload(opts));
    if (fileFormatted instanceof Error) {
      actionContext.dispatch(ACTIONS.UPLOADED_FILE_FAILED, {
        error: fileFormatted,
        filename: file.name
      });
      return fileFormatted;
    }

    log.debug('save new File+Metrics to DB');
    opts.file = fileFormatted;
    result = yield csp.take(putFileIntoDB(opts));
    if (result instanceof Error) {
      actionContext.dispatch(ACTIONS.UPLOADED_FILE_FAILED, {
        error: result,
        filename: file.name
      });
      return result;
    }
    result = yield csp.take(putMetricsIntoDB(opts));
    if (result instanceof Error) {
      actionContext.dispatch(ACTIONS.UPLOADED_FILE_FAILED, {
        error: result,
        filename: file.name
      });
      return result;
    }

    log.debug('on to UI');
    actionContext.dispatch(ACTIONS.UPLOADED_FILE_SUCCESS, fileFormatted);
    return fileFormatted;
  }); // csp.go
}; // export
