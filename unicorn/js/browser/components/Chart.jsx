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

import Dygraph from 'dygraphs';
import Paper from 'material-ui/lib/paper';
import React from 'react';
import ReactDOM from 'react-dom';


/**
 * Chart Widget.
 *  Wraps http://dygraphs.com/ as a React Component.
 * @todo The local variables (this._chart*) should be refactored to React state.
 *  And, React's `render()` should be overrided with DyGraphs `updateOptions()`,
 *  possibly using Reacts's `shouldComponentUpdate()` method to skip React's
 *  state change => render cycle for DyGraphs to not have it's DOM node reset.
 */
export default class Chart extends React.Component {

  static get propTypes() {
    return {
      data: React.PropTypes.array.isRequired,
      options: React.PropTypes.object,
      zDepth: React.PropTypes.number
    };
  }

  static get defaultProps() {
    return {
      data: [],
      options: {},
      zDepth: 1
    };
  }

  static get contextTypes() {
    return {
      muiTheme: React.PropTypes.object
    };
  }

  constructor(props, context) {
    super(props, context);

    // DyGraphs chart container
    this._dygraph = null;

    // Chart Range finder values: For Fixed-width-chart & auto-scroll-to-right
    this._chartBusy = null;
    this._chartRange = null;
    this._chartRangeWidth = null;
    this._chartScrollLock = null;

    // dynamic styles
    let muiTheme = this.context.muiTheme;
    this._styles = {
      root: {
        boxShadow: 'none',
        height: muiTheme.rawTheme.spacing.desktopKeylineIncrement * 3.5,
        width: '100%'
      }
    };
  }

  componentDidMount() {
    this._chartBusy = false;
    this._chartRange = [0, this._chartRangeWidth]; // hold current range window
    this._chartScrollLock = true; // if chart far-right, stay floated right

    if (this.props.data.length) {
      this._chartInitalize();
    }
  }

  componentWillUnmount() {
    if (this._dygraph) {
      this._dygraph.destroy();
      this._dygraph = null;
    }

    this._chartBusy = null;
    this._chartRange = null;
    this._chartRangeWidth = null;
    this._chartScrollLock = null;
  }

  componentDidUpdate() {
    if (this._dygraph) {
      this._chartUpdate();
    } else if (this.props.data.length) {
      this._chartInitalize();
    }
  }

  /**
   * DyGrpahs Chart Initalize and Render
   */
  _chartInitalize() {
    let options = {
      clickCallback: this._chartClickCallback.bind(this),
      zoomCallback: this._chartZoomCallback.bind(this)
    };
    let el = ReactDOM.findDOMNode(this.refs.chart);
    let selector;

    this._chartBusy = true;

    Object.assign(options, this.props.options);
    this._dygraph = new Dygraph(el, this.props.data, options);

    // range selector custom events
    selector = el.getElementsByClassName('dygraph-rangesel-fgcanvas')[0];
    selector.addEventListener(
      'mousedown',
      this._rangeMouseDownCallback.bind(this)
    );
    selector.addEventListener(
      'mouseup',
      this._rangeMouseUpCallback.bind(this)
    );

    this._chartBusy = false;
  }

  /**
   * DyGrpahs Chart Update and Re-Render
   */
  _chartUpdate() {
    let options = {};
    let graphXmax;

    if (this._chartScrollLock && !this._chartBusy) {
      // if range scroll is locked, we're far right, so stay far right on chart
      graphXmax = this._dygraph.xAxisExtremes()[1];
      this._chartRange = [(graphXmax - this._chartRangeWidth), graphXmax];
    }

    // update chart
    this._chartBusy = true;
    options.dateWindow = this._chartRange; // fixed width
    options.file = this.props.data; // new data
    Object.assign(options, this.props.options);
    this._dygraph.updateOptions(options);
    this._chartBusy = false;
  }

  /**
   * DyGrpahs Chart click callback function
   */
  _chartClickCallback() {
    // user touched chart: turn off far-right scroll lock for now
    this._chartScrollLock = false;
  }

  /**
   * DyGrpahs Chart range finder change/zoom callback function
   * @param {Number} rangeXmin - Minimum X value of chart Range Finder
   * @param {Number} rangeXmax - Maximum X value of chart Range Finder
   * @param {Array} [yRanges] - Extra Y value data (unused currently)
   */
  _chartZoomCallback(rangeXmin, rangeXmax, yRanges) {
    // chart range finder, far-right scroll lock
    let [graphXmin, graphXmax] = this._dygraph.xAxisExtremes();
    let graphXrange = graphXmax - graphXmin;
    let graphXdiff = graphXmax - rangeXmax;

    // if range slider is moved far to the right, re-enable auto scroll
    this._chartScrollLock = this._isScrollLockActive(graphXdiff, graphXrange);
  }

  /**
   * DyGrpahs Chart RangeSelector mousedown callback function
   * @param {Object} event - Event handler object
   */
  _rangeMouseDownCallback(event) {
    this._chartBusy = true;
  }

  /**
   * DyGrpahs Chart RangeSelector mouseup callback function
   * @param {Object} event - Event handler object
   */
  _rangeMouseUpCallback(event) {
    let [graphXmin, graphXmax] = this._dygraph.xAxisExtremes();
    let graphXrange = graphXmax - graphXmin;
    let graphXdiff = graphXmax - this._chartRange[1];

    this._chartBusy = false;

    // if range slider is moved far to the right, re-enable auto scroll
    this._chartScrollLock = this._isScrollLockActive(graphXdiff, graphXrange);
  }

  /**
   * Should scroll lock be turned on? (Is chart range slider far-to-the-right?)
   * @param {Number} xDiff - Current width of range slider selection
   * @param {Number} xRange - Full width of range slider possible values
   * @return {Boolean} - Should range slider "scroll lock" be considered active
   *  based on current position/range?
   */
  _isScrollLockActive(xDiff, xRange) {
    return (xDiff < (xRange * 0.1));  // near right edge ~10%
  }

  /**
   * React render()
   * @return {Object} - Built React component pseudo-DOM object
   */
  render() {
    return (
      <Paper ref="chart" style={this._styles.root} zDepth={this.props.zDepth}>
        <br/>This Metric does not yet have a Model.
      </Paper>
    );
  }

}
