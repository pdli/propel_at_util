/**
 * Created by pengl on 6/12/2017.
 */

//import library
const webdriver = require('selenium-webdriver');
const io = require('selenium-webdriver/io');
const capabilities = require('selenium-webdriver/lib/capabilities');
const BrowserType = capabilities.Browser;
const proxy = require('selenium-webdriver/proxy');
const path = require('path');

//chrome
const chromeCapabilities = webdriver.Capabilities.chrome();
chromeCapabilities.set(
        'chromeOptions', {
            'args': ['--test-type', '--proxy-server=web-proxy.houston.hpecorp.net:8080']
        });

//Chrome-Headless (chrome-driver >= 2.30, chrome >= 59.0)
const chromeHeadlessCapabilities = webdriver.Capabilities.chrome();
chromeHeadlessCapabilities.set(
        'chromeOptions', {
            'args': ['--headless','--disable-gpu', '--proxy-server=web-proxy.houston.hpecorp.net:8080']
        });

//phantomJS
var phantomJSCapabilities = webdriver.Capabilities.phantomjs();
phantomJSCapabilities.set("phantomjs.binary.path", require('phantomjs-prebuilt').path);

//phantomJS with Class B certificate
const crtFile = path.resolve(__dirname, '../../cert/cert.pem');
const keyFile = path.resolve(__dirname, '../../cert/key.pem');
var phantomJSWithCertCapabilities = webdriver.Capabilities.phantomjs();
phantomJSWithCertCapabilities.set("phantomjs.binary.path", require('phantomjs-prebuilt').path);
phantomJSWithCertCapabilities.set(
        'phantomjs.cli.args', [
            '--web-security=no',
            '--ssl-protocol=any',
            '--ignore-ssl-errors=true',
            '--ssl-client-certificate-file='+crtFile,
            '--ssl-client-key-file='+keyFile,
            '--ssl-client-key-passphrase=hpe@1234'
        ]);

var builder, driver;

function createChromeHeadlessDriver() {

    builder = new webdriver.Builder()
            .forBrowser('chrome')
            .withCapabilities( chromeHeadlessCapabilities );

    driver = builder.build();
}

function createChromeDriver(){

    builder = new webdriver.Builder()
            .forBrowser('chrome')
            .withCapabilities( chromeCapabilities );

    driver = builder.build();
}

function createPhantomJsDriver(){

    builder = new webdriver.Builder()
            .forBrowser('phantomjs')
            .withCapabilities( phantomJSCapabilities );

    driver = builder.build();
    driver.manage().window().setSize(800, 600);
}

function createPhantomJsWithCertDriver(){

    builder = new webdriver.Builder()
            .forBrowser('phantomjs')
            .withCapabilities( phantomJSWithCertCapabilities );

    driver = builder.build();
    driver.manage().window().setSize(800, 600);
}

function buildWebDriver(browser ) {
    switch(browser) {
        case BrowserType.CHROME:
            return createChromeDriver();
        case BrowserType.PHANTOM_JS:
            return createPhantomJsDriver();
        case 'phantomJsC':
            return createPhantomJsWithCertDriver();
        case 'chromeHeadless':
            return createChromeHeadlessDriver();
        default:
            throw new Error('Do not know how to build driver: ' + browser
            + '; BrowserType type is NOT supported.');
    }
}

function WebDriverFactory( browser ) {

    buildWebDriver( browser );
    this.builder = builder;
    this.driver = driver;

}

module.exports = WebDriverFactory;