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
        this.blocks = [];
        this.inputs = [];
        this.output = Type.untyped(); // TODO infer type
        this.inputBlocks = [];
        this.outputBlock = new OutputBlock();
    }

    /**
     * @param id {Number}
     * @returns {BaseBlock}
     */
    findBlock(id) {
        for (var i=0; i<this.blocks.length; i++) {
            if (this.blocks[i].id === id) {
                return this.blocks[i];
            }
        }
    }

    addBlock(block) {
        this.blocks.push(block);
    }

    getConnection(fromBlock, toBlock, inputIndex) {
        return _.findWhere(this.connections, {
            fromBlockId: fromBlock.id,
            toBlockId: toBlock.id,
            inputIndex: inputIndex
        });
    }

    getConnectionToId(toBlockId, inputIndex) {
        return _.findWhere(this.connections, {
            toBlockId: toBlockId,
            inputIndex: inputIndex
        });
    }

    /**
     * @param fromBlockId {string}
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