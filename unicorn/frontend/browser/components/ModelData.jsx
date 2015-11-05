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

// internals

import Chart from '../components/Chart';
import ModelDataStore from '../stores/ModelDataStore';


/**
 *
 */
@connectToStores([ModelDataStore], (context) => ({
  modelDataStore: context.getStore(ModelDataStore)
}))
export default class ModelData extends React.Component {

  static get propTypes() {
    return {
      modelId: React.PropTypes.string.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);
  }

  render() {
    let store = this.props.modelDataStore;
    let modelData = store.getData(this.props.modelId);
    if (modelData) {
      let options = {
        labels: ['Time', 'Value'],
        showRangeSelector: true
      };

      return (
        <Chart data={modelData.data} options={options} ref="chart"/>
      );
    }
  }

}
