/* -----------------------------------------------------------------------------
 * Copyright © 2015, Numenta, Inc. Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for
 * more details.
 *
 * You should have received a copy of the GNU Affero Public License along with
 * this program. If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 * -------------------------------------------------------------------------- */


import connectToStores from 'fluxible-addons-react/connectToStores';
import Material from 'material-ui';
import MoreIcon from 'material-ui/lib/svg-icons/navigation/more-vert';
import React from 'react';

import AddModelAction from '../actions/AddModel';
import ShowFileDetailsAction from '../actions/ShowFileDetails';
import DeleteModelAction from '../actions/DeleteModel';
import FileStore from '../stores/FileStore';
import ModelStore from '../stores/ModelStore';
import Utils from '../../lib/Utils';


const {
  List, ListItem, Checkbox, IconButton, IconMenu, MenuItem
} = Material;

/**
 * Component used to display a list of files
 */
@connectToStores([FileStore, ModelStore], (context) => ({
  files: context.getStore(FileStore).getFiles()
}))
export default class FileList extends React.Component {

  static get contextTypes() {
    return {
      executeAction: React.PropTypes.func,
      getStore: React.PropTypes.func
    };
  }

  constructor(props, context) {
    super(props, context);
    this.state = Object.assign({}, props);
  }

  _onMetricCheck(modelId, filename, timestampField, metric, event, checked) {
    if (checked) {
      this.context.executeAction(AddModelAction, {
        modelId, filename, metric, timestampField
      });
    } else {
      this.context.executeAction(DeleteModelAction, modelId);
    }
  }

  _renderMetrics(file) {
    let timestampField = file.metrics.find((metric) => {
      return metric.type === 'date';
    });
    if (timestampField) {
      return file.metrics.map((metric) => {
        if (metric.type !== 'date') {
          let modelId = Utils.generateModelId(file.filename, metric.name);
          let modelStore = this.context.getStore(ModelStore);
          let checked = modelStore.getModel(modelId) ? true : false; // eslint-disable-line
          return (
            <ListItem key={modelId}
              leftCheckbox={<Checkbox name={modelId}
              checked={checked}
              onCheck={this._onMetricCheck.bind(this, modelId, file.filename,
                timestampField.name, metric.name)}/>}
              primaryText={metric.name} />
          );
        }
      });
    }
  }

  _handleFileContextMenu(filename, ev, action) {
    if (action === 'detail') {
      this.context.executeAction(ShowFileDetailsAction, filename);
    }
  }

  _renderFiles(filetype) {
    return this.props.files.map((file) => {
      if (file.type === filetype) {
        let filename = file.filename;
        let contextMenu = (
          <IconMenu
            onChange={this._handleFileContextMenu.bind(this, filename)}
            iconButtonElement={<IconButton><MoreIcon/></IconButton>}>
            <MenuItem index={1} value="delete">Delete</MenuItem>
            <MenuItem index={2} value="detail">Details</MenuItem>
          </IconMenu>
        );

        return (
          <ListItem initiallyOpen={true}
            rightIconButton={contextMenu}
            key={file.name}
            nestedItems={this._renderMetrics(file)}
            primaryText={file.name}/>
        );
      }
    });
  }

  render() {
    return (
      <nav>
        <List subheader="Sample Data">
          {this._renderFiles('sample')}
        </List>
        <List subheader="Your Data">
          {this._renderFiles('uploaded')}
        </List>
      </nav>
    );
  }
}
