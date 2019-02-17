/**
 * @param position {BlockPosition}
 */
function _serializePosition(position) {
    return {
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
    }
}
function _deserializePosition(positionPayload) {
    var position = new BlockPosition(positionPayload.x, positionPayload.y);
    position.width = positionPayload.width;
    position.height = positionPayload.height;
}

/**
 * @param input {Input}
 */
function _serializeInput(input) {
    return {
        name: input.name,
        type: input.type.name
    }
}
function _deserializeInput(inputPayload) {
    var input = new Input(inputPayload.name);
    input.type = new Type(inputPayload.type);

    return input;
}

/**
 * @type {Object<string, BlockConverter>}
 */
var conversions = {
    [BlockTypes.Module]: new BlockConverter(
        /**
         * @param block {ModuleBlock}
         */
        function serialize(block) {
            return {
                moduleId: block.module.id,
                id: block.id,
                position: _serializePosition(block.position)
            }
        },
        function deserialize(payload, moduleMap) {
            var module = moduleMap[payload.moduleId];
            if (!module) {
                throw new Error("Module not found " + payload.moduleId);
            }
            var block = new ModuleBlock(module, _deserializePosition(payload.position));
            block.id = payload.id;
            return block;
        }
    ),
    [BlockTypes.JavaScript]: new BlockConverter(
        function serialize(block) {
            return {
                name: block.name,
                id: block.id,
                inputs: block.inputs.map(_serializeInput),
                script: block.script,
                position: _serializePosition(block.position),
            }
        },
        function deserialize(payload) {
            var block = new JavascriptBlock(
                payload.name,
                _deserializePosition(payload.position),
                payload.inputs.map(_deserializeInput)
            );
            block.script = payload.script;
            block.id = payload.id;
        }
    ),
    [BlockTypes.Input]: new BlockConverter(
        function serialize(block) {
            return {
                name: block.name,
                id: block.id,
                output: block.output.name,
                position: _serializePosition(block.position),
            }
        },
        function deserialize(payload) {
            var block = new InputBlock(payload.name, new Type(payload.output), _deserializePosition(payload.position));
            block.id = payload.id;
            return block;
        }
    ),
    [BlockTypes.Output]: new BlockConverter(
        function serialize(block) {
            return {
                id: block.id,
                input: _serializeInput(block.input),
                position: _serializePosition(block.position)
            }
        },
        function deserialize(payload) {
            var block = new OutputBlock(_deserializeInput(payload.input), _deserializePosition(payload.position));
            block.id = payload.id;
            return block;
        }
    ),
    [BlockTypes.Prompt]: new BlockConverter(
        function serialize(block) {
            return {
                id: block.id,
                position: _serializePosition(block.position),
                promptText: block.promptText
            }
        },
        function deserialize(payload) {
            var block = new PromptBlock(_deserializePosition(payload.position), payload.promptText);
            block.id = payload.id;
            return block;
        }
    ),
    [BlockTypes.Logger]: new BlockConverter(
        function serialize(block) {
            return {
                id: block.id,
                position: _serializePosition(block.position)
            }
        },
        function deserialize(payload) {
            var block = new LoggerBlock(_deserializePosition(payload.position));
            block.id = payload.id;
            return block;
        }
    ),
    [BlockTypes.Literal]: new BlockConverter(
        function serialize(block) {
            return {
                id: block.id,
                position: _serializePosition(block.position),
                value: block.value,
                literalType: block.literalType
            }
        },
        function deserialize(payload) {
            var block;
            if (payload.literalType === LiteralTypes.Number) {
                block = new NumberBlock(_deserializePosition(payload.position), payload.value)
            } else {
                block = new TextBlock(_deserializePosition(payload.position), payload.value)
            }
            block.id = payload.id;
            return block;
        }
    ),
    [BlockTypes.Operator]: new BlockConverter(
        function serialize(block) {
            return {
                id: block.id,
                position: _serializePosition(block.position),
                operator: block.operator
            }
        },
        function deserialize(payload) {
            var block = new OperatorBlock(payload.operator, _deserializePosition(payload.position));
            block.id = payload.id;
            return block;
        }
    ),
    [BlockTypes.If]: new BlockConverter(
        function serialize(block) {
            return {
                id: block.id,
                position: _serializePosition(block.position)
            }
        },
        function deserialize(payload) {
            var block = new IfBlock(_deserializePosition(payload.position));
            block.id = payload.id;
            return block;
        }
    ),
    [BlockTypes.Create]: new BlockConverter(
        function serialize(block) {
            return {
                id: block.id,
                position: _serializePosition(block.position),
                inputs: block.inputs.map(_serializeInput)
            }
        },
        function deserialize(payload) {
            var block = new ObjectCreationBlock(_deserializePosition(payload.position));
            block.id = payload.id;
            block.inputs = payload.inputs.map(_deserializeInput);
            return block;
        }
    ),
    [BlockTypes.Inherit]: new BlockConverter(
        function serialize(block) {
            return {
                id: block.id,
                position: _serializePosition(block.position),
                inputs: block.inputs.map(_serializeInput)
            }
        },
        function deserialize(payload) {
            var block = new ObjectInheritBlock(_deserializePosition(payload.position));
            block.id = payload.id;
            block.inputs = payload.inputs.map(_deserializeInput);
            return block;
        }
    ),
    [BlockTypes.DictionaryInitialize]: new BlockConverter(
        function serialize(block) {
            return {
                id: block.id,
                position: _serializePosition(block.position)
            }
        },
        function deserialize(payload) {
            var block = new DictionaryInitializationBlock(_deserializePosition(payload.position));
            block.id = payload.id;
            return block;
        }
    ),
    [BlockTypes.DictionaryInsert]: new BlockConverter(
        function serialize(block) {
            return {
                id: block.id,
                position: _serializePosition(block.position)
            }
        },
        function deserialize(payload) {
            var block = new DictionaryInsertBlock(_deserializePosition(payload.position));
            block.id = payload.id;
            return block;
        }
    ),
    [BlockTypes.DictionaryGet]: new BlockConverter(
        function serialize(block) {
            return {
                id: block.id,
                position: _serializePosition(block.position)
            }
        },
        function deserialize(payload) {
            var block = new DictionaryGetBlock(_deserializePosition(payload.position));
            block.id = payload.id;
            return block;
        }
    ),
    [BlockTypes.DictionaryContains]: new BlockConverter(
        function serialize(block) {
            return {
                id: block.id,
                position: _serializePosition(block.position)
            }
        },
        function deserialize(payload) {
            var block = new DictionaryContainsBlock(_deserializePosition(payload.position));
            block.id = payload.id;
            return block;
        }
    )
};

