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


/* eslint-disable max-len, prefer-reflect */

import DatabaseService from '../../../js/main/DatabaseService';
import FileSchema from '../../../js/database/schema/File.json';
import fs from 'fs';
import MetricDataSchema from '../../../js/database/schema/MetricData.json';
import MetricSchema from '../../../js/database/schema/Metric.json';
import os from 'os';
import path from 'path';

const assert = require('assert');

const EXPECTED_FILE = {
  uid: 'file1',
  name: 'file1',
  filename: '/tmp/file1',
  type: 'uploaded'
};
const EXPECTED_METRIC = {
  uid: 'file1!metric1',
  file_uid: 'file1',
  model_uid: 'file1!metric1',
  name: 'metric1',
  type: 'number',
  min: 0,
  max: 100
};
const EXPECTED_METRIC_DATA = {
  uid: 'file1!metric1!1420070400',
  metric_uid: 'file1!metric1',
  rowid: 1,
  timestamp: '2015-01-01 00:00:00Z',
  metric_value: 1,
  display_value: 1,
  anomaly_score: 1,
  anomaly_likelihood: 1
};

const EXPECTED_EXPORTED_RESULTS =
`timestamp,metric_value,anomaly_likelihood
2015-01-01 00:00:00Z,1,1
2015-01-01 00:00:00Z,1,1
2015-01-01 00:00:00Z,1,1
2015-01-01 00:00:00Z,1,1`;

const TEMP_DIR = path.join(os.tmpDir(), 'unicorn_db');
const FILENAME = path.join(TEMP_DIR, 'file.csv');


