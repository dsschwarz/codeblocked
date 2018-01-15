class Input {
    constructor(name) {
        this.name = name;
        this.type = Type.untyped();
    }
}

class Type {
    constructor(name) {
        this.name = name;
    }

    /**
     * @returns {Type}
     */
    static untyped() {
        return new Type("Untyped"); // reserved name, todo: add checks elsewhere
    }
}

class Connection {
    constructor(fromBlockId, toBlockId, inputIndex) {
        this.fromBlockId = fromBlockId;
        this.toBlockId = toBlockId;
        this.inputIndex = inputIndex;
    }
}

class Module {
    constructor(name) {
        this.id = nextId();
        this.name = name;
        this.connections = [];
        this._blocks = [];
        this.inputs = [];
        this.output = Type.untyped(); // TODO infer type
        /**
         * @type {InputBlock[]}
         */
        this.inputBlocks = [];
        /**
         * @type {OutputBlock}
         */
        this.outputBlock = new OutputBlock();
    }

    /**
     * @returns {Array.<BaseBlock>}
     */
    allBlocks() {
        return this.inputBlocks.concat(this._blocks.concat(this.outputBlock));
    }

    /**
     * @param id {Number}
     * @returns {BaseBlock}
     */
    findBlock(id) {
        var blocks = this.allBlocks();
        for (var i=0; i<blocks.length; i++) {
            if (blocks[i].id === id) {
                return blocks[i];
            }
        }
    }

    addBlock(block) {
        this._blocks.push(block);
    }

    /**
     * Add an input to this module
     * @param input {Input}
     */
    addInput(input) {
        this.inputs.push(input);
        var inputBlock = new InputBlock(input.name, input.type, this._getNextInputBlockPosition());
        this.inputBlocks.push(inputBlock);
    }

    _getNextInputBlockPosition() {
        if (this.inputBlocks.length == 0) {
            return new BlockPosition(10, 10);
        } else {
            var lastBlockPosition = this.inputBlocks[this.inputBlocks.length - 1].getPosition();
            return new BlockPosition(lastBlockPosition.x + BLOCK_OFFSET, lastBlockPosition.y);
        }
    }

    getConnection(fromBlock, toBlock, inputIndex) {
        return _.findWhere(this.connections, {
            fromBlockId: fromBlock.id,
            toBlockId: toBlock.id,
            inputIndex: inputIndex
        });
    }

    getConnectionToId(toBlockId, inputIndex) {
        var result = _.findWhere(this.connections, {
            toBlockId: toBlockId,
            inputIndex: inputIndex
        });
        if (result == undefined) throw "Could not find connection to block " + toBlockId + " at index " + inputIndex;
        return result;
    }

    /**
     * @param fromBlockId {number}
     * @returns {Array.<Connection>}
     */
    getConnectionsFromId(fromBlockId) {
        return this.connections.filter(function (connection) {return connection.fromBlockId === fromBlockId});
    }

    createConnection(fromBlock, toBlock, inputIndex) {
        // if there's already an existing connection to this input, remove it
        var matchingConnections = _.where(this.connections, {
            toBlockId: toBlock.id,
            inputIndex: inputIndex
        });
        if (matchingConnections.length > 0) {
            this.removeConnections(matchingConnections);
        }

        var connection = new Connection(fromBlock.id, toBlock.id, inputIndex);
        this.connections.push(connection);
    }

    removeConnections(connections) {
        this.connections = _.difference(this.connections, connections);
    }
}

class Program {
    constructor() {
        this.topLevelModule = new Module("Root");
        /**
         * @type {Array<Module>}
         */
        this.modules = [];
        this.types = [];
    }

    /**
     * @param id {Number}
     * @returns {Module}
     */
    findBlueprint(id) {
        for (var i=0; i < this.modules.length; i++) {
            if (this.modules[i].id === id) {
                return this.modules[i];
            }
        }
    }

    /**
     * @returns {Module}
     */
    createNewModule() {
        var module = new Module("Unnamed");
        this.modules.push(module);
        return module;
    }
}