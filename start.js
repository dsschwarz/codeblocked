$(function () {
    console.log("Starting app");
    var state  = new State();
    window.globalProgram = state.program;

    console.log("Testing render");
    var block1 = new JavascriptBlock("Literal", new BlockPosition(10, 10), []);
    block1.setScript("7");

    var block3 = new JavascriptBlock("Prompt", new BlockPosition(200, 10), []);
    block3.setScript("prompt('Enter a number')");

    var block2 = new JavascriptBlock("Multiply", new BlockPosition(160, 170), [new Input("a"), new Input("b")]);
    block2.setScript("this.a*this.b");

    var block4 = new JavascriptBlock("Output", new BlockPosition(160, 300), [new Input("value")]);
    block4.setScript("log('Multiplied: ' + this.value)");

    var block5 = new JavascriptBlock("Square", new BlockPosition(300, 170), [new Input("a")]);
    block5.setScript("this.a*this.a");

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

    state.selectBlock(block1);

    var renderer = new Renderer(state);
    renderer.render();

});
