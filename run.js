class ProgramEvaluator {
    constructor(program, reporter) {
        this.program = program;
        this.reporter = reporter;

        // implicit assumption: every evaluator in this list is a dependency of the previous evaluator
        // Order is VERY important
        this.moduleEvaluators = [this._createModuleEvaluator(program.topLevelModule, [])];
    }

    run() {
        while (this.moduleEvaluators.length > 0) {
            var evaluator = this.moduleEvaluators.pop();
            var result = evaluator.runOnce();

            // if this block has finished evaluating, set the result on its dependency
            if (result.completed() && !result.moduleDependency) {
                if (this.moduleEvaluators.length > 0) {
                    this.moduleEvaluators[this.moduleEvaluators.length - 1].setDependencyResult(result.outputValue);
                }
            }

            // If a result is not completed, it should go back in the queue
            if (!result.completed()) {
                this.moduleEvaluators.push(evaluator);
            }

            // if the current module depends on another module, add that to the front of the queue
            if (result.moduleDependency) {
                this.moduleEvaluators.push(this._createModuleEvaluator(result.moduleDependency, result.inputs));
            }
        }
    }

    _createModuleEvaluator(module, inputs) {
        return new ModuleEvaluator(module, inputs, this.reporter)
    }
}

// The three result classes. completed flag means module no longer needs to be evaluated
class ModuleEvaluatorResultCompleted {
    constructor(outputValue) {
        this.outputValue = outputValue;
    }

    completed() {
        return true;
    }
}
class ModuleEvaluatorResultIncomplete {
    completed() {
        return false;
    }
}
class ModuleEvaluatorResultHasDependency {
    constructor(moduleDependency, inputs, isFinalBlock) {
        if (moduleDependency == undefined) {throw "Module dependency undefined"}
        this.moduleDependency = moduleDependency;
        this.inputs = inputs;
        this.isFinalBlock = isFinalBlock;
    }

    completed() {
        return this.isFinalBlock;
    }
}

class ModuleEvaluator {
    /**
     * @param module {Module}
     * @param inputs {Array<EvaluationInput>}
     * @param reporter {Reporter}
     */
    constructor(module, inputs, reporter) {
        this.module = module;
        this.inputs = inputs;
        this.reporter = reporter;

        var allBlocks = module.allBlocks().map(function (block) {
            return new EvaluationBlock(block)
        });

        /**
         * The block currently being evaluated
         * @type {EvaluationBlock}
         */
        this.currentBlock = null;
        // Blocks that are ready to be evaluated
        this.readyBlocks = new BlockCollection();
        // Blocks that need to be evaluated, but have unevaluated dependencies
        this.pendingBlocks = new BlockCollection();
        // the blocks that are not currently depended on by the OutputBlock
        this.reserve = new BlockCollection();
        this.reserve.addBlocks(allBlocks);

        // All the blocks in the ready, pending, and reserve pools
        this.allBlocks = new BlockCollection();
        this.allBlocks.addBlocks(allBlocks);

        var outputBlockId = this.outputBlockId();
        this.buildDependencyTree(outputBlockId);

        // output block must be in pending or ready. remove it
        this.removeFromReadyOrPending(outputBlockId);

        // latest result is set externally. It is the result of evaluating the current dependency
        this._latestResult = undefined;
        this._hasLatestResult = false;
    }

    /**
     * @returns {ModuleEvaluatorResultCompleted | ModuleEvaluatorResultIncomplete | ModuleEvaluatorResultHasDependency}
     */
    runOnce() {
        if (!this.currentBlock) {
            this.currentBlock = this.readyBlocks.popBlock();
        }

        if (!this.currentBlock.ready()) {
            throw "Ready block is not ready"
        }

        var evaluatorResult = this.runOnceInternal(this.currentBlock);
        if (!evaluatorResult.moduleDependency) {
            this.allBlocks.removeBlock(this.currentBlock.block.getId());
            this.currentBlock = null;
        }
        return evaluatorResult;
    }

