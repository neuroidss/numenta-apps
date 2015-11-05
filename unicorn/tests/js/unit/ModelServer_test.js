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


import {
  ModelServer, MaximumConcurrencyError
} from '../../../frontend/lib/ModelServer';
const assert = require('assert');

const STATS = '{"min": 0, "max": 10}';
const MODEL_ID = '1';
const INPUT_DATA = [1438649711, 835.93679];
const EXPECTED_RESULTS = '[0, 0.0301029996658834]\n'; // Log scaled

/* eslint-disable max-nested-callbacks */

describe('ModelServer', () => {
  let server = new ModelServer();

  beforeEach(() => {
    server.createModel(MODEL_ID, STATS);
  });
  afterEach(() => {
    try {
      server.removeModel(MODEL_ID);
    } catch (ignore) {/* It may be closed by the test itself */}
  });

  describe('#getModels()', () => {
    it('Check model exists', (done) => {
      let models = server.getModels();
      assert(models.find((id) => (id) === MODEL_ID), 'Model not found');
      done();
    });
  });

  describe('#sendData()', () => {
    it('Send data to model', (done) => {
      server.sendData(MODEL_ID, INPUT_DATA);
      done();
    });
  });

  describe('Model Events', () => {

    it('Read data from model', (done) => {
      server.on(MODEL_ID, (type, data) => {
        assert(type !== 'error', data);
        if (type === 'data') {
          assert.equal(data, EXPECTED_RESULTS);
          server.removeAllListeners(MODEL_ID);
          done();
        }
      });
      server.sendData(MODEL_ID, INPUT_DATA);
    });

    it('Send bad data to model', (done) => {
      server.on(MODEL_ID, (type, data) => {
        if (type === 'close') {
          return;
        } else if (type === 'error') {
          server.removeAllListeners(MODEL_ID);
          done();
        } else {
          assert.fail(type, 'error', `Expecting "error" got "${type} : ${data}"`); // eslint-disable-line
        }
      });
      server.sendData(MODEL_ID, [0xbadbeef]);
    });
  });

  describe('Model concurrency', () => {
    it('Create models up to max concurrency', (done) => {
      let max = server.availableSlots();
      // The first model was created in 'beforeEach'
      for (let i=1; i<=max; i++) {
        server.createModel(MODEL_ID+i, STATS);
      }
      // Cleanup
      for (let i=1; i<=max; i++) {
        server.removeModel(MODEL_ID+i);
      }
      done();
    });
    it ('Create models past max concurrency', (done) => {
      let max = server.availableSlots();
      // The first model was created in 'beforeEach'
      for (let i=1; i<=max; i++) {
        server.createModel(MODEL_ID+i, STATS);
      }
      // Extra model
      assert.throws(() => {
        server.createModel('extra', STATS);
      }, MaximumConcurrencyError);
      // Cleanup
      for (let i=1; i<=max; i++) {
        server.removeModel(MODEL_ID+i);
      }
      done();
    });
  });
});
