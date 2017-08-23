/**
 * Created by pengl on 7/6/2017.
 * Description:
 *    1) re-load some commands to match the slow Propel System
 *    2) improve performance of Automation Tool
 */

'use strict'

const By = require('selenium-webdriver').By;
const until = require('selenium-webdriver').until;
const KeyBoard = require('selenium-webdriver').Key;

const log = require('loglevel');

module.exports.sendKeysToInputElement = function (driver, locator, keys, timeout) {

    // log.debug('Send keys to input element, locator: ' + locator + ', keys: ' + keys);
    driver.wait(until.elementLocated(locator), timeout);
    driver.wait(until.elementIsVisible(driver.findElement(locator)), timeout);
    driver.wait(until.elementIsEnabled(driver.findElement(locator)), timeout);
    driver.findElement(locator).clear();
    driver.findElement(locator).sendKeys(keys);
}

module.exports.resendKeysToInputElement = function (driver, locator, keys, timeout) {

    log.debug(" -> **Function of resend Keys is called ** <- ");
    driver.wait(until.elementLocated(locator), timeout);
    driver.wait(until.elementIsVisible(driver.findElement(locator)), timeout);
    driver.wait(until.elementIsEnabled(driver.findElement(locator)), timeout);
    driver.findElement(locator).clear();
    driver.findElement(locator).sendKeys(keys);
}

module.exports.clickButton = function (driver, locator, timeout) {

    driver.wait(until.elementLocated(locator), timeout);
    driver.wait(until.elementIsVisible(driver.findElement(locator)), timeout);
    driver.wait(until.elementIsEnabled(driver.findElement(locator)), timeout);
    driver.findElement(locator).click();
}

module.exports.waitElementAvailable = function (driver, locator, timeout) {

    driver.wait(until.elementLocated(locator), timeout);
    driver.wait(until.elementIsVisible(driver.findElement(locator)), timeout);
    driver.wait(until.elementIsEnabled(driver.findElement(locator)), timeout);
}

module.exports.waitElementStaleness = function (driver, locator, timeout){

    //in case the element staleness ahead
    driver.findElements( locator ).then( function( elements) {

        if( elements.length > 0) {

            driver.wait( until.stalenessOf( elements[0]), timeout);
        }
    });
}