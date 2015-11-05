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

// Add ES6/7 polyfills such as "Array.from"
import 'babel/polyfill';

import Fluxible from 'fluxible';
import FluxibleReact from 'fluxible-addons-react';
import React from 'react';
import tapEventInject from 'react-tap-event-plugin';
import MainComponent from './components/main.jsx';
import SearchStore from './stores/search';

window.React = React; // dev tools @TODO remove for non-dev

tapEventInject(); // remove when >= React 1.0

// create fluxible app
let app = new Fluxible({
  component: MainComponent,
  stores: [SearchStore]
});

// add context to app
let context = app.createContext();

React.render(FluxibleReact.createElementWithContext(context), document.body);
