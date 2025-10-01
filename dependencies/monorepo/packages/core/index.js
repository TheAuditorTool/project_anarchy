/**
 * Core module - Part of circular dependency chain
 * ERROR 227: Circular dependency - core depends on api
 */

const api = require('@monorepo/api');

class CoreService {
    constructor() {
        this.name = 'Core Service';
        this.apiClient = null;
    }

    initialize() {
        // Creates circular reference when api module loads this
        this.apiClient = new api.ApiClient(this);
        console.log('Core service initialized with API client');
    }

    processData(data) {
        console.log(`Processing data in ${this.name}`);
        if (this.apiClient) {
            return this.apiClient.sendData(data);
        }
        return data;
    }

    getCoreVersion() {
        return '1.0.0';
    }
}

module.exports = {
    CoreService,
    coreInstance: new CoreService()
};