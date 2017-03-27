var Modes = {
    Placement: "placement",
    Connection: "connection",
    None: "none"
};


class Renderer {
    constructor(program) {
        var that = this;
        this.program = program;
        this.mode = Modes.None;
        this.lastMousePosition = {x: 0, y: 0};
        this.container = d3.select("svg");
        this.connectionHandler = new ConnectionHandler();
        this.container.on("mousemove", function () {
            that.lastMousePosition.x = d3.event.offsetX;
            that.lastMousePosition.y = d3.event.offsetY;
            that.renderModeSpecific();
        });

        $("#placement-btn").on("click", function () {
            that.setMode(Modes.Placement)
        });

        $("#connection-btn").on("click", function () {
            that.setMode(Modes.Connection)
        });

        this.sidePanel = createSidePanelVM();
        this.currentlySelectedBlockId = null;

        ko.applyBindings(this.sidePanel, $(".side-panel")[0]);
    }

    setMode(mode) {
        if (mode == this.mode) {
            mode = Modes.None;
        } else if (mode == Modes.Connection) {
            this.connectionHandler.reset();
        }

        $("#" + this.mode + "-btn").removeClass("selected");
        this.container.classed("mode-" + this.mode, false);
        this.mode = mode;
        this.container.classed("mode-" + this.mode, true);
        $("#" + mode + "-btn").addClass("selected");
        this.render();
    }

    // render relies on the globally available program
    render() {
        this.renderModule(this.program.topLevelModule, this.container);

        this.renderModeSpecific();

    }

    // update the side panel with the info for a given block
    updateCurrentlySelectedBlock(newBlock) {
        this.currentlySelectedBlockId = newBlock.id;
        this.sidePanel.setSelectedBlock(newBlock);
        this.render();
    }

    renderModeSpecific() {
        if (this.mode == Modes.Placement) {
            this.renderBasicBlock(
                this.container.selectAll(".ghostBlock")
                    .data([new GhostBlock(this.lastMousePosition.x, this.lastMousePosition.y)])
            ).allBlocks.classed("ghostBlock", true);
        } else {
            this.container.selectAll(".ghostBlock").remove();
        }

        if (this.mode == Modes.Connection) {
            // show ghost line if input or output is already specified
        } else {
            // hide ghost line
        }


    }

    /**
     *
     * @param module {Module}
     * @param parent
     */
    renderModule(module, parent) {
        var container = this.renderModuleContainer(parent, module);
        this.renderBlocks(container.selectAll(".code-block").data(module.blocks));

        var connectionContainer = container.selectAll(".connection-container")
            .data([0]);

        var newContainer = connectionContainer.enter()
            .append("g")
            .classed("connection-container", true);

        var connections = connectionContainer.merge(newContainer).selectAll(".connection")
            .data(module.connections);

        var newConnections = connections.enter()
            .append("path")
            .classed("connection", true);

        connections.merge(newConnections)
            .attr("d", d => this.getConnectionLineData(module, d));

    }

    renderModuleContainer(parentElement, module) {
        var renderer = this;

        var moduleElement = parentElement.selectAll(".moduleElement")
            .data([0]);

        var newElem = moduleElement.enter()
            .append("g")
            .classed("moduleElement", true);

        newElem.append("rect")
            .classed("click-catcher", true);

        newElem
            .on("click", function () {
                if (renderer.mode == Modes.Placement) {
                    var block = new GhostBlock(d3.event.offsetX, d3.event.offsetY);
                    // TODO confirm offset is correct for nested modules
                    var newBlock = Block.create(block.x, block.y);
                    module.addBlock(newBlock);
                    renderer.updateCurrentlySelectedBlock(newBlock);
                    renderer.render();
                }
            });

        moduleElement = moduleElement.merge(newElem);


        return moduleElement;
    }

