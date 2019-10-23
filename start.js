$(function () {
    console.log("Starting app");
    var state  = new State();
    window.globalProgram = state.program;

    // createMultiplyExample(state);

    var renderer = new Renderer(state);
    renderer.render();

});

function objectCreationExample(state) {
    var literal1 = new NumberBlock(new BlockPosition(300, 5), 1);

    var literal2 = new TextBlock(new BlockPosition(500, 5), "Human");

    var create = new ObjectCreationBlock(new BlockPosition(400, 170));
    create.createInput();
    create.createInput();
    create.inputs[0].name = "Rank";
    create.inputs[1].name = "Race";

    var literal3 = new TextBlock(new BlockPosition(520, 170), "Brawler");

    var literal4 = new NumberBlock(new BlockPosition(630, 170), 2);

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

    var literal1 = new NumberBlock(new BlockPosition(500, 5), 1);

    var literal2 = new NumberBlock(new BlockPosition(647, 5), 2);

    var lessThan = new OperatorBlock(Operators.LessThan, new BlockPosition(377, 200));

    var minus = new OperatorBlock(Operators.Subtract, new BlockPosition(505, 104));
    var minus2 = new OperatorBlock(Operators.Subtract, new BlockPosition(630, 104));
    var plus = new OperatorBlock(Operators.Add, new BlockPosition(566, 297));

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
    var promptBlock = new PromptBlock(new BlockPosition(500, 20), "Enter a number");
    var logger = new LoggerBlock(new BlockPosition(500, 300));

    state.program.topLevelModule.addBlock(moduleBlockRoot);
    state.program.topLevelModule.addBlock(promptBlock);
    state.program.topLevelModule.addBlock(logger);
    state.program.topLevelModule.createConnection(promptBlock, moduleBlockRoot, 0);
    state.program.topLevelModule.createConnection(moduleBlockRoot, logger, 0);
    state.program.topLevelModule.createConnection(logger, state.program.topLevelModule.outputBlock, 0);
}

function createFibonacciTailRecursiveExample(state) {

    function createOuter(innerModule) {
        var outer = new Module("Fibonacci");
        outer.addInput(new Input("n"));

        outer.inputBlocks[0].getPosition().x = 371;
        outer.inputBlocks[0].getPosition().y = 66;


        var literal1 = new NumberBlock(new BlockPosition(590, 66));
        literal1.setValue(1);

        var literal2 = new NumberBlock(new BlockPosition(482, 66));
        literal2.setValue(2);

        var literal3 = new NumberBlock(new BlockPosition(720, 66));
        literal3.setValue(3);

        var equalsBlock = new OperatorBlock(Operators.Equals, new BlockPosition(398, 305));
        var equalsBlock2 = new OperatorBlock(Operators.Equals, new BlockPosition(565, 200));
        var ifBlock = new IfBlock(new BlockPosition(500, 404));
        var ifBlock2 = new IfBlock(new BlockPosition(590, 305));

        var moduleBlock = new ModuleBlock(innerModule, new BlockPosition(709, 200));

        outer.addBlock(literal1);
        outer.addBlock(literal2);
        outer.addBlock(literal3);
        outer.addBlock(equalsBlock);
        outer.addBlock(equalsBlock2);
        outer.addBlock(ifBlock);
        outer.addBlock(ifBlock2);
        outer.addBlock(moduleBlock);

        var n = outer.inputBlocks[0];

        outer.createConnection(literal1, moduleBlock, 0);
        outer.createConnection(literal1, moduleBlock, 1);
        outer.createConnection(literal3, moduleBlock, 2);
        outer.createConnection(n, moduleBlock, 3);

        outer.createConnection(n, equalsBlock, 0);
        outer.createConnection(literal1, equalsBlock, 1);

        outer.createConnection(n, equalsBlock2, 0);
        outer.createConnection(literal2, equalsBlock2, 1);

        outer.createConnection(equalsBlock2, ifBlock2, 0);
        outer.createConnection(literal1, ifBlock2, 1);
        outer.createConnection(moduleBlock, ifBlock2, 2);

        outer.createConnection(equalsBlock, ifBlock, 0);
        outer.createConnection(literal1, ifBlock, 1);
        outer.createConnection(ifBlock2, ifBlock, 2);

        outer.createConnection(ifBlock, outer.outputBlock, 0);

        return outer;
    }

    function createInner() {
        var inner = new Module("Fibonacci Recursive");
        inner.addInput(new Input("prev1"));
        inner.addInput(new Input("prev2"));
        inner.addInput(new Input("counter"));
        inner.addInput(new Input("n"));

        inner.inputBlocks[0].getPosition().x = 356;
        inner.inputBlocks[0].getPosition().y = 4;
        inner.inputBlocks[1].getPosition().x = 476;
        inner.inputBlocks[1].getPosition().y = 4;
        inner.inputBlocks[2].getPosition().x = 596;
        inner.inputBlocks[2].getPosition().y = 4;
        inner.inputBlocks[3].getPosition().x = 836;
        inner.inputBlocks[3].getPosition().y = 4;

        var literal1 = new NumberBlock(new BlockPosition(716, 23), 1);

        var summed = new OperatorBlock(Operators.Add, new BlockPosition(462, 156));
        var plusOne = new OperatorBlock(Operators.Add, new BlockPosition(653, 156));
        var equalsBlock = new OperatorBlock(Operators.Equals, new BlockPosition(475, 289));
        var ifBlock = new IfBlock(new BlockPosition(500, 422));
        var moduleBlock = new ModuleBlock(inner, new BlockPosition(643, 289));

        inner.outputBlock.getPosition().y = 555;

        inner.addBlock(literal1);
        inner.addBlock(summed);
        inner.addBlock(plusOne);
        inner.addBlock(equalsBlock);
        inner.addBlock(ifBlock);
        inner.addBlock(moduleBlock);

        var inputs = inner.inputBlocks;

        inner.createConnection(inputs[2], equalsBlock, 0);
        inner.createConnection(inputs[3], equalsBlock, 1);

        inner.createConnection(inputs[0], summed, 0);
        inner.createConnection(inputs[1], summed, 1);

        inner.createConnection(inputs[2], plusOne, 0);
        inner.createConnection(literal1, plusOne, 1);

        inner.createConnection(inputs[1], moduleBlock, 0);
        inner.createConnection(summed, moduleBlock, 1);
        inner.createConnection(plusOne, moduleBlock, 2);
        inner.createConnection(inputs[3], moduleBlock, 3);

        inner.createConnection(equalsBlock, ifBlock, 0);
        inner.createConnection(summed, ifBlock, 1);
        inner.createConnection(moduleBlock, ifBlock, 2);

        inner.createConnection(ifBlock, inner.outputBlock, 0);

        return inner;
    }


    var innerModule = createInner();
    var outerModule = createOuter(innerModule);

    var promptBlock = new PromptBlock(new BlockPosition(500, 20), "Enter a number");
    var moduleBlockRoot = new ModuleBlock(outerModule, new BlockPosition(500, 180));
    var logger = new LoggerBlock(new BlockPosition(500, 340));

    state.program.topLevelModule.addBlock(moduleBlockRoot);
    state.program.topLevelModule.addBlock(promptBlock);
    state.program.topLevelModule.addBlock(logger);
    state.program.topLevelModule.createConnection(promptBlock, moduleBlockRoot, 0);
    state.program.topLevelModule.createConnection(moduleBlockRoot, logger, 0);
    state.program.topLevelModule.createConnection(logger, state.program.topLevelModule.outputBlock, 0);
}

