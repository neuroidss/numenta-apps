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
import connectToStores from 'fluxible-addons-react/connectToStores';
import SearchStore from '../stores/search';

const {
  Styles, Table, Paper
} = Material;

const {
  Spacing
} = Styles;

const ThemeManager = new Styles.ThemeManager();

/**
 * Display Search Results on a Material UI Table
 */
@connectToStores([SearchStore], (context) => ({
  results: context.getStore(SearchStore).getResults()
}))
export default class SearchResultsComponent extends React.Component {

  static contextTypes = {
    getStore: React.PropTypes.func
  };

  static childContextTypes = {
    muiTheme: React.PropTypes.object
  };

  constructor(props) {
    super(props);
  }

  getChildContext () {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  }

  _getStyles() {
    return {
      header: {
        score: {
          width: '50px'
        }
      },
      column: {
        summary: {
          'white-space': 'normal',
          overflow: 'auto'
        },
        score: {
          width: '50px'
        }
      },
      content: {
        'padding-left': Spacing.desktopGutterMini + 'px',
        maxWidth: '1200px',
        margin: '0 auto'
      },
      table: {
        height: '500px'
      }
    };
  }

  render () {
    if (this.props.results.length > 0) {
      let styles = this._getStyles();

      // Convert SearchStore results to Table rowData structure
      const data = this.props.results.map(result => {
        return ({
          summary: {
            content: result.text,
            style: styles.column.summary
          },
          score: {
            content: result.score.toFixed(4),
            style: styles.column.score
          }
        });
      });
      // Format Table Header
      let headerCols = {
        summary: {
          content: 'Summary'
        },
        score: {
          content: 'Score',
          style: styles.header.score
        }
      };
      let colOrder = [
        'summary', 'score'
      ];

      return (
        <Paper style={styles.content}>
          <Table columnOrder={colOrder}
            displayRowCheckbox={false} displaySelectAll={false}
            fixedHeader={true} headerColumns={headerCols}
            height={styles.table.height} ref="results" rowData={data}
            showRowHover={true} style={styles.table}/>
        </Paper>
      );
    } else {
      // Nothing to show
      return (
        <p/>
      );
    }
  }
};
