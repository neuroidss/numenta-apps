// Copyright © 2016, Numenta, Inc. Unless you have purchased from
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


import BaseStore from 'fluxible/addons/BaseStore';


/**
 * Unicorn File Details Store backing {FileDetails} Component
 */
export default class FileDetailsStore extends BaseStore {
  static get storeName() {
    return 'FileDetailsStore';
  }

  /**
   * @listens {SHOW_FILE_DETAILS}
   * @listens {HIDE_FILE_DETAILS}
   * @listens {UPLOADED_FILE}
   */
  static get handlers() {
    return {
      SHOW_FILE_DETAILS: '_showFileDetails',
      HIDE_FILE_DETAILS: '_hideFileDetails',
      UPLOADED_FILE: '_handleFileUpload'
    }
  }
  constructor(dispatcher) {
    super(dispatcher);
    this._filename = null;
    this._visible = false;
    this._newFile = false;
  }

  /**
   * The name of the current selected file
   * @return {string} The current selected file or null
   */
  getFileName() {
    return this._filename;
  }
  /**
   * @return {Boolean} Whether or not the Details page should be visible
   */
  isVisible() {
    return this._filename !== null && this._visible;
  }

  /**
   * @return {Boolean} Whether or not showing a new file
   */
  isNewFile() {
    return this._filename !== null && this._newFile;
  }

  /**
   * Handle  {ShowFileDetails} action
   * @param  {string} filename The file name to show
   */
  _showFileDetails(filename) {
    this._filename = filename;
    this._visible = true;
    this._newFile = false;
    this.emitChange();
  }
  /**
   * Handle {HideFileDetails} actions
   */
  _hideFileDetails() {
    this._visible = false;
    this._newFile = false;
    this._filename = null;
    this.emitChange();
  }

  /**
   * Handle new {FileUpload} action
   * @param  {File} file Newly uploaded file
   */
  _handleFileUpload(file) {
    this._visible = true;
    this._newFile = true;
    this._filename = file.filename;
    this.emitChange();
  }
}
