class State {
    constructor() {
        this.program = new Program();

        this.modulePath = [new ModuleInfo(this.program.topLevelModule, "Root")];
        /**
         * @type {BaseBlock}
         */
        this.selectedBlock = null;
        this.mode = Modes.None;
        this.connectionHandler = new ConnectionHandler(this);
        this.reporter = new Reporter();

        this._listeners = {};
    }

    currentModule() {
        return this.currentModuleInfo().module;
    }

    currentModuleInfo() {
        return this.modulePath[this.modulePath.length - 1];
    }

    selectedBlockId() {
        if (this.selectedBlock) {
            return this.selectedBlock.id;
        } else {
            return null;
        }
    }

    trigger(topic) {
        if (this._listeners[topic]) {
            this._listeners[topic].forEach((callback) => callback());
        }
    }

    listen(topic, callback) {
        this._listeners[topic] = this._listeners[topic] || [];
        this._listeners[topic].push(callback);
    }

    listenMany(topics, callback) {
        topics.forEach(function (topic) {
            this.listen(topic, callback);
        }, this);
    }

    addModule(moduleInfo) {
        this.modulePath.push(moduleInfo);
        this.selectedBlock = null;
        this.trigger(ChangeTopics.SelectedBlock);
        this.trigger(ChangeTopics.ModulePath);
    }

    popToModule(index) {
        this.modulePath.splice(index + 1);
        this.trigger(ChangeTopics.ModulePath);
    }

    selectBlock(block) {
        this.selectedBlock = block;
        this.trigger(ChangeTopics.SelectedBlock);
    }

    setMode(mode) {
        this.mode = mode;
        this.trigger(ChangeTopics.Mode);
    }
}

class ModuleInfo {
    /**
     * @param module Module
     * @param name string
     */
    constructor(module, name) {
        this.module = module;
        this.name = name;
    }
}