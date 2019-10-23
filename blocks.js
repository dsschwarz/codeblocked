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

    getId() {
        return this.id;
    }

    getName() {
        return this.module.name;
    }

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
    constructor(input, position) {
        super(
            BlockTypes.Output,
            position || new BlockPosition(500, 500));
        this.id = nextId();
        this.input = input || new Input("Value"); // TODO infer type
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

class PromptBlock extends BaseBlock {

    constructor(position, promptText) {
        super(BlockTypes.Prompt, position);
        this.id = nextId();
        this.promptText = promptText || "Enter a value";
    }

    getId() {
        return this.id;
    }

    getName() {
        return "Prompt";
    }

    getOutput() {
        return Type.untyped();
    }
}

class LoggerBlock extends BaseBlock {

    constructor(position) {
        super(BlockTypes.Logger, position);
        this.id = nextId();
        this.inputs = [
            new Input("value")
        ];
    }

    getId() {
        return this.id;
    }

    getName() {
        return "Logger";
    }

    getInputs() {
        return this.inputs;
    }

    getOutput() {
        return Type.untyped();
    }
}

class LiteralBlock extends BaseBlock {
    /**
     * @param position {BlockPosition}
     * @param literalType {LiteralTypes}
     * @param value optional
     */
    constructor(position, literalType, value) {
        super(BlockTypes.Literal, position);
        this.id = nextId();
        this.value = value;
        this.literalType = literalType;
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.value !== undefined ? this.value.toString() : "Not Set";
    }

    getValue() {
        return this.value;
    }
}

class TextBlock extends LiteralBlock {
    constructor(position, value) {
        super(position, LiteralTypes.String, value);
    }

    setValue(value) {
        this.value = value.toString();
    }

    getOutput() {
        return Type.untyped();
    }
}

class NumberBlock extends LiteralBlock {
    constructor(position, value) {
        super(position, LiteralTypes.Number, value);
    }

    setValue(value) {
        this.value = +value;
    }

    getOutput() {
        return Type.untyped();
    }
}

// for numeric operators
class OperatorBlock extends BaseBlock {
    constructor(operatorType, position) {
        super(BlockTypes.Operator, position);
        this.id = nextId();
        this.operator = operatorType;
        this.inputs = [
            new Input("a"),
            new Input("b")
        ]
    }

    getId() {
        return this.id;
    }

    getName() {
        if (this.operator == Operators.Multiply) {
            return "Multiply";
        } else if (this.operator == Operators.Divide) {
            return "Divide";
        } else if (this.operator == Operators.Add) {
            return "Add";
        } else if (this.operator == Operators.Subtract) {
            return "Subtract";
        } else if (this.operator == Operators.Exponent) {
            return "Exponent";
        } else if (this.operator == Operators.Equals) {
            return "Equals";
        } else if (this.operator == Operators.GreaterThan) {
            return "Greater";
        } else if (this.operator == Operators.LessThan) {
            return "Smaller";
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

class ObjectCreationBlock extends BaseBlock {
    constructor(position) {
        super(BlockTypes.Create, position);
        this.id = nextId();
        this.inputs = [];
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
        return "Struct"
    }

    createInput() {
        var inputs = this.getInputs();
        var newInput = new Input("field" + (inputs.length + 1));
        this.inputs.push(newInput);
    }
}

class ObjectInheritBlock extends BaseBlock {
    constructor(position) {
        super(BlockTypes.Inherit, position);
        this.id = nextId();
        this.inputs = [
            new Input("base")
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
        return "Inherit"
    }

    createInput() {
        var inputs = this.getInputs();
        var newInput = new Input("field" + (inputs.length + 1));
        this.inputs.push(newInput);
    }
}

class DictionaryInitializationBlock extends BaseBlock {
    constructor(position) {
        super(BlockTypes.DictionaryInitialize, position);
        this.id = nextId();
        this.inputs = [];
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
        return "Dictionary"
    }
}

class DictionaryInsertBlock extends BaseBlock {
    constructor(position) {
        super(BlockTypes.DictionaryInsert, position);
        this.id = nextId();
        this.inputs = [
            new Input("dictionary"),
            new Input("key"),
            new Input("value")
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
        return "Insert"
    }
}

class DictionaryGetBlock extends BaseBlock {
    constructor(position) {
        super(BlockTypes.DictionaryGet, position);
        this.id = nextId();
        this.inputs = [
            new Input("dictionary"),
            new Input("key")
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
        return "Get"
    }
}

class DictionaryContainsBlock extends BaseBlock {
    constructor(position) {
        super(BlockTypes.DictionaryContains, position);
        this.id = nextId();
        this.inputs = [
            new Input("dictionary"),
            new Input("key")
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
        return "Contains"
    }
}