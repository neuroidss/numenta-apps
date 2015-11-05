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

package com.numenta.htmit.mobile.test.ui;

import android.app.Instrumentation;
import android.content.Intent;
import android.content.SharedPreferences.Editor;
import android.net.Uri;
import android.preference.PreferenceManager;
import android.test.ActivityInstrumentationTestCase2;
import android.test.suitebuilder.annotation.LargeTest;
import android.test.suitebuilder.annotation.Suppress;
import android.webkit.URLUtil;

import com.numenta.htmit.mobile.HTMITApplication;
import com.numenta.htmit.mobile.SplashScreenActivity;
import com.numenta.htmit.mobile.preference.PreferencesConstants;
import com.numenta.htmit.mobile.service.HTMITClientImpl;
import com.numenta.core.service.AuthenticationException;
import com.numenta.core.service.HTMClient;
import com.numenta.core.service.HTMException;
import com.numenta.core.utils.mock.MockHTMClient;
import com.numenta.core.utils.mock.MockHTMClientFactory;
import com.robotium.solo.Solo;

import java.io.IOException;
import java.net.MalformedURLException;

//FIXME: MER-2705 - Robotioum UI tests are not working on headless jenkins emulator
@Suppress
public class TestLogin extends ActivityInstrumentationTestCase2<SplashScreenActivity> {
    Solo _solo;
    static final String SERVER_URL = "https://localhost";
    static final String SERVER_PASS = "good";

    static class MockClientForLogin extends MockHTMClient {
        String _server;
        String _pass;
        MockHTMClientLoginFactory _factory;

        public MockClientForLogin(MockHTMClientLoginFactory factory, String server, String pass)
                throws MalformedURLException {
            super(HTMITClientImpl.SERVER_LATEST);
            // Parse URL
            if (!URLUtil.isHttpsUrl((server))) {
                throw new MalformedURLException("Invalid Server URL:" + server);
            }
            this._factory = factory;
            this._server = server;
            this._pass = pass;
        }

        @Override
        public void login() throws IOException, HTMException {

            // Check for valid server and pass
            if (!_factory.pass.equals(_pass) || !_factory.server.equals(_server)) {
                throw new AuthenticationException();
            }
        }
    }

    static final class MockHTMClientLoginFactory extends MockHTMClientFactory {

        // Mock valid server and password
        public final String server = SERVER_URL;
        public final String pass = SERVER_PASS;

        @Override
        public HTMClient createClient(String serverUrl, String password)
                throws MalformedURLException {
            return new MockClientForLogin(this, serverUrl, password);
        }
    }

    final MockHTMClientLoginFactory _clientFactory = new MockHTMClientLoginFactory();

    public TestLogin() {
        super(SplashScreenActivity.class);
    }

    @Override
    protected void setUp() throws Exception {
        super.setUp();

        Instrumentation instrumentation = getInstrumentation();
        HTMITApplication.clearApplicationData(instrumentation.getTargetContext());
        Editor prefs = PreferenceManager
                .getDefaultSharedPreferences(instrumentation.getTargetContext()).edit();
        prefs.remove(PreferencesConstants.PREF_SERVER_URL);
        prefs.remove(PreferencesConstants.PREF_PASSWORD);
        prefs.putBoolean(PreferencesConstants.PREF_SKIP_TUTORIAL, false);
        prefs.apply();

        HTMITApplication.getInstance().setClientFactory(_clientFactory);
        HTMITApplication.stopServices();

        _solo = null;
    }

    Solo getSolo() {
        if (_solo == null) {
            _solo = new Solo(getInstrumentation(), getActivity());
        }
        return _solo;
    }

    @LargeTest
    public void testSuccessfulLogin() {
        Solo solo = getSolo();
        // Enter the htmit server URL
        solo.clearEditText(0);
        solo.enterText(0, SERVER_URL);

        // Enter Password
        solo.clearEditText(1);
        solo.enterText(1, SERVER_PASS);

        // Click on Multiply button
        solo.clickOnButton("Sign in");

        // Verify that the user lands to the 'Tutorials' page
        assertTrue(solo.waitForActivity("TutorialActivity", 30000));
    }

    @LargeTest
    public void testInvalidUrl() {
        Solo solo = getSolo();

        // Enter the htmit server URL
        solo.clearEditText(0);
        solo.enterText(0, "test://invalid url");

        // Enter Password
        solo.clearEditText(1);
        solo.enterText(1, "bad");

        // Click on Multiply button
        solo.clickOnButton("Sign in");

        // Verify that the user lands back to the 'Login' page
        assertTrue(solo.waitForActivity("LoginActivity", 30000));
    }

    @LargeTest
    public void testFailedLogin() {
        Solo solo = getSolo();

        // Enter the htmit server URL
        solo.clearEditText(0);
        solo.enterText(0, "https://invalidserver");

        // Enter Password
        solo.clearEditText(1);
        solo.enterText(1, "bad");

        // Click on Multiply button
        solo.clickOnButton("Sign in");

        // Verify that the user lands back to the 'Login' page
        assertTrue(solo.waitForActivity("LoginActivity", 30000));
    }

    @LargeTest
    public void testSuccessfullLoginFromURL() {
        // TODO: Fixup reference to m.numenta.com re: TAUR-1045
        Uri loginUrl = Uri.parse("https://m.numenta.com/htmit/login?serverUrl=" + SERVER_URL
                + "&apiKey=" + SERVER_PASS);
        Intent intent = new Intent(Intent.ACTION_VIEW, loginUrl);
        setActivityIntent(intent);
        // Bypass the login page and wait for the tutorial page
        Solo solo = getSolo();
        assertTrue(solo.waitForActivity("TutorialActivity", 30000));
    }

    @LargeTest
    public void testFailedLoginFromURL() {
        // TODO: Fixup reference to m.numenta.com re: TAUR-1045
        Uri loginUrl = Uri
                .parse("https://m.numenta.com/htmit/login?serverUrl=invalid.url&apiKey=wrong");
        Intent intent = new Intent(Intent.ACTION_VIEW, loginUrl);
        setActivityIntent(intent);
        // Verify that the user lands back to the 'Login' page
        Solo solo = getSolo();
        assertTrue(solo.waitForActivity("LoginActivity", 30000));
    }

    @Override
    protected void tearDown() throws Exception {
        if (_solo != null) {
            _solo.finishOpenedActivities();
            _solo = null;
        }
        super.tearDown();
    }
}