    /**
     * @param currentBlock {EvaluationBlock}
     * @returns {ModuleEvaluatorResultCompleted | ModuleEvaluatorResultIncomplete | ModuleEvaluatorResultHasDependency}
     */
    runOnceInternal(currentBlock) {
        var blockType = currentBlock.block.getType();
        if (blockType == BlockTypes.JavaScript) {
            var result = this.evaluateJavascriptBlock(currentBlock);
            return this.broadcastResult(result, currentBlock.block);
        } else if (blockType == BlockTypes.Module) {
            /**
             * @type {ModuleBlock}
             */
            var block = currentBlock.block;
            if (this._hasLatestResult) {
                this._hasLatestResult = false;
                return this.broadcastResult(this._latestResult, block);
            } else {
                var module = block.module;
                var isFinalBlock = this.isComplete();
                return new ModuleEvaluatorResultHasDependency(module, currentBlock.inputs,isFinalBlock);
            }
        } else if (_.contains(OperatorTypes, blockType)) {
            var operatorFunction = getOperator(blockType);
            var value = operatorFunction(currentBlock.inputs[0].value, currentBlock.inputs[1].value);
            return this.broadcastResult(value, currentBlock.block);
        } else {
            // add handling for other types
            throw "Unrecognized type " + blockType;
        }
    }

    outputBlockId() {
        return this.module.outputBlock.getId();
    }

    /**
     * @param result {*}
     * @param fromBlock {BaseBlock}
     * @returns {ModuleEvaluatorResultCompleted | ModuleEvaluatorResultIncomplete}
     */
    broadcastResult(result, fromBlock) {
        var connections = this.module.getConnectionsFromId(fromBlock.getId())
            .filter(connection => connection.toBlockId != this.outputBlockId());
        connections.forEach(connection => {
            var toBlockId = connection.toBlockId;
            /**
             * @type {EvaluationBlock}
             */
            var toBlock = this.pendingBlocks.findBlock(toBlockId) || this.reserve.getBlock(toBlockId);
            toBlock.inputs[connection.inputIndex].setValue(result);
        });
        _.chain(connections)
            .map(connection => connection.toBlockId)
            .uniq()
            .each(toBlockId => this.buildDependencyTree(toBlockId) );

        if (this.isComplete()) {
            return new ModuleEvaluatorResultCompleted(result);
        } else {
            if (this.readyBlocks.getSize() == 0) {
                throw "Deadlock detected"
            }
            return new ModuleEvaluatorResultIncomplete();
        }
    }

    isComplete() {
        return this.pendingBlocks.getSize() == 0 && this.readyBlocks.getSize() == 0
    }

    setDependencyResult(result) {
        if (this._hasLatestResult) {
            throw "Setting a new result before consuming the latest one"
        }

        this._latestResult = result;
        this._hasLatestResult = true;
    }

    /**
     * @param evaluationBlock {EvaluationBlock}
     * @returns {*}
     */
    evaluateJavascriptBlock(evaluationBlock) {

        var scope = {};
        evaluationBlock.inputs.forEach(function (evaluationInput) {
            scope[evaluationInput.name] = evaluationInput.value;
        });

        return _execute.call(scope, evaluationBlock.block.script, this.reporter);
    }

    /**
     * @param rootBlockId {number}
     */
    buildDependencyTree(rootBlockId) {
        var that = this;
        /**
         * Block ids that have been processed already
         * @type {Object.<number, boolean>}
         */
        var evaluated = {};

        /**
         * @param currentBlockId {number}
         */
        function recursiveBuildTree(currentBlockId) {
            // can end if already evaluated dependencies for this block
            if (evaluated[currentBlockId]) return;
            // blocks in ready pool have no more dependencies
            if (that.readyBlocks.containsBlock(currentBlockId)) return;

            // mark block as evaluated
            evaluated[currentBlockId] = true;

            var currentBlock = that.allBlocks.getBlock(currentBlockId);
            var dependencies = that.getDependencies(currentBlock);
            if (dependencies.length == 0) {
                that.removeFromPendingOrReserve(currentBlockId);
                that.readyBlocks.addBlock(currentBlock);
            } else {
                if (!that.pendingBlocks.containsBlock(currentBlockId)) {
                    that.reserve.removeBlock(currentBlockId);
                    that.pendingBlocks.addBlock(currentBlock);
                }
                dependencies.forEach((blockId) => {
                    recursiveBuildTree(blockId)
                });
            }
        }
        recursiveBuildTree(rootBlockId);
    }

