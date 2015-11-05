/*
 * Numenta Platform for Intelligent Computing (NuPIC)
 * Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero Public License for more details.
 *
 * You should have received a copy of the GNU Affero Public License
 * along with this program.  If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 *
 */

package com.numenta.htmit.mobile;

import com.numenta.htmit.mobile.data.HTMITDatabase;
import com.numenta.htmit.mobile.preference.PreferencesConstants;
import com.numenta.htmit.mobile.service.HTMITClientFactoryImpl;
import com.numenta.htmit.mobile.service.HTMITClientImpl;
import com.numenta.htmit.mobile.service.HTMITDataSyncService;
import com.numenta.htmit.mobile.service.HTMITNotificationService;
import com.numenta.core.data.CoreDatabase;
import com.numenta.core.service.DataService;
import com.numenta.core.service.DataSyncService;
import com.numenta.core.service.HTMClient;
import com.numenta.core.service.HTMException;
import com.numenta.core.service.NotificationService;
import com.numenta.core.utils.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import android.content.SharedPreferences;
import android.content.res.Resources;
import android.preference.PreferenceManager;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;


/**
 * Maintain global application state.
 */
public class HTMITApplication extends com.numenta.core.app.HTMApplication {

    private static final String TAG = HTMITApplication.class.getCanonicalName();

    private volatile SortOrder _sort = SortOrder.Anomaly;
    /**
     * Current Sort Order Property
     */
    public static final String SORT_PROPERTY = "sort";

    // Page uploads to avoid timeouts when there are a lot of logs.
    private static final int MAX_LOGS_PER_REQUEST = 2000;

    @Override
    public void onCreate() {
        super.onCreate();
        // Initialize API Client factory
        setClientFactory(new HTMITClientFactoryImpl());

        // Initialize preferences
        PreferenceManager.setDefaultValues(this, R.xml.preferences, false);

    }

    /**
     * @return current {@link SortOrder}
     */
    public static SortOrder getSort() {
        return getInstance()._sort;
    }

    /**
     * Update the current {@link SortOrder}
     *
     * @param value new {@link SortOrder}
     */
    public static void setSort(final SortOrder value) {
        HTMITApplication app = getInstance();

        if (value != app._sort) {
            SortOrder old = app._sort;
            app._sort = value;
            app.firePropertyChange(SORT_PROPERTY, old, value);
        }
    }
    public static HTMITApplication getInstance() {
        return (HTMITApplication) com.numenta.core.app.HTMApplication
                .getInstance();
    }

    /**
     * Given a known metric name, returns the "Unit" associated to the metric.
     *
     * @see res/values/metric_units.xml
     */
    public static String getMetricUnit(String metricName) {

        if (metricName != null) {
            HTMITApplication app = getInstance();
            Resources resources = app.getResources();
            final StringBuilder resName = new StringBuilder("Unit_").append(
                    metricName.replace('/', '_'));
            final int resId = resources.getIdentifier(resName.toString(), "string",
                    app.getPackageName());
            if (resId != 0) {
                return app.getResources().getString(resId);
            }

        }
        return null;
    }

    /**
     * Returns interface to htmit database
     */
    public static HTMITDatabase getDatabase() {
        return (HTMITDatabase) com.numenta.core.app.HTMApplication.getDatabase();
    }

    /**
     * Override this method to create <b>HTM-IT</b> specific database interface
     *
     * @return {@link HTMITDatabase} instance
     */
    @Override
    protected CoreDatabase createDatabase() {
        return new HTMITDatabase(getContext());
    }

    /**
     * Override this method to create <b>HTM-IT</b> specific notification service
     *
     * @return {@link HTMITNotificationService} instance
     */
    @Override
    public DataSyncService createDataSyncService(DataService service) {
        return new HTMITDataSyncService(service);
    }

    /**
     * Override this method to create <b>HTM-IT</b> specific notification service
     *
     * @return {@link HTMITNotificationService} instance
     */
    @Override
    public NotificationService createNotificationService(DataService service) {
        return new HTMITNotificationService(service);
    }


    /**
     * This method should be executed periodically to send logs to the server.
     *
     * @throws HTMException
     * @throws java.io.IOException
     */
    @Override
    public void uploadLogs() throws HTMException, IOException {
        if (!HTMITApplication.shouldUploadLog()) {
            return;
        }
        int failedAttempts = 0;
        ArrayList<String> logs = new ArrayList<>();
        Log.drainTo(logs);
        if (logs.isEmpty()) {
            return;
        }


        HTMITClientImpl client = (HTMITClientImpl) connectToServer();
        if (client == null) {
            return;
        }
        String url = client.getServerUrl();
        if (url == null) {
            return;
        }
        url = url.trim() + "/_logging/android";

        while (!logs.isEmpty() && failedAttempts < 5) {
            int numLogs = Math.min(logs.size(), MAX_LOGS_PER_REQUEST);

            JSONArray logArray;
            logArray = new JSONArray();
            for (int i = 0; i < numLogs; i++) {
                String[] values = logs.get(i).split(" ", 5);
                Map<String, Object> entry = new HashMap<>();
                for (String keyValPair : values) {
                    entry.put(keyValPair.split("=", 2)[0], keyValPair.split("=", 2)[1]);
                }

                logArray.put(new JSONObject(entry));
            }
            String response = client.post(url, logArray.toString());
            if (response == null) {
                failedAttempts += 1;
                Log.e(TAG,
                        "Received null HTTP response from log upload request.");
                continue;
            }
            for (int i = 0; i < numLogs; ++i) {
                logs.remove(0);
            }
            // Start over when there is a successful upload.
            failedAttempts = 0;
        }
        // Make sure we don't retain too many logs in memory. This is in
        // addition to the logs in Log.queue.
        while (logs.size() > Log.MAX_LOGS_TO_KEEP) {
            logs.remove(0);
        }
    }

    /**
     * Establish a connection to the HTM-IT server and returns a new instance of
     * {@link HTMClient} using the the last known stored authentication settings, if any.
     *
     * @return {@link HTMClient} object used to interact with the server.
     */
    @Override
    public HTMClient connectToServer() {
        HTMITClientImpl connection = null;
        final SharedPreferences prefs = PreferenceManager
                .getDefaultSharedPreferences(com.numenta.core.app.HTMApplication.getContext());
        String serverUrl = prefs.getString(PreferencesConstants.PREF_SERVER_URL, null);
        if (serverUrl != null) {
            serverUrl = serverUrl.trim();
            String password = prefs.getString(PreferencesConstants.PREF_PASSWORD, null);
            try {
                connection = (HTMITClientImpl) connectToServer(serverUrl, password);
                connection.login();
                Log.d(TAG, "Service connected to " + serverUrl);
            } catch (Exception e) {
                connection = null;
                Log.e(TAG, "Unable to connect to server.", e);
            }
        } else {
            Log.e(TAG, "Unable to connect to ser er. Missing server URL.");
        }
        return connection;
    }
}
