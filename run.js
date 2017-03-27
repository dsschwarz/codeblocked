class ExecutionMetadata {
    constructor(inputs, inputEvaluationResults, inputEvaluationCalls) {
        this.inputs = inputs;
        this.inputEvaluationResults = inputEvaluationResults;
        this.inputEvaluationCalls = inputEvaluationCalls;
    }

    getInputValue(input) {
        if (this.inputEvaluationResults[input.name] != undefined) {
            return this.inputEvaluationResults[input.name];
        } else {
            return this.inputEvaluationResults = this.inputEvaluationCalls[input.name]();
        }
    }
}


function execute(str) {
    eval(str); // str can be modified from eval code, but this shouldn't matter
}

function executeString(str, metadata) {
    var scope = buildScope(metadata);
    return execute.call(scope, str);
}

function buildScope(metadata) {
    var scope = {};
    metadata.inputs.forEach(function addInputParam(input) {
        scope[inputName] = metadata.getInputValue(input); // gets the precomputed value
    });
}