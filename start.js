$(function () {
    console.log("Starting app");
    var state  = new State();
    window.globalProgram = state.program;

   objectCreationExample(state);

    var renderer = new Renderer(state);
    renderer.render();

});

function objectCreationExample(state) {
    var literal1 = new JavascriptBlock("Literal", new BlockPosition(300, 5), []);
    literal1.setScript("1");

    var literal2 = new JavascriptBlock("Literal", new BlockPosition(500, 5), []);
    literal2.setScript("\"Human\"");

    var create = new ObjectCreationBlock(new BlockPosition(400, 170));
    create.createInput();
    create.createInput();
    create.inputs[0].name = "Rank";
    create.inputs[1].name = "Race";

    var literal3 = new JavascriptBlock("Literal", new BlockPosition(520, 170), []);
    literal3.setScript("\"Brawler\"");

    var literal4 = new JavascriptBlock("Literal", new BlockPosition(630, 170), []);
    literal4.setScript("2");

    var inherit = new ObjectInheritBlock(new BlockPosition(500, 300));
    inherit.createInput();
    inherit.createInput();
    inherit.inputs[1].name = "Class";
    inherit.inputs[2].name = "Rank";

    var module = state.program.topLevelModule;
    module.addBlock(literal1);
    module.addBlock(literal2);
    module.addBlock(create);
    module.addBlock(literal3);
    module.addBlock(literal4);
    module.addBlock(inherit);

    module.createConnection(literal1, create, 0);
    module.createConnection(literal2, create, 1);
    module.createConnection(create, inherit, 0);
    module.createConnection(literal3, inherit, 1);
    module.createConnection(literal4, inherit, 2);
    module.createConnection(inherit, module.outputBlock, 0);
}

function createFibonacciExample(state) {
    var module = new Module("Fibonacci");
    module.addInput(new Input("n"));

    module.inputBlocks[0].getPosition().x = 359;
    module.inputBlocks[0].getPosition().y = 5;

    var literal1 = new JavascriptBlock("Literal", new BlockPosition(500, 5), []);
    literal1.setScript("1");

    var literal2 = new JavascriptBlock("Literal", new BlockPosition(647, 5), []);
    literal2.setScript("2");

    var lessThan = new OperatorBlock(BlockTypes.LessThan, new BlockPosition(377, 200));

    var minus = new OperatorBlock(BlockTypes.Subtract, new BlockPosition(505, 104));
    var minus2 = new OperatorBlock(BlockTypes.Subtract, new BlockPosition(630, 104));
    var plus = new OperatorBlock(BlockTypes.Add, new BlockPosition(566, 297));

    var moduleBlock = new ModuleBlock(module, new BlockPosition(505, 200));
    var moduleBlock2 = new ModuleBlock(module, new BlockPosition(630, 200));

    var ifBlock = new IfBlock(new BlockPosition(500, 389));

    module.addBlock(literal1);
    module.addBlock(literal2);
    module.addBlock(lessThan);
    module.addBlock(minus);
    module.addBlock(minus2);
    module.addBlock(plus);
    module.addBlock(moduleBlock);
    module.addBlock(moduleBlock2);
    module.addBlock(ifBlock);

    var n = module.inputBlocks[0];
    module.createConnection(n, lessThan, 0);
    module.createConnection(literal2, lessThan, 1);

    module.createConnection(lessThan, ifBlock, 0);
    module.createConnection(literal1, ifBlock, 1);
    module.createConnection(plus, ifBlock, 2);

    module.createConnection(moduleBlock, plus, 0);
    module.createConnection(moduleBlock2, plus, 1);

    module.createConnection(minus, moduleBlock, 0);
    module.createConnection(minus2, moduleBlock2, 0);

    module.createConnection(n, minus, 0);
    module.createConnection(literal1, minus, 1);

    module.createConnection(n, minus2, 0);
    module.createConnection(literal2, minus2, 1);

    module.createConnection(ifBlock, module.outputBlock, 0);


    var moduleBlockRoot = new ModuleBlock(module, new BlockPosition(500, 150));
    var promptBlock = new JavascriptBlock("Prompt", new BlockPosition(500, 20), []);
    promptBlock.setScript("prompt('Enter a number')");
    var logger = new JavascriptBlock("Logger", new BlockPosition(500, 300), [new Input("value")]);
    logger.setScript("log(this.value)");

    state.program.topLevelModule.addBlock(moduleBlockRoot);
    state.program.topLevelModule.addBlock(promptBlock);
    state.program.topLevelModule.addBlock(logger);
    state.program.topLevelModule.createConnection(promptBlock, moduleBlockRoot, 0);
    state.program.topLevelModule.createConnection(moduleBlockRoot, logger, 0);
    state.program.topLevelModule.createConnection(logger, state.program.topLevelModule.outputBlock, 0);
}

function createMultiplyExample(state) {
    var block1 = new JavascriptBlock("Literal", new BlockPosition(10, 10), []);
    block1.setScript("7");

    var block3 = new JavascriptBlock("Prompt", new BlockPosition(200, 10), []);
    block3.setScript("prompt('Enter a number')");

    var block2 = new OperatorBlock(BlockTypes.Multiply, new BlockPosition(160, 170));

    var block4 = new JavascriptBlock("Output", new BlockPosition(160, 300), [new Input("value")]);
    block4.setScript("log('Multiplied: ' + this.value)");

    var squareModule = new Module("Square");
    squareModule.addInput(new Input("a"));
    var block = new OperatorBlock(BlockTypes.Multiply, new BlockPosition(200, 100));
    squareModule.createConnection(squareModule.inputBlocks[0], block, 0);
    squareModule.createConnection(squareModule.inputBlocks[0], block, 1);
    squareModule.createConnection(block, squareModule.outputBlock, 0);
    squareModule.addBlock(block);
    var block5 = new ModuleBlock(squareModule, new BlockPosition(300, 170));

    var block6 = new JavascriptBlock("Output", new BlockPosition(300, 300), [new Input("value")]);
    block6.setScript("log('Squared: ' + this.value)");

    var collector = new JavascriptBlock("END", new BlockPosition(200, 450), [new Input(), new Input()]);

    var program = state.program;
    program.topLevelModule.addBlock(block1);
    program.topLevelModule.addBlock(block2);
    program.topLevelModule.addBlock(block3);
    program.topLevelModule.addBlock(block4);
    program.topLevelModule.addBlock(block5);
    program.topLevelModule.addBlock(block6);
    program.topLevelModule.addBlock(collector);

    program.topLevelModule.connections.push(new Connection(block1.id, block2.id, 0));
    program.topLevelModule.connections.push(new Connection(block3.id, block2.id, 1));
    program.topLevelModule.connections.push(new Connection(block2.id, block4.id, 0));
    program.topLevelModule.connections.push(new Connection(block3.id, block5.id, 0));
    program.topLevelModule.connections.push(new Connection(block5.id, block6.id, 0));
    program.topLevelModule.connections.push(new Connection(block4.id, collector.id, 0));
    program.topLevelModule.connections.push(new Connection(block6.id, collector.id, 1));
    program.topLevelModule.connections.push(new Connection(collector.id, program.topLevelModule.outputBlock.getId(), 0));
}