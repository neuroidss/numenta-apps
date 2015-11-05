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

'use strict';

import React from 'react';
import Material from 'material-ui';
import SearchComponent from './search.jsx';
import SearchResultsComponent from './search-results.jsx';
import SearchHistoryComponent from './search-history.jsx';
const {
  AppBar, IconButton, Styles
} = Material;

const ThemeManager = new Styles.ThemeManager();

export default class Main extends React.Component {

  static childContextTypes = {
    muiTheme: React.PropTypes.object
  };

  constructor(props) {
    super(props);
  }

  _onLeftIconButtonTouchTap() {
    this.refs.history.toggle();
  }

  getChildContext() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  }

  render() {
    return (
      <div>
        <AppBar title="Numenta Imbu Application"
          onLeftIconButtonTouchTap={this._onLeftIconButtonTouchTap.bind(this)}
          iconElementRight={
            <IconButton href="http://www.numenta.com" linkButton={true}
              iconClassName="material-icons" tooltip="Go to numenta.com">home
            </IconButton>}/>
        <SearchComponent/>
        <SearchResultsComponent/>
        <SearchHistoryComponent ref="history"/>
      </div>
    );
  }
};
