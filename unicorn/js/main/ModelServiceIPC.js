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


import ipc from 'ipc';
import {ModelService} from './ModelService';
import UserError from './UserError';

export const MODEL_SERVER_IPC_CHANNEL = 'MODEL_SERVER_IPC_CHANNEL';


/**
 * IPC interface to ModelService.
 */
export default class ModelServiceIPC {

  constructor() {
    this._webContents = null;
    this._attached = new Set();
    this._service = new ModelService();
  }

  /**
   * Start listening for IPC events.
   * @param {Object} webContents - Electron webContents object for IPC messages.
   */
  start(webContents) {
    // Initialize IPC events
    ipc.on(MODEL_SERVER_IPC_CHANNEL, this._handleIPCEvent.bind(this));
    // Attach to renderer process
    this._webContents = webContents;
  }

  /**
   * Stop listening for IPC Events.
   */
  stop() {
    ipc.removeAllListeners(MODEL_SERVER_IPC_CHANNEL);
    this._webContents = null;
  }

  /**
   * Handle IPC calls from renderer process.
   * The supported commands are:
   *  - 'create': Create new HTM model.
   *  						See 'ModelService#createModel' for 'params' format.
   *  - 'remove': Stops and remove the model
   *  - 'list':   List running models as Array of IDs in `returnValue['models']`
   *  - 'sendData': Send data to the model. See 'sendData' for 'params' format
   *
   * @param {Event} event - IPC Event Object.
   *                        Any error will be returned via 'returnValue.error'
   * @param {Object} payload - Event payload
   * @param {string} modelId - Model Id
   * @param {string} command -  'create' | 'remove' | 'list' | 'sendData'
   * @param {Object} [params] - Command parameters
   */
  _handleIPCEvent(event, payload) {
    const {modelId, command} = payload;
    try {
      if (command === 'create') {
        this._onCreate(modelId, payload.params);
      } else if (command === 'remove') {
        this._onRemove(modelId);
      } else if (command === 'list') {
        event.returnValue = this._onList();
      } else if (command === 'sendData') {
        this._onSendData(modelId, payload.params);
      } else {
        throw new UserError(`Unknown model command ${command}`);
      }
    } catch (error) {
      if (this._webContents) {
        // Forward error to browser
        this._webContents.send(
          MODEL_SERVER_IPC_CHANNEL,
          modelId,
          'error',
          {error, ipcevent: payload}
        );
      }
    }
  }

  /**
   * Start up a new model.
   * @param {string} modelId - New ID of New Model to start up
   */
  _attach(modelId) {
    if (this._attached.has(modelId)) {
      return;
    }
    this._attached.add(modelId);
    this._service.on(modelId, (command, payload) => {
      if (!this._attached.has(modelId)) {
        return;
      }
      // forward event to BrowserWindow
      if (this._webContents) {
        if (command === 'error') {
          this._webContents.send(
            MODEL_SERVER_IPC_CHANNEL,
            modelId,
            'error',
            {error: new UserError(payload)}
          );
        } else {
          this._webContents.send(
            MODEL_SERVER_IPC_CHANNEL, modelId, command, payload
          );
        }
      }
    });
  }

  /**
   * Close down a running model.
   * @param {string} modelId - ID of existing Model to shut down
   */
  _dettach(modelId) {
    if (this._attached.has(modelId)) {
      this._attached.delete(modelId);
      this._service.removeAllListeners(modelId);
    }
  }

  /**
   * Event callback handler for sending data to client.
   * @param {string} modelId - ID of Model to transmit data for
   * @param {string} data - JSON-encoded string of data to send
   */
  _onSendData(modelId, data) {
    const input = JSON.parse(data);
    this._service.sendData(modelId, input);
  }

  /**
   * Event callback handler for listing data.
   * @return {Object} - Current Models + State
   */
  _onList() {
    return {
      models: this._service.getModels()
    };
  }

  /**
   * Event callback handler for creating a new model.
   * @param {string} modelId - New ID of New Model to create
   * @param {Object} params - Model Parameters to use in model creation
   */
  _onCreate(modelId, params) {
    this._attach(modelId);
    this._service.createModel(modelId, params);
  }

  /**
   * Event callback handler for removing an existing model.
   * @param {string} modelId - ID of existing Model to shut down
   */
  _onRemove(modelId) {
    this._dettach(modelId);
    this._service.removeModel(modelId);
  }

}
