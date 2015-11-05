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

export const ACTIONS = Object.freeze({
  ADD_MODEL_SUCCESS: 'ADD_MODEL_SUCCESS',
  ADD_MODEL_FAILED: 'ADD_MODEL_FAILED',

  DELETE_MODEL_SUCCESS: 'DELETE_MODEL_SUCCESS',
  DELETE_MODEL_FAILED: 'DELETE_MODEL_FAILED',

  RECEIVE_DATA_SUCCESS: 'RECEIVE_DATA_SUCCESS',
  RECEIVE_DATA_FAILED: 'RECEIVE_DATA_FAILED',

  SEND_DATA_SUCCESS: 'SEND_DATA_SUCCESS',
  SEND_DATA_FAILED: 'SEND_DATA_FAILED',

  START_MODEL_SUCCESS: 'START_MODEL_SUCCESS',
  START_MODEL_FAILED: 'START_MODEL_FAILED',

  STOP_MODEL_SUCCESS: 'STOP_MODEL_SUCCESS',
  STOP_MODEL_FAILED: 'STOP_MODEL_FAILED',

  UPLOADED_FILE_SUCCESS: 'UPLOADED_FILE_SUCCESS',
  UPLOADED_FILE_FAILED: 'UPLOADED_FILE_FAILED',

  UPDATE_FILE_SUCCESS: 'UPDATE_FILE_SUCCESS',
  UPDATE_FILE_FAILED: 'UPDATE_FILE_FAILED',

  LIST_FILES_SUCCESS: 'LIST_FILES_SUCCESS',
  LIST_FILES_FAILURE: 'LIST_FILES_FAILURE',

  LIST_METRICS_SUCCESS: 'LIST_METRICS_SUCCESS',
  LIST_METRICS_FAILURE: 'LIST_METRICS_FAILURE',

  SHOW_FILE_DETAILS: 'SHOW_FILE_DETAILS',
  HIDE_FILE_DETAILS: 'HIDE_FILE_DETAILS',

  UNKNOWN_MODEL_FAILURE: 'UNKNOWN_MODEL_FAILURE'
});
