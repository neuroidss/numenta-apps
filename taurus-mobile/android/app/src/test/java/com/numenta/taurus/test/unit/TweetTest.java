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

package com.numenta.taurus.test.unit;

import com.numenta.taurus.data.Tweet;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

public class TweetTest {

    /** Tweet creation time, not rounded */
    static long CREATED_TS = 1430344079000l;

    /** Tweet aggregation time based on server time, not rounded */
    static long SERVER_AGGREGATED_TS = 1430344020000l;

    /** Tweet aggregation time floored to closest 5 min interval */
    static long EXPECTED_AGGREGATED_TS = 1430343900000l;

    Tweet _tweet;

    @Before
    public void setUp() throws Exception {
        // Regular tweet
        _tweet = new Tweet("id", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "text", 10);
    }


    @After
    public void tearDown() throws Exception {

    }

    @Test
    public void testGetCanonicalText() throws Exception {
        // Same text
        Tweet actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId2", "userName2", "text", 10);
        Assert.assertEquals(_tweet.getCanonicalText(), actual.getCanonicalText());

        // Remove Links
        actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "http://t.co/blah text https://t.co/blah", 10);
        Assert.assertEquals(_tweet.getCanonicalText(), actual.getCanonicalText());

        // Remove '...' from the end
        actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "text ...", 10);
        Assert.assertEquals(_tweet.getCanonicalText(), actual.getCanonicalText());

        // Remove "RT tags" from the beginning of the text
        actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "RT @blah  text", 10);
        Assert.assertEquals(_tweet.getCanonicalText(), actual.getCanonicalText());

        // RT from the beginning of the text up to colon in text
        actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "RT @blah @blah #blah $blah:  text", 10);
        Assert.assertEquals(_tweet.getCanonicalText(), actual.getCanonicalText());

        // Do not remove RT in the middle of the text
        actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "Blah RT @blah  text", 10);
        Assert.assertNotEquals(_tweet.getCanonicalText(), actual.getCanonicalText());

        // From left side – Remove @, #, $ tags up to last one
        actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "@tag1 @tag2 @tag text", 10);
        Assert.assertEquals("@tag text", actual.getCanonicalText());
        actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "#tag1 #tag2 #tag text", 10);
        Assert.assertEquals("#tag text", actual.getCanonicalText());
        actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "$tag1 $tag2 $tag text", 10);
        Assert.assertEquals("$tag text", actual.getCanonicalText());
        actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "#tag1 @tag2 $tag text", 10);
        Assert.assertEquals("$tag text", actual.getCanonicalText());

        // From right side – Remove @, #, $ when followed by letter, not a number
        actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "text @tag1 @tag2 @tag", 10);
        Assert.assertEquals("text", actual.getCanonicalText());
        actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "text #tag1 #tag2 #tag", 10);
        Assert.assertEquals("text", actual.getCanonicalText());
        actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "text $tag1 $tag2 $tag", 10);
        Assert.assertEquals("text", actual.getCanonicalText());
        actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "text #tag1 @tag2 $tag", 10);
        Assert.assertEquals("text", actual.getCanonicalText());
        actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "text $123.12 #tag1 @tag2 $tag", 10);
        Assert.assertEquals("text $123.12", actual.getCanonicalText());

        // All together
        actual = new Tweet("id2", SERVER_AGGREGATED_TS, CREATED_TS,
                "userId", "userName", "RT @blah #blah @tag2 @tag1 @tag text http://t.co/blah $123.12 #tag1 @tag2 $tag...", 10);
        Assert.assertEquals("@tag text $123.12", actual.getCanonicalText());

    }

    @Test
    public void testProperties() throws Exception {
        // Values from constructor
        Assert.assertEquals("id", _tweet.getId());
        Assert.assertEquals("text", _tweet.getText());
        Assert.assertEquals("userId", _tweet.getUserId());
        Assert.assertEquals("userName", _tweet.getUserName());
        Assert.assertEquals(EXPECTED_AGGREGATED_TS, _tweet.getAggregated());
        Assert.assertEquals(0, _tweet.getRetweetCount());
        Assert.assertEquals(0, _tweet.getAggregatedCount());
        Assert.assertEquals(10, _tweet.getRetweetTotal());
        Assert.assertEquals(CREATED_TS, _tweet.getCreated());

        // Update values
        _tweet.setAggregatedCount(2);
        Assert.assertEquals(2, _tweet.getAggregatedCount());
        _tweet.setRetweetCount(2);
        Assert.assertEquals(2, _tweet.getRetweetCount());
    }
}