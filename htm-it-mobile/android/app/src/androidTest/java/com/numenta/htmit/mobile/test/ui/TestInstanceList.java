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
import android.content.SharedPreferences.Editor;
import android.preference.PreferenceManager;
import android.test.ActivityInstrumentationTestCase2;
import android.test.suitebuilder.annotation.LargeTest;
import android.test.suitebuilder.annotation.Suppress;

import com.numenta.htmit.mobile.HTMITApplication;
import com.numenta.htmit.mobile.instance.InstanceListActivity;
import com.numenta.htmit.mobile.mock.MockHTMClientWithData;
import com.numenta.htmit.mobile.service.HTMITClientImpl;
import com.numenta.core.utils.mock.MockHTMClientFactory;
import com.numenta.htmit.mobile.preference.PreferencesConstants;
import com.robotium.solo.Solo;

//FIXME: Robotioum UI tests are not working on headless jenkins emulator
@Suppress
public class TestInstanceList extends ActivityInstrumentationTestCase2<InstanceListActivity> {
    private Solo solo;

    public TestInstanceList() {
        super(InstanceListActivity.class);
    }

    @Override
    protected void setUp() throws Exception {
        super.setUp();
        Instrumentation instrumentation = getInstrumentation();
        MockHTMClientFactory factory = new MockHTMClientFactory(new MockHTMClientWithData(
                instrumentation.getContext(), HTMITClientImpl.SERVER_LATEST));
        HTMITApplication.getInstance().setClientFactory(factory);

        // Setup dummy prefs
        HTMITApplication.clearApplicationData(instrumentation.getTargetContext());

        Editor prefs = PreferenceManager
                .getDefaultSharedPreferences(instrumentation.getTargetContext()).edit();
        prefs.putString(PreferencesConstants.PREF_SERVER_URL, "https://localhost");
        prefs.putString(PreferencesConstants.PREF_PASSWORD, "passw");
        prefs.putBoolean(PreferencesConstants.PREF_SKIP_TUTORIAL, true);
        prefs.apply();
        HTMITApplication.stopServices();
        solo = new Solo(getInstrumentation(), getActivity());

    }

    @LargeTest
    public void testShowInstanceList() {
        assertTrue(solo.waitForActivity(InstanceListActivity.class, 1000));
    }

    @Override
    protected void tearDown() throws Exception {
        HTMITApplication.clearApplicationData(getInstrumentation().getTargetContext());
        solo.finishOpenedActivities();
        super.tearDown();
    }
}
