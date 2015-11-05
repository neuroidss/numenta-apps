// Copyright © 2015, Numenta, Inc.  Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero Public License version 3 as published by the Free
// Software Foundation.
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

import 'roboto-fontface/css/roboto-fontface.css';

import React from 'react';
import provideContext from 'fluxible-addons-react/provideContext';
import ThemeDecorator from 'material-ui/lib/styles/theme-decorator';
import FloatingActionButton from 'material-ui/lib/floating-action-button';
import SvgIconContentAdd from 'material-ui/lib/svg-icons/content/add';
import ThemeManager from 'material-ui/lib/styles/theme-manager';

// internals

import FileAddAction from '../actions/FileAdd';
import FileUploadAction from '../actions/FileUpload';
import FileList from '../components/FileList';
import FileDetails from '../components/FileDetails';
import LeftNav from '../components/LeftNav';
import ModelList from '../components/ModelList';
import UnicornTheme from '../lib/MaterialUI/UnicornTheme';


/**
 * React Main View Component
 * @class
 * @extends React.Component
 * @module
 * @public
 * @this MainComponent
 */
@provideContext({
  getConfigClient: React.PropTypes.func,
  getLoggerClient: React.PropTypes.func,
  getDatabaseClient: React.PropTypes.func,
  getFileClient: React.PropTypes.func,
  getModelClient: React.PropTypes.func
})
@ThemeDecorator(ThemeManager.getMuiTheme(UnicornTheme))
export default class MainComponent extends React.Component {

  static get contextTypes() {
    return {
      executeAction: React.PropTypes.func.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);
    this._style = {};
  }

  /**
   * Add "+" upload new data/CSV file button onClick event handler
   */
  _onClick() {
    this.context.executeAction(FileAddAction, {});

    /* open file upload window */
    this.refs.fileInput.value = null;
    this.refs.fileInput.click();
  }

  _onFileSelect(e) {
    let selectedFiles = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    let max = this.props.multiple ? selectedFiles.length : 1;
    let files = [];
    let file;

    e.preventDefault();

    for (let i = 0; i < max; i++) {
      let file = selectedFiles[i];
      file.preview = URL.createObjectURL(file);
      files.push(file);
    }

    if (this.props._onFileSelect) {
      this.props._onFileSelect(files, e);
    }

    /* The file input is limited to 1 file only, so files.length is always 1 */
    file = files[0];
    this.context.executeAction(FileUploadAction, file);
  }

  /**
   * Render
   * @method
   * @public
   * @returns {object} Abstracted React/JSX DOM representation to render to HTML
   * @this MainComponent
   * @todo refactor to better sub-components with individuated styles
   * @todo check up zIndex and zDepths
   * @TODO Better + ADD fonticon
   * @TODO Tooltip on + ADD icon - "Upload new CSV file" or something
   */
  render() {
    return (
      <main style={this._style}>
        <LeftNav>
          <FloatingActionButton onClick={this._onClick.bind(this)}
            style={{position:'fixed', top:96, left:224}}>
            <SvgIconContentAdd/>
          </FloatingActionButton>
          <FileList/>
        </LeftNav>
        <section style={{marginLeft:'256px', padding:'1rem'}}>
          <ModelList />
        </section>
        <input onChange={this._onFileSelect.bind(this)} ref="fileInput"
          style={{display:'none'}} type="file" />
        <FileDetails/>
      </main>
    );
  }
}