    removeFromPendingOrReserve(blockId) {
        if (this.pendingBlocks.containsBlock(blockId)) {
            this.pendingBlocks.removeBlock(blockId);
        } else {
            // note: throws error if block does not exist here either
            this.reserve.removeBlock(blockId);
        }
    }

    removeFromReadyOrPending(blockId) {
        if (this.readyBlocks.containsBlock(blockId)) {
            this.readyBlocks.removeBlock(blockId);
        } else {
            // note: throws error if block does not exist here either
            this.pendingBlocks.removeBlock(blockId);
        }
    }

    /**
     * @param evaluationBlock {EvaluationBlock}
     * @return {number[]}
     */
    getDependencies(evaluationBlock) {
        // if (evaluationBlock.block.getType() == BlockTypes.Module) {
            return evaluationBlock.inputs
                .filter((input) => !input.satisfied)
                .map((input)  => this.module.getConnectionToId(evaluationBlock.block.getId(), input.index))
                .map((connection) => connection.fromBlockId);
        // }
    }
}

function _execute(string, reporter) {
    var error = reporter.error.bind(reporter);
    var warn = reporter.warn.bind(reporter);
    var log = reporter.log.bind(reporter);
    return eval(string);
}

class Message {
    constructor(type, message) {
        this.messageType = type;
        this.message = message;
    }
}

class Reporter {
    constructor() {
        this.listeners = [];
        this.messages = [];
    }

    error(message) {
        console.error(message);
        this.messages.push(new Message("error", message));
        this._notify();
    }

    warn(message) {
        this.messages.push(new Message("warn", message));
        this._notify();
    }

    log(message) {
        this.messages.push(new Message("log", message));
        this._notify();
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    _notify() {
        this.listeners.forEach((fn) => fn.call());
    }
}

class EvaluationBlock {
    /**
     * @param block {BaseBlock}
     */
    constructor(block) {
        /**
         * @type {Array<EvaluationInput>}
         */
        this.inputs = block.getInputs().map(function (input, index) {return new EvaluationInput(input, index)});
        this.block = block;
    }

    ready() {
        return _.every(this.inputs, function (input) { return input.satisfied === true })
    }
}

class EvaluationInput {
    /**
     * @param input {Input}
     * @param index {number}
     */
    constructor(input, index) {
        this.name = input.name;
        this.value = undefined;
        this.satisfied = false;
        this.index = index;
    }

    setValue(value) {
        if (this.satisfied) {
            throw "Value already set for input " + this.name
        }

        this.value = value;
        this.satisfied = true;
    }
}

class BlockCollection {
    constructor() {
        /**
         * @type {Object.<number, EvaluationBlock>}
         */
        this._blocks = {};
    }

    getSize() {
        return Object.keys(this._blocks).length;
    }

    /**
     * @param block {EvaluationBlock}
     */
    addBlock(block) {
        this._blocks[block.block.getId()] = block;
    }

    /**
     * @param blocks {EvaluationBlock[]}
     */
    addBlocks(blocks) {
        blocks.forEach(block => this.addBlock(block));
    }

    /**
     * @param blockId {number}
     * @return {boolean}
     */
    containsBlock(blockId) {
        return this._blocks[blockId] != undefined;
    }

    /**
     * @param blockId {number}
     * @return {EvaluationBlock}
     */
    getBlock(blockId) {
        var block = this.findBlock(blockId);
        if (block == undefined) throw new Error("Block id does not exist in collection: " + blockId);
        return block;
    }

    /**
     * @param blockId {number}
     * @return {EvaluationBlock}
     */
    findBlock(blockId) {
        return this._blocks[blockId];
    }

    /**
     * Remove and return a block from this collection
     */
    popBlock() {
        var key = Object.keys(this._blocks)[0];
        return this.removeBlock(key);
    }

    /**
     * @param blockId {number}
     *
     */
    removeBlock(blockId) {
        var block = this.getBlock(blockId);
        delete this._blocks[blockId];
        return block;
    }
}