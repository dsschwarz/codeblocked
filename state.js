class State {
    constructor() {
        this.program = new Program();
        this._setStateForNewProgram();
        this.reporter = new Reporter();

        this._listeners = {};
    }

    /**
     * @returns {Module}
     */
    currentModule() {
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

    /**
     * @param module {Module}
     */
    addModule(module) {
        this.modulePath.push(module);
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

    setProgram(program) {
        if (this.program === program) {
            return;
        }

        this.program = program;
        this._setStateForNewProgram();
        this.trigger(ChangeTopics.Blocks);
        this.trigger(ChangeTopics.Mode);
        this.trigger(ChangeTopics.SelectedBlock);
        this.trigger(ChangeTopics.Connections);
        this.trigger(ChangeTopics.Modules);
        this.trigger(ChangeTopics.ModulePath);
    }

    _setStateForNewProgram(){
        this.modulePath = [this.program.topLevelModule];
        this.selectedBlock = null;
        this.mode = Modes.None;
        this.connectionHandler = new ConnectionHandler(this);
    }
}