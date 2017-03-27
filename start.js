var program = new Program();
var renderer;
$(function () {
    console.log("Starting app");

    console.log("Testing render");
    var block1 = Block.create(10, 10);
    block1.setContents("2");
    block1.name = "Literal";

    var block3 = Block.create(200, 10);
    block3.setContents("prompt('Enter a number')");
    block3.name = "Input";

    var block2 = Block.create(160, 170);
    block2.name = "Multiply";
    block2.setContents("this.a*this.b");
    block2.addInput(new Input("a"));
    block2.addInput(new Input("b"));

    var block4 = Block.create(160, 300);
    block4.name = "Output";
    block4.setContents("alert('Multiplied: ' + this.value)");
    block4.addInput(new Input("value"));

    var block5 = Block.create(300, 170);
    block5.name = "Square";
    block5.setContents("this.a*this.a");
    block5.addInput(new Input("a"));

    var block6 = Block.create(300, 300);
    block6.name = "Output";
    block6.setContents("alert('Squared: ' + this.value)");
    block6.addInput(new Input("value"));

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

    renderer = new Renderer(program);
    renderer.render();
});
