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

package com.numenta.htmit.mobile.test.unit;

import com.numenta.htmit.mobile.HTMITApplication;
import com.numenta.htmit.mobile.SortOrder;
import com.numenta.htmit.mobile.service.HTMITClientImpl;
import com.numenta.core.utils.mock.MockHTMClient;
import com.numenta.core.utils.mock.MockHTMClientFactory;

import android.test.ApplicationTestCase;
import android.test.suitebuilder.annotation.SmallTest;

/**
 * TODO Document
 */
public class HTMITApplicationTest extends ApplicationTestCase<HTMITApplication> {

    public HTMITApplicationTest() {
        super(HTMITApplication.class);
    }

    @Override
    protected void setUp() throws Exception {
        super.setUp();
        createApplication();
        HTMITApplication.getInstance().setClientFactory(new MockHTMClientFactory(new MockHTMClient(
                HTMITClientImpl.SERVER_LATEST)));
        HTMITApplication.stopServices();
    }

    @Override
    protected void tearDown() throws Exception {
        super.tearDown();
    }

    /**
     * Test method for {@link HTMITApplication#getSort()}.
     */
    @SmallTest
    public final void testGetSort() {
        HTMITApplication.setSort(SortOrder.Name);
        assertEquals(SortOrder.Name, HTMITApplication.getSort());
    }

    /**
     * Test method for
     * {@link HTMITApplication#getMetricUnit(String)}.
     */
    @SmallTest
    public final void testGetMetricUnit() {
        assertEquals("Count", HTMITApplication.getMetricUnit("AWS/AutoScaling/GroupTotalInstances"));
        assertEquals("Count",
                HTMITApplication.getMetricUnit("AWS/DynamoDB/ConsumedReadCapacityUnits"));
        assertEquals("Count",
                HTMITApplication.getMetricUnit("AWS/DynamoDB/ConsumedWriteCapacityUnits"));
        assertEquals("Count", HTMITApplication.getMetricUnit("AWS/DynamoDB/ReturnedItemCount"));
        assertEquals("Milliseconds",
                HTMITApplication.getMetricUnit("AWS/DynamoDB/SuccessfulRequestLatency"));
        assertEquals("Bytes", HTMITApplication.getMetricUnit("AWS/EBS/VolumeQueueLength"));
        assertEquals("Bytes", HTMITApplication.getMetricUnit("AWS/EBS/VolumeReadBytes"));
        assertEquals("Seconds", HTMITApplication.getMetricUnit("AWS/EBS/VolumeTotalReadTime"));
        assertEquals("Seconds", HTMITApplication.getMetricUnit("AWS/EBS/VolumeTotalWriteTime"));
        assertEquals("Bytes", HTMITApplication.getMetricUnit("AWS/EBS/VolumeWriteBytes"));
        assertEquals("Percent", HTMITApplication.getMetricUnit("AWS/EC2/CPUUtilization"));
        assertEquals("Bytes", HTMITApplication.getMetricUnit("AWS/EC2/DiskReadBytes"));
        assertEquals("Bytes", HTMITApplication.getMetricUnit("AWS/EC2/DiskWriteBytes"));
        assertEquals("Bytes", HTMITApplication.getMetricUnit("AWS/EC2/NetworkIn"));
        assertEquals("Bytes", HTMITApplication.getMetricUnit("AWS/EC2/NetworkOut"));
        assertEquals("Percent", HTMITApplication.getMetricUnit("AWS/ElastiCache/CPUUtilization"));
        assertEquals("Bytes", HTMITApplication.getMetricUnit("AWS/ElastiCache/NetworkBytesIn"));
        assertEquals("Bytes", HTMITApplication.getMetricUnit("AWS/ElastiCache/NetworkBytesOut"));
        assertEquals("Seconds", HTMITApplication.getMetricUnit("AWS/ELB/Latency"));
        assertEquals("Count", HTMITApplication.getMetricUnit("AWS/ELB/RequestCount"));
        assertEquals("Percent", HTMITApplication.getMetricUnit("AWS/OpsWorks/cpu/idle"));
        assertEquals("Percent", HTMITApplication.getMetricUnit("AWS/OpsWorks/cpu/nice"));
        assertEquals("Percent", HTMITApplication.getMetricUnit("AWS/OpsWorks/cpu/system"));
        assertEquals("Percent", HTMITApplication.getMetricUnit("AWS/OpsWorks/cpu/user"));
        assertEquals("Percent", HTMITApplication.getMetricUnit("AWS/OpsWorks/cpu/waitio"));
        assertEquals("None", HTMITApplication.getMetricUnit("AWS/OpsWorks/load/5"));
        assertEquals("Percent", HTMITApplication.getMetricUnit("AWS/OpsWorks/memory/buffers"));
        assertEquals("Percent", HTMITApplication.getMetricUnit("AWS/OpsWorks/memory/cached"));
        assertEquals("Percent", HTMITApplication.getMetricUnit("AWS/OpsWorks/memory/free"));
        assertEquals("Percent", HTMITApplication.getMetricUnit("AWS/OpsWorks/memory/swap"));
        assertEquals("Percent", HTMITApplication.getMetricUnit("AWS/OpsWorks/memory/total"));
        assertEquals("Percent", HTMITApplication.getMetricUnit("AWS/OpsWorks/memory/used"));
        assertEquals("None", HTMITApplication.getMetricUnit("AWS/OpsWorks/procs"));
        assertEquals("Percent", HTMITApplication.getMetricUnit("AWS/RDS/CPUUtilization"));
        assertEquals("Count", HTMITApplication.getMetricUnit("AWS/RDS/DatabaseConnections"));
        assertEquals("Count", HTMITApplication.getMetricUnit("AWS/RDS/DiskQueueDepth"));
        assertEquals("Bytes", HTMITApplication.getMetricUnit("AWS/RDS/FreeableMemory"));
        assertEquals("Count/Second", HTMITApplication.getMetricUnit("AWS/RDS/ReadIOPS"));
        assertEquals("Seconds", HTMITApplication.getMetricUnit("AWS/RDS/ReadLatency"));
        assertEquals("Bytes/Second", HTMITApplication.getMetricUnit("AWS/RDS/ReadThroughput"));
        assertEquals("Bytes", HTMITApplication.getMetricUnit("AWS/RDS/SwapUsage"));
        assertEquals("Count/Second", HTMITApplication.getMetricUnit("AWS/RDS/WriteIOPS"));
        assertEquals("Seconds", HTMITApplication.getMetricUnit("AWS/RDS/WriteLatency"));
        assertEquals("Bytes/Second", HTMITApplication.getMetricUnit("AWS/RDS/WriteThroughput"));
        assertEquals("Count", HTMITApplication.getMetricUnit("AWS/Redshift/DatabaseConnections"));
        assertEquals("Count", HTMITApplication.getMetricUnit("AWS/SNS/NumberOfMessagesPublished"));
        assertEquals("Count", HTMITApplication.getMetricUnit("AWS/SQS/NumberOfEmptyReceives"));
        assertEquals("Count", HTMITApplication.getMetricUnit("AWS/SQS/NumberOfMessagesDeleted"));
        assertEquals("Count", HTMITApplication.getMetricUnit("AWS/SQS/NumberOfMessagesSent"));
        assertEquals("Count", HTMITApplication.getMetricUnit("AWS/SQS/NumberOfMessagesReceived"));
        assertEquals("Bytes", HTMITApplication.getMetricUnit("AWS/SQS/SentMessageSize"));
    }
}
