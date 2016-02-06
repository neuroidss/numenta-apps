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


import Avatar from 'material-ui/lib/avatar';
import React from 'react';


/**
 * Logo custom View Component
 */
export default class Logo extends React.Component {

  static get contextTypes() {
    return {
      muiTheme: React.PropTypes.object
    };
  }

  constructor(props, context) {
    super(props, context);

    // dynamic styles
    let muiTheme = this.context.muiTheme;
    this._styles = {
      root: {
        backgroundColor: muiTheme.appBar.color,
        color: muiTheme.appBar.textColor,
        height: muiTheme.appBar.height * 2,
        margin: 0,
        padding: muiTheme.rawTheme.spacing.desktopGutter,
        width: '100%'
      },
      avatar: {
        backgroundColor: muiTheme.rawTheme.palette.accent2Color,
        borderColor: muiTheme.rawTheme.palette.accent2Color,
        position: 'relative',
        top: '0.666rem'
      },
      title: {
        marginLeft: '0.666rem',
        marginTop: '-3rem',
        fontSize: '200%'
      }
    };
  }

  /**
   * Render
   * @return {object} Abstracted React/JSX DOM representation to render to HTML
   * @todo refactor split into Header->Brand(Avatar)->Company(text) components,
   *  each w/own style. Space/align logo and Company text a bit.
   */
  render() {
    return (
      <header style={this._styles.root}>
        <Avatar
          size={65}
          style={this._styles.avatar}
          src="assets/images/unicorn-logo-300.png">
            <span style={this._styles.title}>
              Unicorn
            </span>
        </Avatar>
      </header>
    );
  }

}
