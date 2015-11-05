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

import DatabaseServer from '../../../frontend/lib/DatabaseServer';
import FileSchema from '../../../frontend/database/schema/File.json';
import MetricSchema from '../../../frontend/database/schema/Metric.json';
import MetricDataSchema from '../../../frontend/database/schema/MetricData.json'; // eslint-disable-line
import path from 'path';
import os from 'os';

const assert = require('assert');

const EXPECTED_FILE = {
  uid: 'id.1',
  name: 'file.1',
  filename: '/tmp/file.1',
  type: 'uploaded'
};
const EXPECTED_METRIC = {
  uid: 'id.1',
  file_uid: 'file.id.1',
  model_uid: 'model.id.1',
  name: 'file.1',
  type: 'date',
  min: 0,
  max: 100
};
const EXPECTED_METRIC_DATA = {
  uid: 'id.1',
  metric_uid: 'metric.id.1',
  rowid: 1,
  timestamp: '2015-01-01 00:00:00Z',
  metric_value: 1,
  display_value: 1,
  anomaly_score: 1,
  anomaly_likelihood: 1
};


describe('DatabaseServer', () => {
  let server;

  before(() => {
    let tmpDir = path.join(os.tmpDir(), 'unicorn_db');
    server = new DatabaseServer(tmpDir);
  });
  after(() => {
    server.close((err) => assert.ifError(err));
    server.destroy((err) => assert.ifError(err));
  });

  describe('Schema', () => {
    it('should validate "File"', (done) => {
      let results = server.validator.validate(EXPECTED_FILE, FileSchema);
      assert(results.errors.length === 0, JSON.stringify(results.errors));
      done();
    });

    it('should validate "Metric"', (done) => {
      let results = server.validator.validate(EXPECTED_METRIC, MetricSchema);
      assert(results.errors.length === 0, JSON.stringify(results.errors));
      done();
    });

    it('should validate "MetricData"', (done) => {
      let results = server.validator.validate(EXPECTED_METRIC_DATA, MetricDataSchema); // eslint-disable-line
      assert(results.errors.length === 0, JSON.stringify(results.errors));
      done();
    });
  });

  /* eslint-disable max-nested-callbacks */
  describe('File Table', () => {
    it('should add a single file to the database', (done) => {
      server.putFile(EXPECTED_FILE, (error) => {
        assert.ifError(error);
        done();
      });
    });
    it('should not add invalid file to the database', (done) => {
      let invalid = Object.assign({}, EXPECTED_FILE);
      delete invalid.uid; // eslint-disable-line
      server.putFile(invalid, (error) => {
        assert.ifError(!error);
        done();
      });
    });
    it('should add multiple files to the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid) => {
        return Object.assign({}, EXPECTED_FILE, {uid});
      });
      server.putFileBatch(batch, (error) => {
        assert.ifError(error);
        done();
      });
    });
    it('should load a single file from the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid) => {
        return Object.assign({}, EXPECTED_FILE, {uid});
      });
      server.putFileBatch(batch, (error) => {
        assert.ifError(error);
        server.getFile(batch[0].uid, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch[0]);
          done();
        });
      });
    });
    it('should load multiple files from the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid) => {
        return Object.assign({}, EXPECTED_FILE, {uid});
      });
      server.putFileBatch(batch, (error) => {
        assert.ifError(error);
        server.queryFile({}, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch);
          done();
        });
      });
    });
  });

  describe('Metric Table', () => {
    it('should add a single metric to the database', (done) => {
      server.putMetric(EXPECTED_METRIC, (error) => {
        assert.ifError(error);
        done();
      });
    });
    it('should not add invalid metric to the database', (done) => {
      let invalid = Object.assign({}, EXPECTED_METRIC);
      delete invalid.uid; // eslint-disable-line
      server.putMetric(invalid, (error) => {
        assert.ifError(!error);
        done();
      });
    });
    it('should add multiple metrics to the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid) => {
        return Object.assign({}, EXPECTED_METRIC, {uid});
      });
      server.putMetricBatch(batch, (error) => {
        assert.ifError(error);
        done();
      });
    });
    it('should load a single metric from the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid) => {
        return Object.assign({}, EXPECTED_METRIC, {uid});
      });
      server.putMetricBatch(batch, (error) => {
        assert.ifError(error);
        server.getMetric(batch[0].uid, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch[0]);
          done();
        });
      });
    });
    it('should load multiple metrics from the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid) => {
        return Object.assign({}, EXPECTED_METRIC, {uid});
      });
      server.putMetricBatch(batch, (error) => {
        assert.ifError(error);
        server.queryMetric({}, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch);
          done();
        });
      });
    });
  });

  describe('MetricData Table', () => {
    it('should add a single MetricData record to the database', (done) => {
      server.putMetricData(EXPECTED_METRIC_DATA, (error) => {
        assert.ifError(error);
        done();
      });
    });
    it('should not add invalid MetricData record to the database', (done) => {
      let invalid = Object.assign({}, EXPECTED_METRIC_DATA);
      delete invalid.uid; // eslint-disable-line
      server.putMetricData(invalid, (error) => {
        assert.ifError(!error);
        done();
      });
    });
    it('should add multiple MetricData records to the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid) => {
        return Object.assign({}, EXPECTED_METRIC_DATA, {uid, metric_uid: uid});
      });
      server.putMetricDataBatch(batch, (error) => {
        assert.ifError(error);
        done();
      });
    });
    it('should load multiple MetricData records from the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid) => {
        return Object.assign({}, EXPECTED_METRIC_DATA, {uid, metric_uid: uid});
      });
      server.putMetricDataBatch(batch, (error) => {
        assert.ifError(error);
        server.queryMetricData({}, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch);
          done();
        });
      });
    });
  });
});
