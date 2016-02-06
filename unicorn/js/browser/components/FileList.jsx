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

import Checkbox from 'material-ui/lib/checkbox';
import Colors from 'material-ui/lib/styles/colors';
import connectToStores from 'fluxible-addons-react/connectToStores';
import Dialog from 'material-ui/lib/dialog';
import IconButton from 'material-ui/lib/icon-button';
import IconClose from 'material-ui/lib/svg-icons/hardware/keyboard-arrow-down';
import IconMenu from 'material-ui/lib/menus/icon-menu';
import IconMore from 'material-ui/lib/svg-icons/navigation/more-vert';
import IconOpen from 'material-ui/lib/svg-icons/hardware/keyboard-arrow-up';
import IconStatus from 'material-ui/lib/svg-icons/image/lens';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import MenuItem from 'material-ui/lib/menus/menu-item';
import React from 'react';

import CreateModelAction from '../actions/CreateModel';
import DeleteFileAction from '../actions/DeleteFile';
import FileStore from '../stores/FileStore';
import HideModelAction from '../actions/HideModel';
import ModelStore from '../stores/ModelStore';
import ShowFileDetailsAction from '../actions/ShowFileDetails';
import ShowModelAction from '../actions/ShowModel';
import Utils from '../../main/Utils';

const DIALOG_STRINGS = {
  file: {
    title: 'Delete File',
    message: 'Deleting this dataset will delete the associated models.' +
              ' Are you sure you want to delete this file?'
  }
};


/**
 * Component used to display a list of files
 */
@connectToStores([FileStore, ModelStore], (context) => ({
  files: context.getStore(FileStore).getFiles(),
  models: context.getStore(ModelStore).getModels()
}))
export default class FileList extends React.Component {

  static get contextTypes() {
    return {
      executeAction: React.PropTypes.func,
      getStore: React.PropTypes.func,
      muiTheme: React.PropTypes.object
    };
  }

