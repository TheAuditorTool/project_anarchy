/**
 * UI module - Depends on core which has circular dependency
 * ERROR 228: Part of circular dependency chain
 */

const core = require('@monorepo/core');

class UIComponent {
    constructor() {
        this.name = 'UI Component';
        this.coreService = core.coreInstance;
    }

    render() {
        console.log(`Rendering ${this.name}`);
        const version = this.coreService.getCoreVersion();
        return `
            <div>
                <h1>UI Component</h1>
                <p>Core Version: ${version}</p>
                <p>Status: Active</p>
            </div>
        `;
    }

    handleUserInput(input) {
        console.log(`UI received input: ${input}`);
        return this.coreService.processData(input);
    }
}

module.exports = {
    UIComponent,
    uiInstance: new UIComponent()
};