/**
 * API module - Creates circular dependency with core
 * ERROR 229: Circular dependency - api depends on core which depends on api
 */

const core = require('@monorepo/core');

class ApiClient {
    constructor(coreService) {
        this.name = 'API Client';
        // This creates the circular reference
        this.coreService = coreService || core.coreInstance;
        this.endpoints = {
            users: '/api/users',
            data: '/api/data',
            config: '/api/config'
        };
    }

    sendData(data) {
        console.log(`API sending data: ${JSON.stringify(data)}`);
        // Would normally make HTTP request here
        return {
            status: 'success',
            timestamp: new Date().toISOString(),
            data: data
        };
    }

    fetchFromCore() {
        // This call will create infinite recursion if not careful
        const coreVersion = this.coreService.getCoreVersion();
        return {
            apiVersion: '1.0.0',
            coreVersion: coreVersion,
            status: 'connected'
        };
    }
}

class ApiServer {
    constructor() {
        this.client = new ApiClient();
        this.routes = [];
    }

    start() {
        console.log('API Server starting...');
        // Would normally start express server here
        return this.client.fetchFromCore();
    }
}

module.exports = {
    ApiClient,
    ApiServer,
    apiInstance: new ApiServer()
};