var DEFAULT_WIDTH = 100;
var DEFAULT_HEIGHT = 80;
var IO_LINE_LENGTH = 5;
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
    constructor() {
    }

    getId() {
        throw "Not implemented"
    }

    getName() {
        return "";
    }

    getType() {
        throw "Not implemented";
    }

    getPosition() {
        throw "Not implemented";
    }

    getInputs() {
        return [];
    }

    getOutput() {
        throw "Not implemented";
    }
}

class BlueprintInstance extends BaseBlock {
    /**
     * @param blueprint {BlockBlueprint}
     * @param position {BlockPosition}
     */
    constructor(blueprint, position) {
        super();
        this.id = nextId();
        this.position = position;
        this.blueprint = blueprint;
    }

    /**
     * @param x {Number}
     * @param y {Number}
     * @returns {BlueprintInstance}
     */
    static create(x, y) {
        var blueprint = window.globalProgram.createEmptyBlueprint();
        var position = new BlockPosition(x, y);
        return new BlueprintInstance(blueprint, position);
    }

    // Shared methods
    getId() {
        return this.id;
    }

    // Shared methods
    getName() {
        return this.blueprint.name;
    }

    getType() {
        return BlockTypes.Normal;
    }


    // Shared methods
    getPosition() {
        return this.position;
    }

    /**
     * @returns {Array<Input>}
     */
    getInputs() {
        return this.blueprint.inputs;
    }

    getOutput() {
        return this.blueprint.output;
    }

    // Special methods
    /**
     * Change the name of this block's blueprint
     * @param newName
     */
    setName(newName) {
        this.blueprint.name = newName;
    }

    setBlueprint(blueprint) {
        this.blueprint = blueprint;
    }

    createInput() {
        var inputs = this.getInputs();
        var newInput = new Input("input" + (inputs.length + 1));
        this.addInput(newInput);
    }

    addInput(input) {
        var blueprint = this.blueprint;
        blueprint.inputs.push(input);
    }

    getContents() {
        return this.blueprint.contents;
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

class BlockBlueprint {
    constructor(name) {
        this.id = nextId();
        this.name = name;

        this.inputs = [];

        this.output = Type.untyped();

        // contents is either javascript text, or a Module
        this.contents = ModuleContents.create();
    }

    /**
     * @returns {BlockBlueprint}
     */
    static create() {
        var name = "Unnamed"; // todo get unique name
        return new BlockBlueprint(name);
    }

    setContents(newValue) {
        var contents = this.contents;
        if (contents.isStringContents()) {
            contents.value = newValue;
        } else {
            throw "Cannot set string value for blueprint contents"
        }
    }

    setContentsTypeString(isString) {
        if (isString) {
            this.contents = new StringContents();
        } else {
            this.contents = ModuleContents.create();
        }
    }
}

class StringContents {
    constructor() {
        this.value = "";
    }

    isStringContents() {
        return true;
    }
}

class ModuleContents {
    constructor(module) {
        this.module = module;
    }

    isStringContents() {
        return false;
    }

    static create() {
        return new ModuleContents(new Module());
    }
}

class GhostBlock extends BaseBlock {
    constructor(name, x, y) {
        super();
        this.position = new BlockPosition(x - DEFAULT_WIDTH/2, y - DEFAULT_HEIGHT/2);
        this.name = name;
    }

    getName() {
        return this.name;
    }

    getType() {
        return BlockTypes.Ghost;
    }

    getPosition() {
        return this.position;
    }

    getOutput() {
        return undefined;
    }
}