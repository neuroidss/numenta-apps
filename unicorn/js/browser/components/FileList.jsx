// Copyright © 2016, Numenta, Inc.  Unless you have purchased from
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
import CheckboxOutline from 'material-ui/lib/svg-icons/toggle/check-box-outline-blank';
import connectToStores from 'fluxible-addons-react/connectToStores';
import Dialog from 'material-ui/lib/dialog';
import FlatButton from 'material-ui/lib/flat-button';
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

import AddModelAction from '../actions/AddModel';
import DeleteFileAction from '../actions/DeleteFile';
import FileStore from '../stores/FileStore';
import HideModelAction from '../actions/HideModel';
import ModelStore from '../stores/ModelStore';
import MetricStore from '../stores/MetricStore';
import ShowFileDetailsAction from '../actions/ShowFileDetails';
import ShowModelAction from '../actions/ShowModel';
import Utils from '../../main/Utils';


/**
 * Component used to display a list of files
 */
@connectToStores([FileStore, ModelStore, MetricStore], (context) => ({
  files: context.getStore(FileStore).getFiles(),
  models: context.getStore(ModelStore).getModels()
}))
export default class FileList extends React.Component {

  static get contextTypes() {
    return {
      executeAction: React.PropTypes.func,
      getConfigClient: React.PropTypes.func,
      getStore: React.PropTypes.func,
      muiTheme: React.PropTypes.object
    };
  }

  constructor(props, context) {
    super(props, context);

    let showNested = {};
    let muiTheme = this.context.muiTheme;

    this._config = this.context.getConfigClient();

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
      root: {
        paddingTop: '0.5rem'
      },
      list: {
        color: muiTheme.rawTheme.palette.accent3Color,
        fontWeight: muiTheme.rawTheme.font.weight.normal
      },
      file: {
        marginLeft: '-1.4rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap'
      },
      fileToggle: {
        margin: 0
      },
      more: {
        width: 40
      },
      metric: {
        marginLeft: '-1.4rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap'
      },
      empty: {
        color: muiTheme.rawTheme.palette.primary2Color,
        fontSize: '82.5%',
        marginLeft: 3
      },
      status: {
        height: 12,
        margin: 0,
        marginRight: '0.5rem',
        padding: 0,
        width: 12
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
      this.context.executeAction(AddModelAction, {
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
        this._config.get('dialog:file:delete:title'),
        this._config.get('dialog:file:delete:message'),
        () => {
          this.context.executeAction(DeleteFileAction, filename);
          this._dismissDeleteConfirmDialog();
        }
      );
    }
  }

  _renderMetrics(file) {
    let metricStore = this.context.getStore(MetricStore);

    let fileMetrics = metricStore.getMetricsByFileId(file.uid);
    let timestampField = fileMetrics.find((metric) => {
      return metric.type === 'date';
    });
    if (timestampField) {
      return fileMetrics.map((metric) => {
        if (metric.type !== 'date') {
          let muiTheme = this.context.muiTheme;
          let modelId = Utils.generateMetricId(file.filename, metric.name);
          let models = this.props.models;
          let model = models.find((m) => m.modelId === modelId);
          let isModelVisible = false;
          let checkboxColor = muiTheme.rawTheme.palette.primary1Color;
          let statusColor = muiTheme.rawTheme.palette.disabledColor;

          if (model) {
            if (model.visible) {
              isModelVisible = true;
            }
            if (model.ran) {
              statusColor = muiTheme.rawTheme.palette.primary2Color;
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
                  unCheckedIcon={<CheckboxOutline color={checkboxColor} />}
                  />
              }
              primaryText={
                <div style={this._styles.metric}>
                  <IconStatus color={statusColor} style={this._styles.status} />
                  {metric.name}
                </div>
              }
              />
          );
        }
      });
    }
  }

  _renderFiles(filetype) {
    let uploaded = this.props.files.filter((file) => file.type === 'uploaded');
    let uploadCount = uploaded.length || 0;
    let emptyMessage = this._config.get('heading:data:empty');

    if ((filetype === 'uploaded') && (uploadCount <= 0)) {
      return (
        <ListItem
          initiallyOpen={true}
          primaryText={<div style={this._styles.empty}>{emptyMessage}</div>}
          />
      );
    }

    return this.props.files.map((file) => {
      if (file.type === filetype) {
        let color = this.context.muiTheme.rawTheme.palette.primary1Color;
        let fileId = file.uid;
        let filename = file.filename;
        let contextMenu = (
          <IconMenu
            iconButtonElement={
              <IconButton><IconMore color={color} /></IconButton>
            }
            onChange={this._handleFileContextMenu.bind(this, filename)}
            style={this._styles.more}
            >
              <MenuItem index={1}
                primaryText={this._config.get('menu:file:details')}
                value="detail"
                />
              <MenuItem index={2}
                disabled={filetype === 'sample'}
                primaryText={this._config.get('menu:file:delete')}
                value="delete"
                />
          </IconMenu>
        );
        let leftIconButton, toggleIcon;

        // choose file visibility toggle icon
        if (this.state.showNested[fileId]) {
          toggleIcon = (<IconOpen color={color} />);
        } else {
          toggleIcon = (<IconClose color={color} />);
        }
        leftIconButton = (
          <IconButton
            onTouchTap={this._handleFileToggle.bind(this, fileId)}
            style={this._styles.fileToggle}
            >
              {toggleIcon}
          </IconButton>
        );

        return (
          <ListItem
            initiallyOpen={true}
            key={file.name}
            leftIcon={leftIconButton}
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
      <FlatButton
        label={this._config.get('button:cancel')}
        onTouchTap={this._dismissDeleteConfirmDialog.bind(this)}
        />,
      <FlatButton
        label={this._config.get('button:delete')}
        keyboardFocused={true}
        onTouchTap={deleteConfirmDialog.callback}
        primary={true}
        ref="submit"
        />
    ];
    let userFiles = (
      <List
        key="uploaded"
        subheader={this._config.get('heading:data:user')}
        subheaderStyle={this._styles.list}
        >
          {this._renderFiles('uploaded')}
      </List>
    );
    let sampleFiles = (
      <List
        key="sample"
        subheader={this._config.get('heading:data:sample')}
        subheaderStyle={this._styles.list}
        >
          {this._renderFiles('sample')}
      </List>
    );
    let filesList = [userFiles, sampleFiles];

    return (
      <nav style={this._styles.root}>
        {filesList}
        <Dialog
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
