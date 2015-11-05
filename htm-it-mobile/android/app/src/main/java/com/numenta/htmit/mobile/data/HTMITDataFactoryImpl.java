/*
 * Numenta Platform for Intelligent Computing (NuPIC)
 * Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 *
 */

package com.numenta.htmit.mobile.data;

import com.numenta.htmit.mobile.HTMITApplication;
import com.numenta.core.data.CoreDataFactoryImpl;
import com.numenta.core.data.Metric;

import org.json.JSONObject;

import android.database.Cursor;

/**
 * Customize Core data objects with HTM-IT specific requirements
 */
public class HTMITDataFactoryImpl extends CoreDataFactoryImpl {

    @Override
    public Metric createMetric(Cursor cursor) {
        Metric metric = super.createMetric(cursor);
        // Check if we need to update metric unit
        if (metric != null && metric.getUnit() == null) {
            metric.setUnit(HTMITApplication.getMetricUnit(metric.getName()));
        }
        return metric;
    }

    @Override
    public Metric createMetric(String metricId, String name, String instanceId, String serverName,
            int lastRowId, JSONObject parameters) {
        Metric metric = super.createMetric(metricId, name, instanceId, serverName, lastRowId, parameters);
        // Check if we need to update metric unit
        if (metric != null && metric.getUnit() == null) {
            metric.setUnit(HTMITApplication.getMetricUnit(metric.getName()));
        }
        return metric;
    }
}
