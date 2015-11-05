
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

import com.numenta.htmit.mobile.preference.PreferencesConstants;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences.Editor;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.preference.PreferenceManager;
import android.webkit.URLUtil;

import java.util.Locale;


public class SplashScreenActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Handle "https://m.numenta.com/htmit" URL
        Intent intent = getIntent();
        if (intent != null && intent.getAction().equals(Intent.ACTION_VIEW)) {
            handleHTMITUrl(intent.getData());
        }

        setContentView(R.layout.activity_splash_screen);
        new Handler().postDelayed(new Runnable() {

            @Override
            public void run() {
                Intent myIntent = new Intent(SplashScreenActivity.this,
                        LoginActivity.class);
                startActivity(myIntent);
                finish();
                overridePendingTransition(0, R.anim.fadeout_animation);
            }
        }, 1000);
    }

    /**
     * Handles "https://m.numenta.com/htmit" URLs.
     * <p>
     * The URL format is:
     * <ol>
     * <li><b>/login</b> : Used to configure login parameters from a URL.
     *
     *      <br><b>Arguments:</b>
     *      <ul>
     *      <li><b>serverUrl</b>: HTM-IT serer host name or URL
     *      <li><b>apiKey</b>: HTM-IT API key
     *      </ul>
     *
     *      For example: <code>https://m.numenta.com/htmit/login?serverUrl=hostname&apiKey=PASSW</code>
     * </ol>
     * </p>
     * @param serverURL
     */
    private void handleHTMITUrl(Uri serverURL) {
        if (serverURL == null) {
            return;
        }
        String host = serverURL.getHost();
        if (host == null || !host.equalsIgnoreCase("m.numenta.com")) {
            return;
        }
        /*
         * https://m.numenta.com/htmit/login?serverUrl=hostname&apiKey=PASSW
         */
        String path = serverURL.getPath();
        if (path != null && path.equalsIgnoreCase("/htmit/login")) {
            String serverUrl = serverURL.getQueryParameter("serverUrl");
            String apiKey = serverURL.getQueryParameter("apiKey");
            if (!URLUtil.isHttpsUrl(serverUrl)) {
                // Try to guess the URL
                final String guessedUrl = URLUtil.guessUrl(serverUrl);
                if (URLUtil.isValidUrl(guessedUrl)) {
                    serverUrl = guessedUrl.toLowerCase(Locale.US);
                    if (URLUtil.isHttpUrl(serverUrl)) {
                        serverUrl = serverUrl.replaceFirst("http", "https");
                    }
                } else {
                    // Invalid URL
                    return;
                }
            }
            // Update preferences and start main activity
            final Editor prefs = PreferenceManager.getDefaultSharedPreferences(
                    getApplicationContext()).edit();
            prefs.putString(PreferencesConstants.PREF_SERVER_URL, serverUrl);
            prefs.putString(PreferencesConstants.PREF_PASSWORD, apiKey);
            prefs.apply();
        }
    }
}
