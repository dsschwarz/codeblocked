var program = new Program();
var renderer;
$(function () {
    console.log("Starting app");

    console.log("Testing render");
    var block1 = Block.create(10, 10);
    var block2 = Block.create(160, 120);
    block2.addInput(new Input("testInput"));
    program.topLevelModule.addBlock(block1);
    program.topLevelModule.addBlock(block2);

    // var connection = new Connection(block1.id, block2.id, 0);
    // program.topLevelModule.connections.push(connection);

    renderer = new Renderer(program);
    renderer.render();
});
