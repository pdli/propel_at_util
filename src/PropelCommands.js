/**
 * Created by pengl on 7/6/2017.
 */

'use strict'

const WebDriverCommands = require('./WebdriverCommands');
const config = require('../../config.json');
const path = require('path');
const By = require('selenium-webdriver').By;
const until = require('selenium-webdriver').until;
const WebElementPromise = require('selenium-webdriver').WebElementPromise;
const log = require('loglevel');

function dealWithInvalidLoginPropel( driver, urlName ) {

    driver.getCurrentUrl().then( function ( url ) {

        var subStr = "tenant=" + urlName.toLowerCase();
        url = url.toLowerCase();

        if( url.includes( subStr )) {

            log.info(" --> Retry to log in Propel again: " + urlName);
            var loginLocator = By.id('submit');
            WebDriverCommands.clickButton( driver, loginLocator, config.propelElementTimeout);

        } else {

            throw new Error("tenant ID ERROR in URL");
        }
    });
}

module.exports.removeSupplierPageShadowPanel = function( driver, timeout) {

    var cgBusyLocator = By.className('cg-busy-default-text ng-binding ng-scope');
    driver.wait(until.elementLocated( cgBusyLocator ), timeout);
    driver.wait(until.elementIsNotVisible( driver.findElement( cgBusyLocator)), timeout);
}

module.exports.getPropelUrl = function ( driver, urlLink ) {

    driver.get( urlLink );
    driver.navigate().refresh();
}

module.exports.takeScreenShot = function (driver, name) {

    driver.getCurrentUrl().then( function( str ){
        log.error(" => current new url is failed: " + str);
    });

    driver.takeScreenshot().then( function(image, err){
        var fullName = path.join(__dirname, "../../images/", name+'.png');
        require('fs').writeFile( fullName, image, 'base64', function(err) {
            if( typeof err !== 'undefined' ) {
                log.error(err);
            }
        });
    });
}

function goToLogInPage(driver, server, urlName) {

    var validTimeout = config.propelValidLoadingTime;

    var propelUrl = server + ':9000/org/' + urlName;

    //driver.manage().deleteAllCookies();

    driver.get( propelUrl );

    return driver.wait(until.urlContains("tenant=CONSUMER"), validTimeout).then(function () {

        log.info(" --> Oops, go to CONSUMER tenant. It will be replaced by : " + urlName);
        goToLogInPage( driver, server, urlName);
    }, function () {
        // URL of Propel Login is correct.
    });
}

module.exports.logInPropel = function(driver, server, urlName, account, password) {

    var timeout = config.propelElementTimeout;

    var validTimeout = config.propelValidLoadingTime;

    var promise = goToLogInPage( driver, server, urlName);

    return promise.then( function () {

        //Input
        var userLocator = By.id('username');
        WebDriverCommands.sendKeysToInputElement( driver, userLocator, account, timeout);

        var pwdLocator = By.id('password');
        WebDriverCommands.sendKeysToInputElement( driver, pwdLocator, password, timeout);

        var loginLocator = By.id('submit');
        WebDriverCommands.clickButton( driver, loginLocator, timeout);

        var invalidLocator = By.xpath('//span[contains(text(),"Invalid Username")]');
        driver.wait(until.elementLocated( invalidLocator), validTimeout).then( function () {

            dealWithInvalidLoginPropel( driver, urlName);
        }, function () {
            //
        });

        //Wait for MainPage
        driver.wait(until.urlContains('dashboard'), timeout).then( function(){

            log.debug(" => Login Propel Successfully: " + urlName);
        }, function() {

            throw new Error("***** ERROR: LogIn Propel " + urlName + "Failed. Please check the Account/Password/OTP *****");
        });

    });
}

module.exports.logInPropelWithoutConsumerCheck = function (driver, server, urlName, account, password) {

    var timeout = config.propelElementTimeout;

    var validTimeout = config.propelValidLoadingTime;

    var propelUrl = server + ':9000/org/' + urlName;

    //driver.manage().deleteAllCookies();

    var promise = driver.get( propelUrl );

    return promise.then( function () {

        driver.wait(until.titleContains('Sign In'), timeout);

        //Input
        var userLocator = By.id('username');
        WebDriverCommands.sendKeysToInputElement( driver, userLocator, account, timeout);

        var pwdLocator = By.id('password');
        WebDriverCommands.sendKeysToInputElement( driver, pwdLocator, password, timeout);

        var loginLocator = By.id('submit');
        WebDriverCommands.clickButton( driver, loginLocator, timeout);

        var invalidLocator = By.xpath('//span[text()="Invalid Username or Password"]');
        driver.wait(until.elementLocated( invalidLocator), validTimeout).then( function () {

            dealWithInvalidLoginPropel( driver, urlName);
        }, function () {
            //
        });

        //Wait for MainPage
        driver.wait(until.urlContains('dashboard'), timeout).then( function(){

            log.debug(" => Login Propel Successfully.");
        });
    });
}
