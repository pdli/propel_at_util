/**
 * Created by pengl on 7/6/2017.
 */

'use strict'

const WebDriverCommands = require('./WebdriverCommands');
const config = require('../../config/config.json');
const path = require('path');
const By = require('selenium-webdriver').By;
const until = require('selenium-webdriver').until;
const WebElementPromise = require('selenium-webdriver').WebElementPromise;

const TIMEOUT = config.propelElementTimeout;
//Replace logLevel with log4js
const log4js = require('log4js');
log4js.configure("./config/log4js.json");
const log = log4js.getLogger();

function dealWithInvalidLoginPropel( driver, urlName ) {

    driver.getCurrentUrl().then( function ( url ) {

        var subStr = "tenant=" + urlName.toLowerCase();
        url = url.toLowerCase();

        if( url.includes( subStr )) {

            log.info(" --> Retry to Log in Propel with Tenant: " + urlName);
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

module.exports.getPropelUrl = function ( driver, urlLink, timeout = TIMEOUT ) {

    driver.get( urlLink );
    driver.navigate().refresh();

    this.waitPageLoading( driver, timeout );
}

module.exports.takeScreenShot = function (driver, name) {

    driver.getCurrentUrl().then( function( str ){
        log.info(" => The current URL: " + str);
    });

    driver.takeScreenshot().then( function(image, err){

        var date = new Date();
        var str = '0'+ (date.getMonth() +1 ).toString() + '0' + date.getDate().toString() + '_' + date.getHours().toString() + date.getMinutes().toString();
        var fullName = path.join(__dirname, "../../images/", name+ '_' + str + '.png');
        require('fs').writeFile( fullName, image, 'base64', function(err) {
            if( typeof err !== 'undefined' ) {
                log.info(err);
            }
        });
    });
}

module.exports.tearDown = function( driver, webPromise ) {

    driver.quit();
    webPromise.cancel();
}


function goToLogInPage(driver, server, urlName) {

    var validTimeout = config.propelValidLoadingTime;

    var propelUrl = server + ':9000/org/' + urlName;

    //driver.manage().deleteAllCookies();

    driver.get( propelUrl );

    return driver.wait(until.urlContains("tenant=CONSUMER"), validTimeout).then(function () {

        log.info(" --> Oops, go to CONSUMER tenant. It will be replaced by Tenant: " + urlName);
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
        driver.wait(until.urlContains('dashboard'), timeout - validTimeout).then( function(){

            log.debug(" => Login Propel Successfully with Tenant: " + urlName);
        }, function() {

            var webPageCheckLocator = By.linkText('RETURN TO HOME');
            driver.findElements( webPageCheckLocator ).then( function ( elements ) {

                if( elements.length >0 ) {

                    throw new Error("***** ERROR: LogIn Propel " + urlName + " Failed. Propel Service Unavailable, please re-run it. *****");
                } else {

                    throw new Error("***** ERROR: LogIn Propel " + urlName + " Failed. Maybe you need to check the Account/Password/OTP. *****");
                }

            });
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

            log.debug(" => Login Propel Successfully with Tenant: " + urlName);
        });
    });
}

//This function is NOT common, is still under test
module.exports.waitPageLoading = function ( driver, timeout ) {

    //wait for page loading
    var progressLocator = By.id('loading-bar-spinner');
    WebDriverCommands.waitElementStaleness( driver, progressLocator, timeout);

    var loadingBarLocator = By.id('loading-bar');
    WebDriverCommands.waitElementStaleness( driver, loadingBarLocator, timeout);
}

module.exports.select_default_language = function( driver ) {

    var langLocator = By.xpath('//h3[text()="Select Default Language"]');
    driver.findElements( langLocator ).then( function ( elements ) {

        if( elements.length >0 ){

            WebDriverCommands.clickButton( driver, By.id('submit'), TIMEOUT);
        }
    });
}

module.exports.markCfgCatalogProcessAsCompleted = function (tenantID ) {

    var file = path.resolve(__dirname, '../../file/resumeRun.json');

    var json = {};

    require('selenium-webdriver/io').read( file )
        .then( function ( buffer ) {

            json = JSON.parse( buffer );

            if( tenantID !== json.tenantID || json.tenantID === undefined || json.resumeStep === undefined ){

                json.tenantID = tenantID;
                json.resumeStep = 1;
            } else {

                json.tenantID = tenantID;
                json.resumeStep = json.resumeStep + 1;
            }
        })
        .then( function () {

            require('selenium-webdriver/io').write(file, JSON.stringify( json ));
        });
}

module.exports.clearCfgCatalogProcessMark = function () {

    var file = path.resolve(__dirname, '../../file/resumeRun.json');

    var json = {};
    json.tenantID = "";
    json.resumeStep = 0;
    return require('selenium-webdriver/io').write(file, JSON.stringify( json ))
        .then( function () {

            log.info('==> Clear process mark for configCatalog. Every step of configCatalog will be re-run if needed...');
        });
}

module.exports.waitLoadingPanelDisappear = function ( driver, timeout) {

    var cgBusyLocator = By.className('cg-busy-default-text ng-binding ng-scope');
    driver.wait(until.elementLocated( cgBusyLocator ), timeout);
    driver.wait(until.elementIsNotVisible( driver.findElement( cgBusyLocator)), timeout);
}

module.exports.tearDown = function ( driver, promise ){

    driver.quit();

    promise.cancel();
}
