/**
 * The evaluator only runs once. It finds the leaf nodes, then evaluates each ancestor. Evaluated blocks
 * are stored by id in the evaluation result map.
 */
class Evaluator {
    constructor(program) {
        this.program = program;

        this.evaluationResults = {};
    }

    run() {
        var evaluator = this;
        var leafBlocks = this.program.topLevelModule.blocks.filter(function (block) {
            return evaluator.program.topLevelModule.getConnectionFromId(block.id) == undefined;
        });

        leafBlocks.forEach(function (block) {
            evaluator.getResult(block.id);
        })
    }

    evaluateBlock(block) {
        var evaluator = this;
        var inputs = block.getInputs();
        var module = block.getModule();
        var dependencies = [];
        _.each(inputs, function (input, index) {
            var connection = module.getConnectionToId(block.id, index);
            if (connection) {
                dependencies[index] = connection;
            } else {
                console.error("Missing input for block: " + block.name);
                console.log(block);
                throw new Error("Evaluation failed due to missing input");
            }
        });

        var inputValues = [];
        _.each(dependencies, function (connection, index) {
            inputValues[index] = evaluator.getResult(connection.fromBlockId);
        });

        var scope = {};
        _.each(inputValues, function (inputValue, index) {
            var input = inputs[index];
            scope[input.name] = inputValue;
        });

        return _execute.call(scope, block.getContents());
    }

    // gets the result of evaluating the block with id blockId
    getResult(blockId) {
        if (this.evaluationResults[blockId]) {
            return this.evaluationResults[blockId];
        } else {
            var block = this.program.topLevelModule.findBlock(blockId);
            if (!block) {
                throw new Error("Block with id " + blockId + " does not exist");
            }

            var result = this.evaluateBlock(block);
            this.evaluationResults[blockId] = result;
            return result;
        }
    }
}

function _execute(string) {
    return eval(string);
}