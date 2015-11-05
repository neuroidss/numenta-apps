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


import ipc from 'ipc';
import {ModelServer} from './ModelServer';
import UserError from './UserError';

export const MODEL_SERVER_IPC_CHANNEL = 'MODEL_SERVER_IPC_CHANNEL';


/**
 * IPC interface to ModelServer.
 * @class
 * @exports
 * @module
 * @public
 */
export default class ModelServerIPC {

  /**
   * @constructor
   * @method
   * @public
   * @this ModelServerIPC
   */
  constructor() {
    this._webContents = null;
    this._attached = new Set();
    this._server = new ModelServer();
  }

  /**
   * Start listening for IPC events.
   * @method
   * @param {Object} webContents - Electron webContents object for IPC messages.
   * @public
   * @this ModelServerIPC
   */
  start(webContents) {
    // Initialize IPC events
    ipc.on(MODEL_SERVER_IPC_CHANNEL, this._handleIPCEvent.bind(this));
    // Attach to renderer process
    this._webContents = webContents;
  }

  /**
   * Stop listening for IPC Events.
   * @method
   * @public
   * @this ModelServerIPC
   */
  stop() {
    ipc.removeAllListeners(MODEL_SERVER_IPC_CHANNEL);
    this._webContents = null;
  }

  /**
   * Handle IPC calls from renderer process.
   * The supported commands are:
   *  - 'create': Create new HTM model.
   *  						See 'ModelServer#createModel' for 'params' format.
   *  - 'remove': Stops and remove the model
   *  - 'list':   List running models as Array of IDs in `returnValue['models']`
   *  - 'sendData': Send data to the model. See 'sendData' for 'params' format
   * @method
   * @param  {Event}  event   IPC Event Object.
   *                          Any error will be returned via 'returnValue.error'
   * @param  {Object} payload Event payload in the following format:
   *                          {
   *                            'modelId': Model Id
   *                            'command': 'create' | 'remove' | 'list'
   *                            				 | 'sendData'
   *                            'params': {Object} // Optional
   *                          }
   * @private
   * @this ModelServerIPC
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
   * @method
   * @param {string} modelId - New ID of New Model to start up
   * @private
   * @this ModelServerIPC
   */
  _attach(modelId) {
    if (this._attached.has(modelId)) {
      return;
    }
    this._attached.add(modelId);
    this._server.on(modelId, (command, payload) => {
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
   * @method
   * @param {string} modelId - ID of existing Model to shut down
   * @private
   * @this ModelServerIPC
   */
  _dettach(modelId) {
    if (this._attached.has(modelId)) {
      this._attached.delete(modelId);
      this._server.removeAllListeners(modelId);
    }
  }

  /**
   * Event callback handler for sending data to client.
   * @method
   * @param {string} modelId - ID of Model to transmit data for
   * @param {string} data - JSON-encoded string of data to send
   * @private
   * @this ModelServerIPC
   */
  _onSendData(modelId, data) {
    const input = JSON.parse(data);
    this._server.sendData(modelId, input);
  }

  /**
   * Event callback handler for listing data.
   * @method
   * @private
   * @returns {Object} - Current Models + State
   * @this ModelServerIPC
   */
  _onList() {
    return {
      models: this._server.getModels()
    };
  }

  /**
   * Event callback handler for creating a new model.
   * @method
   * @param {string} modelId - New ID of New Model to create
   * @param {Object} params - Model Parameters to use in model creation
   * @private
   * @this ModelServerIPC
   */
  _onCreate(modelId, params) {
    this._attach(modelId);
    this._server.createModel(modelId, params);
  }

  /**
   * Event callback handler for removing an existing model.
   * @method
   * @param {string} modelId - ID of existing Model to shut down
   * @private
   * @this ModelServerIPC
   */
  _onRemove(modelId) {
    this._dettach(modelId);
    this._server.removeModel(modelId);
  }

}
