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
    JavaScript: "javascript",
    Input: "input",
    Output: "output",
    If: "if",
    And: "and",
    Ghost: "ghost", // preview block when placing
    BooleanOperator: "booleanOp",
    Multiply: "multiply",
    Assign: "assign",
    Combine: "combine",
    Literal: "literal",
    Prompt: "prompt"
};

var OperatorTypes = [
    BlockTypes.Multiply
];