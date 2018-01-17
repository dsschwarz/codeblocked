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

var BlockTypes = {
    Module: "module",
    // I/O
    Input: "input",
    Output: "output",

    // control flow
    If: "if",
    And: "and",

    // operators
    Equals: "equals",
    Multiply: "multiply",
    Divide: "divide",
    Add: "add",
    Subtract: "subtract",
    Exponent: "exponent",

    JavaScript: "javascript",
    // preview block when placing
    Ghost: "ghost",

    // unsupported
    BooleanOperator: "booleanOp",
    Assign: "assign",
    Combine: "combine",
    Literal: "literal",
    Prompt: "prompt"
};

var OperatorTypes = [
    BlockTypes.Equals,
    BlockTypes.Multiply,
    BlockTypes.Divide,
    BlockTypes.Add,
    BlockTypes.Subtract,
    BlockTypes.Exponent
];
