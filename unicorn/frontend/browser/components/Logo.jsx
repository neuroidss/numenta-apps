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

import Avatar from 'material-ui/lib/avatar';
import React from 'react';


/**
 * Logo custom View Component
 * @class
 * @extends React.Component
 * @module
 * @public
 * @this Logo
 */
export default class Logo extends React.Component {

  static get contextTypes() {
    return {
      muiTheme: React.PropTypes.object
    };
  }

  constructor(props, context) {
    super(props, context);

    let muiTheme = this.context.muiTheme;
    this._style = {
      backgroundColor: muiTheme.appBar.color,
      color: muiTheme.appBar.textColor,
      fontSize: 32,
      height: muiTheme.appBar.height * 2,
      margin: 0,
      padding: muiTheme.rawTheme.spacing.desktopGutter,
      width: '100%'
    };
  }

  /**
   * Render
   * @method
   * @public
   * @returns {object} Abstracted React/JSX DOM representation to render to HTML
   * @this Logo
   * @todo refactor split into Header->Brand(Avatar)->Company(text) components,
   *  each w/own style. Space/align logo and Company text a bit.
   */
  render() {
    return (
      <header style={this._style}>
        <Avatar backgroundColor="#145591" size={65} src="assets/images/unicorn-logo-300.png">
          Unicorn
        </Avatar>
      </header>
    );
  }

}
