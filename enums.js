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
    Blueprints: "blueprints", // when a blueprint definition changes
    ModulePath: "modulePath"
};

var BlockTypes = {
    Normal: "normie",
    If: "if",
    And: "and",
    Ghost: "ghost", // preview block when placing
    BooleanOperator: "booleanOp",
    Assign: "assign",
    Combine: "combine",
    Literal: "literal",
    Prompt: "prompt"
};