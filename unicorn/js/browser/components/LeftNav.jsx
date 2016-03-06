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


import Paper from 'material-ui/lib/paper';
import React from 'react';

import Logo from '../components/Logo';


/**
 * LeftNav custom View Component
 */
export default class LeftNav extends React.Component {

  static get contextTypes() {
    return {
      muiTheme: React.PropTypes.object
    };
  }

  static get propTypes() {
    return {
      zDepth: React.PropTypes.number
    };
  }

  static get defaultProps() {
    return {
      zDepth: 1
    };
  }

  constructor(props, context) {
    super(props, context);

    let muiTheme = this.context.muiTheme;
    this._style = {
      backgroundColor: muiTheme.leftNav.color,
      height: '100%',
      left: 0,
      position: 'fixed',
      top: 0,
      width: muiTheme.leftNav.width
    };
  }

  /**
   * Render
   * @return {object} Abstracted React/JSX DOM representation to render to HTML
   */
  render() {
    return (
      <Paper style={this._style} zDepth={this.props.zDepth}>
        <Logo />
        {this.props.children}
      </Paper>
    );
  }

}
