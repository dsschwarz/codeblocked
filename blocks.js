var DEFAULT_WIDTH = 100;
var DEFAULT_HEIGHT = 80;
var BLOCK_OFFSET = DEFAULT_WIDTH*2;
var IO_LINE_LENGTH = 5;

/**
 * @return {number}
 */
var nextId = (function () {
    var idCounter = 0;
    return function () {
        idCounter += 1;
        return idCounter;
    }
})();

class BlockHelpers {
    /**
     * @returns {{x: Number, y: Number}}
     */
    static getOutputPosition(block) {
        var position = block.getPosition();
        return {
            x: position.x + position.width/2,
            y: position.y + position.height + BlockHelpers.getIOLineLength()
        }
    }

    static getIOLineLength() {
        return IO_LINE_LENGTH;
    }


    /**
     * @returns {{x: Number, y: Number}}
     */
    static getInputPosition(block, index) {
        var inputs = block.getInputs();
        var position = block.getPosition();
        var dx = inputs.length == 0 ?
            0 :
            (index + 1)/(inputs.length + 1) * position.width;
        return {
            x: position.x + dx,
            y: position.y - BlockHelpers.getIOLineLength()
        }
    }
}

class BaseBlock {
    constructor(blockType, position) {
        this.position = position;
        this.blockType = blockType;
    }

    /**
     * @return {number}
     */
    getId() {
        throw "Not implemented"
    }

    getName() {
        return "";
    }

    getType() {
        return this.blockType;
    }

    /**
     * @returns {BlockPosition}
     */
    getPosition() {
        return this.position;
    }

    getInputs() {
        return [];
    }

    getOutput() {
        throw "Not implemented";
    }
}

class ModuleBlock extends BaseBlock {
    /**
     * @param module {Module}
     * @param position {BlockPosition}
     */
    constructor(module, position) {
        super(BlockTypes.Module, position);
        this.id = nextId();
        this.module = module;
    }

    /**
     * @param position {BlockPosition}
     * @returns {ModuleBlock}
     */
    static create(position) {
        var module = window.globalProgram.createNewModule();
        return new ModuleBlock(module, position);
    }

    // Shared methods
    getId() {
        return this.id;
    }

    // Shared methods
    getName() {
        return this.module.name;
    }

    // Shared methods
    /**
     * @returns {Array<Input>}
     */
    getInputs() {
        return this.module.inputs;
    }

    getOutput() {
        return this.module.output;
    }

    // Special methods
    /**
     * Change the name of this block's module
     * @param newName
     */
    setName(newName) {
        this.module.name = newName;
    }

    setBlueprint(module) {
        this.module = module;
    }

    createInput() {
        var inputs = this.getInputs();
        var newInput = new Input("input" + (inputs.length + 1));
        this.addInput(newInput);
    }

    addInput(input) {
        var module = this.module;
        module.addInput(input);
    }
}

class BlockPosition {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = DEFAULT_WIDTH;
        this.height = DEFAULT_HEIGHT;
    }
}

class GhostBlock extends BaseBlock {
    constructor(name, x, y) {
        super(
            BlockTypes.Ghost,
            new BlockPosition(x - DEFAULT_WIDTH/2, y - DEFAULT_HEIGHT/2)
        );
        this.name = name;
    }

    getName() {
        return this.name;
    }

    getOutput() {
        return undefined;
    }
}

class JavascriptBlock extends BaseBlock {
    constructor(name, position, inputs) {
        super(BlockTypes.JavaScript, position);
        this.name = name;
        this.id = nextId();
        this.inputs = inputs;
        this.output = Type.untyped();
        this.script = "";
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getInputs() {
        return this.inputs;
    }

    getOutput() {
        return this.output;
    }

    setScript(value) {
        this.script = value;
    }
}

class InputBlock extends BaseBlock {
    constructor(name, outputType, position) {
        super(BlockTypes.Input, position);
        this.name = name;
        this.id = nextId();
        this.output = outputType;
    }


    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getInputs() {
        return [];
    }

    getOutput() {
        return this.output;
    }
}

class OutputBlock extends BaseBlock {
    constructor(inputType, position) {
        super(
            BlockTypes.Output,
            position || new BlockPosition(500, 500));
        this.id = nextId();
        this.input = inputType || Type.untyped(); // TODO infer type
    }


    getId() {
        return this.id;
    }

    getName() {
        return "Output";
    }

    getInputs() {
        return [this.input];
    }

    getOutput() {
        return undefined;
    }
}

// for numeric operators
class OperatorBlock extends BaseBlock {
    constructor(blockType, position) {
        if (!_.contains(OperatorTypes, blockType)) throw "Block type " + blockType + " is not an operator";

        super(blockType, position);
        this.id = nextId();
        this.inputs = [
            new Input("a"),
            new Input("b")
        ]
    }

    getId() {
        return this.id;
    }

    getName() {
        if (this.getType() == BlockTypes.Multiply) {
            return "Multiply";
        } else if (this.getType() == BlockTypes.Divide) {
            return "Divide";
        } else if (this.getType() == BlockTypes.Add) {
            return "Add";
        } else if (this.getType() == BlockTypes.Subtract) {
            return "Subtract";
        } else if (this.getType() == BlockTypes.Exponent) {
            return "Exponent";
        } else if (this.getType() == BlockTypes.Equals) {
            return "Equals";
        } else {
            throw "Block type " + this.blockType + " has no defined display name";
        }
    }

    getInputs() {
        return this.inputs;
    }

    getOutput() {
        return Type.untyped(); // todo should be a number
    }
}

class IfBlock extends BaseBlock {
    constructor(position) {
        super(BlockTypes.If, position);
        this.id = nextId();
        this.inputs = [
            new Input("Flag"),
            new Input("If True"),
            new Input("If False")
        ];
    }

    getId() {
        return this.id;
    }

    getInputs() {
        return this.inputs;
    }

    getOutput() {
        return Type.untyped();
    }

    getName() {
        return "If"
    }
}