  constructor(props, context) {
    super(props, context);

    let showNested = {};
    let muiTheme = this.context.muiTheme;

    // prep visibility toggle nested file contents
    props.files.forEach((file) => {
      showNested[file.uid] = true;
    });

    // init state
    this.state = Object.assign({
      deleteConfirmDialog: null,
      showNested
    }, props);

    this._styles = {
      list: {
        color: muiTheme.rawTheme.palette.primary1Color
      },
      file: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap'
      },
      more: {
        width: 40
      },
      metric: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap'
      },
      status: {
        height: 15,
        padding: 0,
        right: 13,
        top: 16,
        width: 15
      }
    };
  }

  /**
   * Opens a modal confirmation dialog
   * @param  {string}   title    Dialog title
   * @param  {string}   message  Dialog Message
   * @param  {Function} callback Function to be called on confirmation
   */
  _showDeleteConfirmDialog(title, message, callback) {
    this.setState({
      deleteConfirmDialog: {callback, message, title}
    });
  }

  _dismissDeleteConfirmDialog() {
    this.setState({
      deleteConfirmDialog: null
    });
  }

  _onMetricCheck(modelId, filename, timestampField, metric, event, checked) {
    let models = this.props.models;
    let model = models.find((m) => m.modelId === modelId);

    if (checked && model) {
      // show: already known
      this.context.executeAction(ShowModelAction, modelId);
    } else if (checked) {
      // show: unknown, so know it first
      this.context.executeAction(CreateModelAction, {
        modelId, filename, timestampField, metric
      });
      this.context.executeAction(ShowModelAction, modelId);
    } else {
      // hide
      this.context.executeAction(HideModelAction, modelId);
    }
  }

  _handleFileToggle(fileId, event) {
    let ref = this.refs[`file-toggle-${fileId}`];
    let showNested = this.state.showNested;
    let nesting = true;

    if (showNested[fileId]) {
      nesting = false;
    }

    // custom icon toggle
    showNested[fileId] = nesting;
    this.setState({showNested});

    // piggyback on default MaterialUI nested show/hide
    ref.setState({open: !ref.state.open});
  }

  _handleFileContextMenu(filename, event, action) {
    if (action === 'detail') {
      this.context.executeAction(ShowFileDetailsAction, filename);
    } else if (action === 'delete') {
      this._showDeleteConfirmDialog(
        DIALOG_STRINGS.file.title,
        DIALOG_STRINGS.file.message,
        () => {
          this.context.executeAction(DeleteFileAction, filename);
          this._dismissDeleteConfirmDialog();
        }
      );
    }
  }

  _renderMetrics(file) {
    let timestampField = file.metrics.find((metric) => {
      return metric.type === 'date';
    });
    if (timestampField) {
      return file.metrics.map((metric) => {
        if (metric.type !== 'date') {
          let modelId = Utils.generateMetricId(file.filename, metric.name);
          let models = this.props.models;
          let model = models.find((m) => m.modelId === modelId);
          let isModelVisible = false;
          let statusColor = Colors.red400;

          if (model) {
            if (model.visible) {
              isModelVisible = true;
            }
            if (model.ran) {
              statusColor = Colors.green400;
            }
          }

          return (
            <ListItem
              key={modelId}
              leftCheckbox={
                <Checkbox
                  checked={isModelVisible}
                  onCheck={
                    this._onMetricCheck.bind(
                      this,
                      modelId,
                      file.filename,
                      timestampField.name,
                      metric.name
                    )
                  }
                  />
              }
              primaryText={<div style={this._styles.metric}>{metric.name}</div>}
              rightIcon={
                <IconStatus color={statusColor} style={this._styles.status} />
              }
              />
          );
        }
      });
    }
  }

  _renderFiles(filetype) {
    return this.props.files.map((file) => {
      if (file.type === filetype) {
        let fileId = file.uid;
        let filename = file.filename;
        let toggleIcon;
        let contextMenu = (
          <IconMenu
            iconButtonElement={
              <IconButton><IconMore color={Colors.grey500} /></IconButton>
            }
            onChange={this._handleFileContextMenu.bind(this, filename)}
            style={this._styles.more}
            >
              <MenuItem index={1}
                primaryText="File Details"
                value="detail"
                />
              <MenuItem index={2}
                disabled={filetype === 'sample'}
                primaryText="Delete File"
                value="delete"
                />
          </IconMenu>
        );

        // choose file visibility toggle icon
        if (this.state.showNested[fileId]) {
          toggleIcon = (<IconOpen />);
        } else {
          toggleIcon = (<IconClose />);
        }

        return (
          <ListItem
            initiallyOpen={true}
            key={file.name}
            leftIcon={
              <IconButton
                onTouchTap={this._handleFileToggle.bind(this, fileId)}>
                  {toggleIcon}
              </IconButton>
            }
            nestedItems={this._renderMetrics(file)}
            primaryText={<div style={this._styles.file}>{file.name}</div>}
            ref={`file-toggle-${fileId}`}
            rightIconButton={contextMenu}
            />
        );
      }
    });
  }

  render() {
    let deleteConfirmDialog = this.state.deleteConfirmDialog || {};
    let dialogOpen = this.state.deleteConfirmDialog !== null;
    let dialogActions = [
       {text: 'Cancel'},
       {text: 'Delete', onTouchTap: deleteConfirmDialog.callback, ref: 'submit'}
    ];
    let uploaded = this.props.files.filter((file) => file.type === 'uploaded');
    let uploadCount = uploaded.length || 0;
    let userFiles = (
      <List
        key="uploaded"
        subheader="Your Data"
        subheaderStyle={this._styles.list}
        >
          {this._renderFiles('uploaded')}
      </List>
    );
    let sampleFiles = (
      <List
        key="sample"
        subheader="Sample Data"
        subheaderStyle={this._styles.list}
        >
          {this._renderFiles('sample')}
      </List>
    );
    let filesList = [sampleFiles];

    if (uploadCount > 0) {
      filesList.unshift(userFiles);
    }

    return (
      <nav>
        {filesList}
        <Dialog
          actionFocus="submit"
          actions={dialogActions}
          onRequestClose={this._dismissDeleteConfirmDialog.bind(this)}
          open={dialogOpen}
          ref="deleteConfirmDialog"
          title={deleteConfirmDialog.title}
          >
            {deleteConfirmDialog.message}
        </Dialog>
      </nav>
    );
  }
}