class BlockConverter {

    /**
     * @param serializer {function<BaseBlock, string>}
     * @param deserializer {function<string, Object{string: Module}, BaseBlock>}
     */
    constructor(serializer, deserializer) {
        /**
         * @type {Function.<BaseBlock, string>}
         */
        this.serializer = serializer;
        /**
         * @type {Function.<string, Object{string: Module}, BaseBlock>}
         */
        this.deserializer = deserializer;
    }
}

/**
 * @param blockType
 * @returns {BlockConverter}
 */
function _getConverter(blockType) {
    var converter = conversions[blockType];
    if (!converter) {
        throw new Error("No converter defined for " + blockType);
    } else {
        return converter;
    }
}

/**
 * @param block {BaseBlock}
 */
function serialize(block) {
    var blockType = block.blockType;
    var converter = _getConverter(block.blockType);
    var serializer = converter.serializer;
    var payload = serializer(block);

    return JSON.stringify({
        blockType,
        payload
    })
}


/**
 * @param serializedBlock {string}
 * @param moduleMap
 * @return BaseBlock
 */
function deserialize(serializedBlock, moduleMap) {
    var parsed = JSON.parse(serializedBlock);
    var type = parsed.blockType;
    var converter = _getConverter(type);
    var deserialized = converter.deserializer(parsed.payload, moduleMap);
    if (deserialized.blockType != type) {
        throw new Error("Deserialized block did not have correct type. Expected: " + type + " Actual: " + deserialized.blockType)
    }
    return deserialized;
}


class HalfDeserializedModule {

    /**
     * @param serializedBlocks {Array<string>}
     * @param module {Module}
     */
    constructor(serializedBlocks, module) {
        this.serializedBlocks = serializedBlocks;
        this.module = module;
    }
}

/**
 * @param connection {Connection}
 * @return string
 */
function serializeConnection(connection) {
    return JSON.stringify({
        fromBlockId: connection.fromBlockId,
        toBlockId: connection.toBlockId,
        inputIndex: connection.inputIndex
    });
}

/**
 * @param serializedConnection {string}
 * @return Connection
 */
function deserializeConnection(serializedConnection) {
    var parsed = JSON.parse(serializedConnection);
    return new Connection(parsed.fromBlockId, parsed.toBlockId, parsed.inputIndex);
}

/**
 * @param module {Module}
 * @return string
 */
function serializeModule(module) {
    return JSON.stringify({
        id: module.id,
        serializedBlocks: module.blocks().map(serialize),
        connections: module.connections.map(serializeConnection),
        inputs: module.inputs.map(i => {
            return _serializeInput(i);
        })
    })
}

/**
 * @param serializedModule {string}
 * @return HalfDeserializedModule
 */
function desializeModule(serializedModule) {
    var parsed = JSON.parse(serializedModule);
    var module = new Module(parsed.name);
    module.id = parsed.id;

    module.connections = parsed.connections.map((c) => {
        return deserializeConnection(c);
    });
    parsed.inputs.forEach((i) => {
        var input = _deserializeInput(i);

        module.addInput(input);
    });

    return new HalfDeserializedModule(parsed.serializedBlocks, module)
}
/**
 * @param halfDeserializedModule {HalfDeserializedModule}
 * @param moduleMap {{string: Module}}
 * @return Module
 */
function deserializeModuleBlocks(halfDeserializedModule, moduleMap) {
    halfDeserializedModule.serializedBlocks.forEach((serializedBlock) => {
        var block = deserialize(serializedBlock, moduleMap);
        halfDeserializedModule.module.addBlock(block);
    });

    return halfDeserializedModule.module;
}

/**
 * @param program {Program}
 */
function serializeProgram(program) {
    return JSON.stringify({
        modules: program.modules.map((m) => serializeModule(m)),
        types: program.types.map((t) => t.name)
    })
}
function desializeProgram(serializedProgram) {
    var parsed = JSON.parse(serializedProgram);
    /**
     * @type {Array<HalfDeserializedModule>}
     */
    var halfDeserializedModules = parsed.modules.map(desializeModule);

    /**
     * @type {{string: Module}}
     */
    var lookupMap = {};
    halfDeserializedModules.forEach(hdModule => lookupMap[hdModule.module.id] = hdModule.module);

    var modules = halfDeserializedModules.map(hdModule => deserializeModuleBlocks(hdModule, lookupMap));

    var program = new Program();
    program.modules = modules;
    program.types = parsed.types.map((typeName) => new Type(typeName));

    return program;
}
