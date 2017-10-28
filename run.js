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
            if (result.completed()) {
                if (this.moduleEvaluators.length > 0) {
                    this.moduleEvaluators[this.moduleEvaluators.length - 1].setDependencyResult(result.outputValue);
                }
            } else {
                this.moduleEvaluators.push(evaluator);
                if (result.moduleDependency) {
                    this.moduleEvaluators.push(this._createModuleEvaluator(result.moduleDependency, result.inputs));
                }
            }
        }
    }

    _createModuleEvaluator(module, inputs) {
        return new ModuleEvaluator(module, inputs, this.reporter)
    }
}


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
    constructor(moduleDependency, inputs) {
        if (moduleDependency == undefined) {throw "Module dependency undefined"}
        this.moduleDependency = moduleDependency;
        this.inputs = inputs;
    }

    completed() {
        return false;
    }
}

function _partitionPendingAndReadyBlocks(evaluationBlocks) {
    return _.partition(evaluationBlocks, function (evaluationBlock) {
        return !evaluationBlock.ready()
    });
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

        // TODO only add blocks that are dependencies of the output block
        var evaluationBlocks = module.blocks.map(function (block) { return new EvaluationBlock(block)} );
        var pendingAndReadyBlocks = _partitionPendingAndReadyBlocks(evaluationBlocks);

        this.pendingBlocks = pendingAndReadyBlocks[0];
        this.readyBlocks = pendingAndReadyBlocks[1];

        // latest result is set externally. It is the result of evaluating the current dependency
        this._latestResult = undefined;
        this._hasLatestResult = false;
    }

    /**
     * @returns {ModuleEvaluatorResultCompleted | ModuleEvaluatorResultIncomplete | ModuleEvaluatorResultHasDependency}
     */
    runOnce() {
        var currentBlock = this.readyBlocks.pop();
        if (!currentBlock.ready()) {
            throw "Ready block is not ready"
        }

        if (currentBlock.block.getContents().isStringContents()) {
            var result = this.evaluateBlock(currentBlock);
            return this.broadcastResult(result, currentBlock.block);
        } else {
            if (this._hasLatestResult) {
                this._hasLatestResult = false;
                return this.broadcastResult(this._latestResult, currentBlock.block);
            } else {
                this.readyBlocks.push(currentBlock);
                var module = currentBlock.block.getContents().module;
                return new ModuleEvaluatorResultHasDependency(module, currentBlock.inputs);
            }
        }
    }

    /**
     * @param result {*}
     * @param fromBlock {Block}
     * @returns {ModuleEvaluatorResultCompleted | ModuleEvaluatorResultIncomplete}
     */
    broadcastResult(result, fromBlock) {
        var dependencies = {}; // quick lookup of dependent blocks
        this.module.getConnectionsFromId(fromBlock.id).forEach(function (connection) {
            dependencies[connection.toBlockId] = connection;
        });
        this.pendingBlocks.forEach(function (evaluationBlock) {
            var connection = dependencies[evaluationBlock.block.id];
            if (connection) {
                evaluationBlock.inputs[connection.inputIndex].setValue(result);
            }
        });

        var pendingAndReadyBlocks = _partitionPendingAndReadyBlocks(this.pendingBlocks);
        this.pendingBlocks = pendingAndReadyBlocks[0];
        this.readyBlocks.push.apply(this.readyBlocks, pendingAndReadyBlocks[1]);

        if (this.pendingBlocks.length == 0 && this.readyBlocks.length == 0) {
            // TODO add an explicit output block for every module
            return new ModuleEvaluatorResultCompleted(result);
        } else {
            if (this.readyBlocks.length == 0) {
                throw "Deadlock detected"
            }
            return new ModuleEvaluatorResultIncomplete();
        }
    }

    setDependencyResult(result) {
        if (this._hasLatestResult) {throw "Setting a new result before consuming the latest one"}

        this._latestResult = result;
        this._hasLatestResult = true;
    }

    /**
     * @param evaluationBlock {EvaluationBlock}
     * @returns {*}
     */
    evaluateBlock(evaluationBlock) {

        var scope = {};
        evaluationBlock.inputs.forEach(function (evaluationInput) {
            scope[evaluationInput.name] = evaluationInput.value;
        });

        return _execute.call(scope, evaluationBlock.block.getContents().value, this.reporter);
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
     * @param block {Block}
     */
    constructor(block) {
        /**
         * @type {Array<EvaluationInput>}
         */
        this.inputs = block.getInputs().map(function (input) {return new EvaluationInput(input)});
        this.block = block;
    }

    ready() {
        return _.every(this.inputs, function (input) { return input.satisfied === true })
    }
}

class EvaluationInput {
    /**
     * @param input {Input}
     */
    constructor(input) {
        this.name = input.name;
        this.value = undefined;
        this.satisfied = false;
    }

    setValue(value) {
        if (this.satisfied) {
            throw "Value already set for input " + this.name
        }

        this.value = value;
        this.satisfied = true;
    }
}