var BlockEvaluators = {};
BlockEvaluators[BlockTypes.Input] = (currentBlock, moduleEvaluator) => {
    var inputIndex = moduleEvaluator.module.inputBlocks.findIndex(block => block.getId() == currentBlock.block.getId());
    if (inputIndex < 0) throw "Input not found. id: " + currentBlock.block.getId();

    return moduleEvaluator.inputs[inputIndex].value;
};

BlockEvaluators[BlockTypes.Module] = (currentBlock, moduleEvaluator) => {
    if (moduleEvaluator._hasLatestResult) {
        moduleEvaluator._hasLatestResult = false;
        return moduleEvaluator._latestResult;
    } else {
        throw "No result available when evaluating ModuleBlock";
    }
};

function _execute(string) {
    return eval(string);
}

BlockEvaluators[BlockTypes.JavaScript] = (currentBlock) => {
    /**
     * @type {JavascriptBlock}
     */
    var block = currentBlock.block;

    var scope = {};
    currentBlock.inputs.forEach(function (evaluationInput) {
        scope[evaluationInput.name] = evaluationInput.value;
    });

    return _execute.call(scope, block.script);
};

BlockEvaluators[BlockTypes.Operator] = (currentBlock) => {
    /**
     * @type {OperatorBlock}
     */
    var block = currentBlock.block;
    var operatorFunction = getOperator(block.operator);
    return operatorFunction(currentBlock.inputs[0].value, currentBlock.inputs[1].value);
};

BlockEvaluators[BlockTypes.DictionaryContains] = (currentBlock) => {
    var dict = currentBlock.inputs[0].value;
    return dict.hasOwnProperty(currentBlock.inputs[1].value);
};

BlockEvaluators[BlockTypes.DictionaryGet] = (currentBlock) => {
    var dict = currentBlock.inputs[0].value;
    return dict[currentBlock.inputs[1].value];
};

BlockEvaluators[BlockTypes.DictionaryInsert] = (currentBlock) => {
    var newDict = Object.assign({}, currentBlock.inputs[0].value);
    newDict[currentBlock.inputs[1].value] = currentBlock.inputs[2].value;
    return newDict;
};

BlockEvaluators[BlockTypes.DictionaryInitialize] = () => {
    return {};
};

BlockEvaluators[BlockTypes.If] = (currentBlock) => {
    var flag = currentBlock.inputs[0].value;
    /**
     * @type {EvaluationInput}
     */
    var resultInput;
    if (flag) {
        resultInput = currentBlock.inputs[1];
    } else {
        resultInput = currentBlock.inputs[2];
    }
    if (!resultInput.satisfied) throw "If block result not satisfied";
    return resultInput.value;
};

BlockEvaluators[BlockTypes.Create] = (currentBlock) => {
    var newObject = {};
    currentBlock.inputs.forEach(input => {
        newObject[input.name] = input.value;
    });
    return newObject;
};

BlockEvaluators[BlockTypes.Inherit] = (currentBlock) => {
    var inheritedObject = Object.create(currentBlock.inputs[0].value);
    currentBlock.inputs.slice(1).forEach(input => {
        inheritedObject[input.name] = input.value;
    });
    return inheritedObject;
};

function getEvaluator(blockType) {
    if (BlockEvaluators.hasOwnProperty(blockType)) {
        return BlockEvaluators[blockType];
    } else {
        throw "Block type has no evaluator: " + blockType;
    }
}