/**
 * Created by pengl on 7/6/2017.
 */

'use strict'

const WebDriverCommands = require('./WebdriverCommands');
const config = require('../config.json');
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

            var loginLocator = By.id('submit');
            WebDriverCommands.clickButton( driver, loginLocator, config.propelElementTimeout);

        } else {

            throw new Error("tenant ID ERROR in URL");
        }
    });
}

module.exports.takeScreenShot = function (driver, name) {

    driver.getCurrentUrl().then( function( str ){
        log.error(" => current new url is failed: " + str);
    });

    driver.takeScreenshot().then( function(image, err){
        var fullName = path.join(__dirname, "../images/", name+'.png');
        require('fs').writeFile( fullName, image, 'base64', function(err) {
            if( typeof err !== 'undefined' ) {
                log.error(err);
            }
        });
    });
}

module.exports.logInPropel = function (driver, server, urlName, account, password) {

    var timeout = config.propelElementTimeout;

    var validTimeout = config.propelValidLoadingTime;

    var propelUrl = server + ':9000/org/' + urlName;

    driver.manage().deleteAllCookies();

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
