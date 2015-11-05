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

package com.numenta.core.test.unit;

import com.numenta.core.app.HTMApplication;
import com.numenta.core.data.AggregationType;

import android.test.ApplicationTestCase;
import android.test.suitebuilder.annotation.SmallTest;

/**
 * TODO Document
 */
public class HTMApplicationTest extends ApplicationTestCase<HTMApplication> {

    public HTMApplicationTest() {
        super(HTMApplication.class);
    }

    @Override
    protected void setUp() throws Exception {
        super.setUp();
        createApplication();
    }

    @Override
    protected void tearDown() throws Exception {
        super.tearDown();
    }


    /**
     * Test method for {@link HTMApplication#getAggregation()}.
     */
    @SmallTest
    public final void testGetAggregation() {
        HTMApplication.setAggregation(AggregationType.Day);
        assertEquals(AggregationType.Day, HTMApplication.getAggregation());
    }

    /**
     * Test method for {@link HTMApplication#getContext()}.
     */
    @SmallTest
    public final void testGetContext() {
        assertNotNull(HTMApplication.getContext());
    }

}