    renderBlocks(blockElements) {
        var renderer = this;
        var result = this.renderBasicBlock(blockElements);

        // add outputs
        var outputArea = result.newBlocks.append("g")
            .classed("output-area", true)
            .classed("io-area", true)
            .on("click", function (block) {
                if (renderer.mode == Modes.Connection) {
                    renderer.connectionHandler.connectToOutput(block);
                }
            });
        outputArea.append("rect")
            .classed("output-click-area click-area", true);

        outputArea.append("path")
            .classed("output-line", true)
            .classed("io-line", true);

        // center the output area, three quarters down and sticking out by a bit
        var outputsToUpdate = result.allBlocks.selectAll(".output-area")
            .attr("transform", data => "translate(" + data.width/4 + ", " + data.height*0.75 + ")");

        outputsToUpdate.selectAll(".output-click-area")
            .attr("height", data => data.height/3)
            .attr("width", data => data.width/2);
        outputsToUpdate.selectAll(".output-line")
            .attr("d", block => {
                return "M" + block.width/4 + " " + block.height/4 + " v" + block.getIOLineLength()
            });


        // add inputs
        var inputAreas = result.allBlocks.selectAll(".input-area")
            .data(function (blockData) {
                var inputs = blockData.getInputs();
                var totalInputs = inputs.length;
                return inputs.map(function (input, index) {
                    var inputData = {};
                    inputData.block = blockData;
                    inputData.index = index;
                    inputData.width = 1/(totalInputs+1) * blockData.width;
                    inputData.height = blockData.height/3; // todo tweak this
                    var inputPosition = blockData.getInputPosition(index);
                    // this is a bit strange - getInputPosition includes the absolute block position
                    // Subtract block position to get position relative to the block
                    inputData.x = inputPosition.x - blockData.x;
                    inputData.y = inputPosition.y - blockData.y;

                    return inputData;
                });
            });

        var newInputAreas = inputAreas.enter().append("g")
            .classed("input-area", true)
            .classed("io-area", true)
            .on("click", function (inputData) {
                if (renderer.mode == Modes.Connection) {
                    renderer.connectionHandler.connectToInput(inputData.block, inputData.index);
                    d3.event.stopPropagation();
                }
            });

        newInputAreas.append("rect")
            .classed("input-click-area click-area", true);
        newInputAreas.append("path")
            .classed("input-line", true)
            .classed("io-line", true);

        var inputsToUpdate = inputAreas.merge(newInputAreas);

        inputsToUpdate
            .attr("transform", function (inputData) {
                return _translate(inputData.x, inputData.y);
            });

        inputsToUpdate.select(".input-line")
            .attr("d", inputData => {
                return "M0 0 v" + inputData.block.getIOLineLength();
            });

        inputsToUpdate.select(".input-click-area")
            .attr("x", d => -d.width/2)
            .attr("y", d => -d.block.height/12) // based on 3/4h+1/3h = 13/12h
            .attr("width", d => d.width)
            .attr("height", d => d.height);


        return result.allBlocks;
    }

    renderBasicBlock(blockElements) {
        var renderer = this;
        var drag = d3.drag();
        drag.on("drag", function (data) {
            data.x = d3.event.x;
            data.y = d3.event.y;

            renderer.render();
        });

        var newBlocks = blockElements.enter()
            .append("g")
            .classed("code-block", true)
            .on("click", function (data) {
                renderer.updateCurrentlySelectedBlock(data);
            })
            .call(drag);

        newBlocks.append("rect")
            .classed("background", true);

        var allBlocks = blockElements.merge(newBlocks)
            .classed("selected", data => data.id == renderer.currentlySelectedBlockId)
            .attr("transform", data => _translate(data.x, data.y) );

        allBlocks.selectAll(".background")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", data => data.width)
            .attr("height", data => data.height);

        blockElements.exit().remove();

        return {
            allBlocks: allBlocks,
            newBlocks: newBlocks
    }

}

    /**
     * @param module {Module}
     * @param d {Connection}
     * @return {String}
     */
    getConnectionLineData(module, d) {
        var fromBlock = module.findBlock(d.fromBlockId);
        var toBlock = module.findBlock(d.toBlockId);

        var start = fromBlock.getOutputPosition();
        var end = toBlock.getInputPosition(d.inputIndex);

        return "M" + start.x + " " + start.y + " L" + end.x + " " + end.y;
    }
}


function _translate(x, y) {
    return "translate(" + x + "," + y + ")";
}