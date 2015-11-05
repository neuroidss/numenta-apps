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


// externals

import React from 'react';

import connectToStores from 'fluxible-addons-react/connectToStores';

import Avatar from 'material-ui/lib/avatar';
import Card from 'material-ui/lib/card/card';
import CardActions from 'material-ui/lib/card/card-actions';
import CardHeader from 'material-ui/lib/card/card-header';
import CardText from 'material-ui/lib/card/card-text';
import Colors from 'material-ui/lib/styles/colors';
import FlatButton from 'material-ui/lib/flat-button';

// internals

import ModelData from '../components/ModelData';
import ModelStore from '../stores/ModelStore';
import StopModelAction from '../actions/StopModel';


/**
 *
 */
@connectToStores([ModelStore], () => ({}))
export default class Model extends React.Component {

  static get contextTypes() {
    return {
      executeAction: React.PropTypes.func,
      getStore: React.PropTypes.func
    };
  }

  static get propTypes() {
    return {
      modelId: React.PropTypes.string.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this._style = {
      marginBottom: '1rem',
      width: '100%'
    };

    let store = this.context.getStore(ModelStore);
    let model = store.getModel(this.props.modelId);
    this.state = Object.assign({}, model);
  }

  componentWillReceiveProps(nextProps) {
    let store = this.context.getStore(ModelStore);
    let model = store.getModel(nextProps.modelId);
    this.setState(Object.assign({}, model));
  }

  _onStopButtonClick() {
    this.context.executeAction(StopModelAction, this.props.modelId);
  }

  render() {
    let actions, avatar, title, titleColor;
    let model = this.state;

    if (model.active) {
      actions = (
        <CardActions  expandable={true}>
          <FlatButton label="Stop"
            onClick={this._onStopButtonClick.bind(this)}/>
        </CardActions>);
    }
    if (model.error) {
      avatar = (<Avatar backgroundColor={Colors.red500}>E</Avatar>);
      title = `${model.metric} : ${model.error.message}`;
      titleColor = Colors.red500;
    } else {
      avatar = (<Avatar backgroundColor={Colors.green500}></Avatar>);
      title = model.metric;
      titleColor = Colors.darkBlack;
    }

    return (
      <Card initiallyExpanded={true} style={this._style}>
        <CardHeader showExpandableButton={true}
          subtitle={model.filename}
          avatar={avatar}
          title={title}
          titleColor={titleColor} />
        {actions}
        <CardText expandable={true}>
          <ModelData modelId={model.modelId} />
        </CardText>
      </Card>
    );
  }

}