function createMultiplyExample(state) {
    var block1 = new NumberBlock(new BlockPosition(10, 10), 7);

    var block3 = new PromptBlock(new BlockPosition(200, 10), "Enter a number");

    var block2 = new OperatorBlock(Operators.Multiply, new BlockPosition(160, 170));

    var blockMultipliedLiteral = new TextBlock(new BlockPosition(30, 170), "Multiplied: ");
    var literalAdder = new OperatorBlock(Operators.Add, new BlockPosition(160, 300));
    var block4 = new LoggerBlock(new BlockPosition(160, 430));

    var squareModule = new Module("Square");
    squareModule.addInput(new Input("a"));
    var block = new OperatorBlock(Operators.Multiply, new BlockPosition(200, 100));
    squareModule.createConnection(squareModule.inputBlocks[0], block, 0);
    squareModule.createConnection(squareModule.inputBlocks[0], block, 1);
    squareModule.createConnection(block, squareModule.outputBlock, 0);
    squareModule.addBlock(block);
    var block5 = new ModuleBlock(squareModule, new BlockPosition(430, 170));

    var blockSquaredLiteral = new TextBlock(new BlockPosition(300, 170), "Squared: ");
    var squareLiteralAdder = new OperatorBlock(Operators.Add, new BlockPosition(300, 300));
    var block6 = new LoggerBlock(new BlockPosition(300, 430));

    var collector = new JavascriptBlock("END", new BlockPosition(200, 560), [new Input(), new Input()]);

    var program = state.program;
    program.topLevelModule.addBlock(block1);
    program.topLevelModule.addBlock(block2);
    program.topLevelModule.addBlock(block3);
    program.topLevelModule.addBlock(blockMultipliedLiteral);
    program.topLevelModule.addBlock(literalAdder);
    program.topLevelModule.addBlock(block4);
    program.topLevelModule.addBlock(block5);
    program.topLevelModule.addBlock(blockSquaredLiteral);
    program.topLevelModule.addBlock(squareLiteralAdder);
    program.topLevelModule.addBlock(block6);
    program.topLevelModule.addBlock(collector);

    program.topLevelModule.connections.push(new Connection(block1.id, block2.id, 0));
    program.topLevelModule.connections.push(new Connection(block3.id, block2.id, 1));
    program.topLevelModule.connections.push(new Connection(blockMultipliedLiteral.id, literalAdder.id, 0));
    program.topLevelModule.connections.push(new Connection(block2.id, literalAdder.id, 1));
    program.topLevelModule.connections.push(new Connection(literalAdder.id, block4.id, 0));
    program.topLevelModule.connections.push(new Connection(block3.id, block5.id, 0));
    program.topLevelModule.connections.push(new Connection(blockSquaredLiteral.id, squareLiteralAdder.id, 0));
    program.topLevelModule.connections.push(new Connection(block5.id, squareLiteralAdder.id, 1));
    program.topLevelModule.connections.push(new Connection(squareLiteralAdder.id, block6.id, 0));
    program.topLevelModule.connections.push(new Connection(block4.id, collector.id, 0));
    program.topLevelModule.connections.push(new Connection(block6.id, collector.id, 1));
    program.topLevelModule.connections.push(new Connection(collector.id, program.topLevelModule.outputBlock.getId(), 0));

    program.modules.push(squareModule);
}