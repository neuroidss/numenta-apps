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

package taurustest;

import java.net.URL;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.testng.AssertJUnit;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Parameters;
import org.testng.annotations.Test;

public class TaurusMobileAppTest {
    private WebDriver driver;
    static int WAIT_TIME = 100;
    static By ALL = By.name("ALL");
    static By FAVORITES = By.name("FAVORITES");
    static By ADD_FAVORITE_POP_UP = By.id("android:id/title");
    static By REMOVE_FAVORITE_POP_UP =By.name("Remove Favorite");
    static By DATE = By.id("com.numenta.taurus:id/date");
    static By CHECKBOX = By.id("com.numenta.taurus:id/market_hours_checkbox");
    static By TWITTER_VOLUME = By.name("Twitter Volume");
    static By LABEL_DETAIL = By.id("com.numenta.taurus:id/caption");
    static By LABEL_STOCKPRICE = By.name("Stock Price");
    static By LABEL_STOCKVOLUME = By.name("Stock Volume");
    static By LABEL_TWITTERVOLUME = By.name("Twitter Volume");
    static By LABEL_TWITTER = By.name("Twitter");
    static By BUTTON_ON_TUTORIAL_PAGE =By.id("com.numenta.taurus:id/tutorial_button_right");
    static By END_BUTTON_ON_TUTORIAL_PAGE = By.name("END");
    static By EXPECTED_COMPANY_NAME = By.id("com.numenta.taurus:id/ticker");
    static By EXPECTED_COMPANY_NAME_FOR_FAVORITE = By.id("com.numenta.taurus:id/ticker");

    @BeforeClass
    @Parameters({"deviceName", "version", "sauceUserName", "sauceAccessKey"})
    public void setUp(String deviceName,String platformVersion, String
        sauceUserName, String sauceAccessKey) throws Exception {
        DesiredCapabilities capabilities = new DesiredCapabilities();
        capabilities.setCapability("name", "Taurus mobile Testing");
        capabilities.setCapability("app", "sauce-storage:taur-app-release.apk");
        capabilities.setCapability("platformName", "Android");
        capabilities.setCapability("device-orientation", "portrait");
        capabilities.setCapability("deviceName", deviceName);
        capabilities.setCapability("platformVersion", platformVersion);
        capabilities.setCapability("androidPackage","com.numenta.taurus");
        capabilities.setCapability("appActivity",
          "com.numenta.taurus.SplashScreenActivity");
        driver = new RemoteWebDriver(new URL("http://"+sauceUserName+":"+
          sauceAccessKey+"@ondemand.saucelabs.com:80/wd/hub"), capabilities);
    }


    @Test(priority = 0)
    @Parameters({"deviceName", "version","sauceUserName","sauceAccessKey"})
    public void skipTutorial()
        throws InterruptedException {
        // SKIP TUTORIAL
        String startBtn =TestUtilities.waitGetText(BUTTON_ON_TUTORIAL_PAGE, driver,WAIT_TIME);
        AssertJUnit.assertEquals(startBtn, "START");
        // Swipe
        TestUtilities.swipe(driver, true);
        TestUtilities.swipe(driver, true);
        TestUtilities.swipe(driver, true);
        TestUtilities.swipe(driver, true);
        TestUtilities.swipe(driver, true);
        // Exit Tutorial
        String endButton =TestUtilities.waitGetText(END_BUTTON_ON_TUTORIAL_PAGE, driver, WAIT_TIME);
        AssertJUnit.assertEquals(endButton, "END");
        TestUtilities.waitClick(END_BUTTON_ON_TUTORIAL_PAGE, driver, WAIT_TIME);
    }


    @Test(priority = 1 , dependsOnMethods = {"skipTutorial"})
    public void addFavourites()
        throws InterruptedException {
        // Long press on any company name
        TestUtilities.waitClick(FAVORITES, driver, WAIT_TIME);
        TestUtilities.waitClick(ALL, driver, WAIT_TIME);
        String test = TestUtilities.waitGetText(EXPECTED_COMPANY_NAME, driver, WAIT_TIME);
        TestUtilities.longPressOnCompanyName(driver);
        // Add favorite pop-up
        String ADD_FAVORITE =TestUtilities.waitGetText(ADD_FAVORITE_POP_UP, driver, WAIT_TIME);
        AssertJUnit.assertEquals(ADD_FAVORITE, "Add Favorite");
        TestUtilities.waitClick(ADD_FAVORITE_POP_UP, driver, WAIT_TIME);
        TestUtilities.waitClick(FAVORITES, driver, WAIT_TIME);
        // Verify company get added in favorite
        String favorite = TestUtilities.waitGetText(EXPECTED_COMPANY_NAME_FOR_FAVORITE, driver, WAIT_TIME);
        AssertJUnit.assertEquals(test,favorite);
    }


    @Test(priority = 2 , dependsOnMethods = {"addFavourites"})
    public void removeFavourites()
        throws InterruptedException {
            TestUtilities.waitClick(FAVORITES, driver, WAIT_TIME);
            //Removing company from Favorites list
            TestUtilities.longPressOnCompanyName(driver);
            String REMOVE_FAVORITE =TestUtilities.waitGetText(REMOVE_FAVORITE_POP_UP, driver, WAIT_TIME);
            AssertJUnit.assertEquals(REMOVE_FAVORITE, "Remove Favorite");
            TestUtilities.waitClick(REMOVE_FAVORITE_POP_UP, driver, WAIT_TIME);
            TestUtilities.waitClick(ALL, driver, WAIT_TIME);
            TestUtilities.waitClick(FAVORITES, driver, WAIT_TIME);
            // Verify same company get deleted from favorite tab
            Integer isPresent = driver.findElements(By.id("com.numenta.taurus:id/ticker")).size();
            if(isPresent != 0) {
                AssertJUnit.assertTrue("Deletion happens successfuly!", isPresent != 0 );
            }
            else {
                AssertJUnit.assertTrue("Deletion does not happens successfuly!", isPresent == 0 );
            }
        }


    @Test(priority = 3 , dependsOnMethods = {"removeFavourites"})
    public void clickOnCompanyName() throws InterruptedException {
        TestUtilities.waitClick(ALL, driver, WAIT_TIME);
        TestUtilities.waitClick(EXPECTED_COMPANY_NAME, driver, WAIT_TIME);
        TestUtilities.waitClick(CHECKBOX, driver,WAIT_TIME);
        // Verify company entering in Company Detail page
        String details = TestUtilities.waitGetText(LABEL_DETAIL, driver, WAIT_TIME);
        String checkboxString = TestUtilities.waitGetText(CHECKBOX, driver, WAIT_TIME);
        AssertJUnit.assertEquals(checkboxString,"Show Market Hours Only");
        AssertJUnit.assertEquals(details,"tap for details");
        TestUtilities.waitClick(CHECKBOX, driver,WAIT_TIME);
        TestUtilities.waitClick(DATE, driver,WAIT_TIME);
    }


    @Test(priority = 4 , dependsOnMethods = {"clickOnCompanyName"})
    public void settings() throws InterruptedException {
        // Clicking on Settings option
        TestUtilities.clickFeedback(driver, WAIT_TIME);
        TestUtilities.clickSettingOptionAndChangeSettings(driver, WAIT_TIME);
        TestUtilities.clickAbout(driver, WAIT_TIME);
        TestUtilities.clickShare(driver, WAIT_TIME);
    }


    @AfterClass
    public void tearDown() throws Exception {
        driver.quit();
    }
}