describe('DatabaseService:', () => {
  let service;

  before(() => {
    service = new DatabaseService(TEMP_DIR);
  });
  after(() => {
    service.close((err) => assert.ifError(err));
    service.destroy((err) => assert.ifError(err));
  });
  afterEach(() => {
    // Delete all records
    let db = service.levelup;
    let batch = db.batch();
    db.createReadStream()
      .on('data', (value) => batch.del(value.key))
      .on('error', (error) => assert.ifError(error))
      .on('end', () => {
        batch.write((error) => assert.ifError(error))
      });
  });

  describe('Schema Validation:', () => {
    it('should validate "File"', (done) => {
      let results = service.validator.validate(EXPECTED_FILE, FileSchema);
      assert(results.errors.length === 0, JSON.stringify(results.errors));
      done();
    });
    it('should validate "Metric"', (done) => {
      let results = service.validator.validate(EXPECTED_METRIC, MetricSchema);
      assert(results.errors.length === 0, JSON.stringify(results.errors));
      done();
    });
    it('should validate "MetricData"', (done) => {
      let results = service.validator.validate(EXPECTED_METRIC_DATA, MetricDataSchema);
      assert(results.errors.length === 0, JSON.stringify(results.errors));
      done();
    });
  });

  /* eslint-disable max-nested-callbacks */
  describe('File:', () => {
    it('should add a single file to the database', (done) => {
      service.putFile(EXPECTED_FILE, (error) => {
        assert.ifError(error);
        service.getFile(EXPECTED_FILE.uid, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, EXPECTED_FILE);
          done();
        });
      });
    });
    it('should not add invalid file to the database', (done) => {
      let invalid = Object.assign({}, EXPECTED_FILE);
      delete invalid.uid;
      service.putFile(invalid, (error) => {
        assert(error, 'Invalid file was created');
        done();
      });
    });
    it('should add multiple files to the database', (done) => {
      let batch = Array.from(['file1', 'file2'], (uid) => {
        return Object.assign({}, EXPECTED_FILE, {uid});
      });
      service.putFileBatch(batch, (error) => {
        assert.ifError(error);
        service.getAllFiles((error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch);
          done();
        });
      });
    });
    it('should load a single file from the database', (done) => {
      let batch = Array.from(['file1', 'file2'], (uid) => {
        return Object.assign({}, EXPECTED_FILE, {uid});
      });
      service.putFileBatch(batch, (error) => {
        assert.ifError(error);
        service.getFile(batch[0].uid, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch[0]);
          done();
        });
      });
    });
  });

  describe('Metric:', () => {
    it('should add a single metric to the database', (done) => {
      service.putMetric(EXPECTED_METRIC, (error) => {
        assert.ifError(error);
        service.getMetric(EXPECTED_METRIC.uid, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, EXPECTED_METRIC);
          done();
        });
      });
    });
    it('should not add invalid metric to the database', (done) => {
      let invalid = Object.assign({}, EXPECTED_METRIC);
      delete invalid.uid;
      service.putMetric(invalid, (error) => {
        assert(error, 'Invalid Metric was created');
        done();
      });
    });
    it('should add multiple metrics to the database', (done) => {
      let batch = Array.from(['file1!metric1', 'file1!metric2'], (uid) => {
        return Object.assign({}, EXPECTED_METRIC, {uid});
      });
      service.putMetricBatch(batch, (error) => {
        assert.ifError(error);
        service.getAllMetrics((error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch);
          done();
        });
      });
    });
    it('should load a single metric from the database', (done) => {
      let batch = Array.from(['file1!metric1', 'file1!metric2'], (uid) => {
        return Object.assign({}, EXPECTED_METRIC, {uid});
      });
      service.putMetricBatch(batch, (error) => {
        assert.ifError(error);
        service.getMetric(batch[0].uid, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch[0]);
          done();
        });
      });
    });
    it('should get metrics by file from the database', (done) => {
      let batch = Array.from([
        'file1!metric1', 'file1!metric2',
        'file2!metric1', 'file2!metric2'
      ], (uid) => {
        return Object.assign({}, EXPECTED_METRIC, {uid});
      });
      let expected = batch.filter((metric) => {
        return metric.uid.startsWith('file1');
      });
      service.putMetricBatch(batch, (error) => {
        assert.ifError(error);
        service.getMetricsByFile('file1', (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, expected);
          done();
        });
      });
    })
    it('should delete metric from the database', (done) => {
      let metricData = Array.from([
        `${EXPECTED_METRIC.uid}!1420070400`,
        `${EXPECTED_METRIC.uid}!1420070401`,
        `${EXPECTED_METRIC.uid}!1420070402`,
        `${EXPECTED_METRIC.uid}!1420070403`
      ], (uid, idx) => {
        return Object.assign({}, EXPECTED_METRIC_DATA, {uid, rowid: idx});
      });

      // Add metric
      service.putMetric(EXPECTED_METRIC, (error) => {
        assert.ifError(error);
        // Add data
        service.putMetricDataBatch(metricData, (error) => {
          assert.ifError(error);
          // Delete metric
          service.deleteMetric(EXPECTED_METRIC.uid, (error) => {
            assert.ifError(error);
            service.getMetric(EXPECTED_METRIC.uid, (error, actual) => {
              // Make sure metric was deleted
              assert(
                error && error.type === 'NotFoundError',
                'Metric was not deleted'
              );
              // Make sure data was deleted
              service.getMetricData(EXPECTED_METRIC.uid, (error, actual) => {
                assert(actual.length === 0, 'MetricData was not deleted');
                done();
              });
            });
          });
        });
      });
    });
    it('should delete metrics by file from the database', (done) => {
      let metricData = Array.from([
        `${EXPECTED_METRIC.uid}!1420070400`,
        `${EXPECTED_METRIC.uid}!1420070401`,
        `${EXPECTED_METRIC.uid}!1420070402`,
        `${EXPECTED_METRIC.uid}!1420070403`
      ], (uid, idx) => {
        return Object.assign({}, EXPECTED_METRIC_DATA, {uid, rowid: idx});
      });

      // Add metric
      service.putMetric(EXPECTED_METRIC, (error) => {
        assert.ifError(error);
        // Add data
        service.putMetricDataBatch(metricData, (error) => {
          assert.ifError(error);
          // Delete metric
          service.deleteMetricsByFile(EXPECTED_METRIC.file_uid, (error) => {
            assert.ifError(error);
            service.getMetric(EXPECTED_METRIC.uid, (error, actual) => {
              // Make sure metric was deleted
              assert(
                error && error.type === 'NotFoundError',
                'Metric was not deleted'
              );
              done();
            });
          });
        });
      });
    });
  });

  describe('MetricData:', () => {
    it('should add a single MetricData record to the database', (done) => {
      service.putMetricData(EXPECTED_METRIC_DATA, (error) => {
        assert.ifError(error);
        done();
      });
    });
    it('should not add invalid MetricData record to the database', (done) => {
      let invalid = Object.assign({}, EXPECTED_METRIC_DATA);
      delete invalid.uid;
      service.putMetricData(invalid, (error) => {
        assert(error, 'Invalid MetricData was created');
        done();
      });
    });
    it('should add multiple MetricData records to the database', (done) => {
      let batch = Array.from([
        `${EXPECTED_METRIC_DATA.metric_uid}!1420070400`,
        `${EXPECTED_METRIC_DATA.metric_uid}!1420070401`
      ], (uid) => {
        return Object.assign({}, EXPECTED_METRIC_DATA, {uid, metric_uid: uid});
      });
      service.putMetricDataBatch(batch, (error) => {
        assert.ifError(error);
        done();
      });
    });
    it('should load multiple MetricData records from the database', (done) => {
      let batch = Array.from([
        `${EXPECTED_METRIC_DATA.metric_uid}!1420070400`,
        `${EXPECTED_METRIC_DATA.metric_uid}!1420070401`,
        `${EXPECTED_METRIC_DATA.metric_uid}!1420070402`
      ], (uid, idx) => {
        return Object.assign({}, EXPECTED_METRIC_DATA, {uid, rowid: idx});
      });
      service.putMetricDataBatch(batch, (error) => {
        assert.ifError(error);
        service.getMetricData(EXPECTED_METRIC_DATA.metric_uid, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch);
          done();
        });
      });
    });
    it('should export MetricData from the database', (done) => {
      after(() => {
        fs.unlinkSync(FILENAME); // eslint-disable-line no-sync
      });

      let batch = Array.from([
        `${EXPECTED_METRIC_DATA.metric_uid}!1420070400`,
        `${EXPECTED_METRIC_DATA.metric_uid}!1420070401`,
        `${EXPECTED_METRIC_DATA.metric_uid}!1420070402`,
        `${EXPECTED_METRIC_DATA.metric_uid}!1420070403`
      ], (uid, idx) => {
        return Object.assign({}, EXPECTED_METRIC_DATA, {uid, rowid: idx});
      });
      service.putMetricDataBatch(batch, (error) => {
        assert.ifError(error);
        service.exportMetricData(EXPECTED_METRIC_DATA.metric_uid, FILENAME, (error, res) => {
          assert.ifError(error);
          fs.readFile(FILENAME, 'utf8', (error, data) => {
            assert.ifError(error);
            assert.equal(data, EXPECTED_EXPORTED_RESULTS);
            done();
          });
        });
      });
    });
    it('should delete MetricData from the database', (done) => {
      let batch = Array.from([
        `${EXPECTED_METRIC_DATA.metric_uid}!1420070400`,
        `${EXPECTED_METRIC_DATA.metric_uid}!1420070401`,
        `${EXPECTED_METRIC_DATA.metric_uid}!1420070402`,
        `${EXPECTED_METRIC_DATA.metric_uid}!1420070403`
      ], (uid, idx) => {
        return Object.assign({}, EXPECTED_METRIC_DATA, {uid, rowid: idx});
      });

      // Add data
      service.putMetricDataBatch(batch, (error) => {
        assert.ifError(error);
        // Make sure data exist
        service.getMetricData(EXPECTED_METRIC_DATA.metric_uid, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch);
          // Delete data
          service.deleteMetricData(EXPECTED_METRIC_DATA.metric_uid, (error) => {
            assert.ifError(error);
            // Make sure data was deleted
            service.getMetricData(EXPECTED_METRIC_DATA.metric_uid, (error, actual) => {
              assert.ifError(error);
              assert.equal(actual.length, 0);
              done();
            });
          });
        });
      });
    });
  });
});
