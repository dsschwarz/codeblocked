$(function () {
    console.log("Starting app");
    var state  = new State();
    window.globalProgram = state.program;

    console.log("Testing render");
    var block1 = Block.create(10, 10);
    block1.setContents("2");
    block1.setName("Literal");

    var block3 = Block.create(200, 10);
    block3.setContents("prompt('Enter a number')");
    block3.setName("Input");

    var block2 = Block.create(160, 170);
    block2.setName("Multiply");
    block2.setContents("this.a*this.b");
    block2.addInput(new Input("a"));
    block2.addInput(new Input("b"));

    var block4 = Block.create(160, 300);
    block4.setName("Output");
    block4.setContents("log('Multiplied: ' + this.value)");
    block4.addInput(new Input("value"));

    var block5 = Block.create(300, 170);
    block5.setName("Square");
    block5.setContents("this.a*this.a");
    block5.addInput(new Input("a"));

    var block6 = Block.create(300, 300);
    block6.setName("Output");
    block6.setContents("log('Squared: ' + this.value)");
    block6.addInput(new Input("value"));

    var program = state.program;
    program.topLevelModule.addBlock(block1);
    program.topLevelModule.addBlock(block2);
    program.topLevelModule.addBlock(block3);
    program.topLevelModule.addBlock(block4);
    program.topLevelModule.addBlock(block5);
    program.topLevelModule.addBlock(block6);

    program.topLevelModule.connections.push(new Connection(block1.id, block2.id, 0));
    program.topLevelModule.connections.push(new Connection(block3.id, block2.id, 1));
    program.topLevelModule.connections.push(new Connection(block2.id, block4.id, 0));
    program.topLevelModule.connections.push(new Connection(block3.id, block5.id, 0));
    program.topLevelModule.connections.push(new Connection(block5.id, block6.id, 0));

    var renderer = new Renderer(state);
    renderer.render();

});
