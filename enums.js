var Modes = {
    Placement: "placement",
    Connection: "connection",
    None: "none"
};

var ChangeTopics = {
    Mode: "changeMode",
    Blocks: "blocks", // When a block is added, removed, or updated
    SelectedBlock: "selectedBlock", // When the selected block changes
    Connections: "connections", // when connections are added/removed
    Modules: "modules", // when a module definition changes
    ModulePath: "modulePath"
};

/**
 * @type {Object<string>}
 */
var BlockTypes = {
    Module: "module",
    // I/O
    Input: "input",
    Output: "output",

    Literal: "literal",
    Prompt: "prompt",
    Logger: "logger",

    // control flow
    If: "if",
    And: "and",

    // operators
    Operator: "operator",

    JavaScript: "javascript",
    // preview block when placing
    Ghost: "ghost",

    // Structs
    Create: "create",
    Inherit: "inherit",

    // Map related
    DictionaryInitialize: "dictionaryInitialize",
    DictionaryInsert: "dictionaryInsert",
    DictionaryContains: "dictionaryContains",
    DictionaryGet: "dictionaryGet",

    // unsupported
    BooleanOperator: "booleanOp"
};

var Operators = {
    Equals: "equals",
    GreaterThan: "greaterThan",
    LessThan: "lessThan",
    Multiply: "multiply",
    Divide: "divide",
    Add: "add",
    Subtract: "subtract",
    Exponent: "exponent",
};

var LiteralTypes = {
    String: "string",
    Number: "number"
};
