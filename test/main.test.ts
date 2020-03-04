// @ts-nocheck
import * as adapter from  './my-adapter'
import promisesAPlusTests from 'promises-aplus-tests'

describe("Promises/A+ Tests", function () {
    promisesAPlusTests.mocha(adapter);
});
