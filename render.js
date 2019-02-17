class Renderer {
    /**
     * @param state {State}
     */
    constructor(state) {
        var that = this;
        /**
         * @type {State}
         */
        this.state = state;
        this.lastMousePosition = {x: 0, y: 0};
        this.container = d3.select("svg");
        this.container.on("mousemove", function () {
            that.lastMousePosition.x = d3.event.offsetX;
            that.lastMousePosition.y = d3.event.offsetY;
            that.renderModeSpecific();
        });

        $("#placement-btn").on("click", function () {
            that.setMode(Modes.Placement)
        });
        $("#placement-btn-multiply").on("click", function () {
            that.setMode(Modes.Placement)
        });

        $("#connection-btn").on("click", function () {
            that.setMode(Modes.Connection)
        });

        $("#run-btn").on("click", function () {
            var evaluator = new ProgramEvaluator(that.state.program, that.state.reporter);
            evaluator.run();
        });

        $("#load-btn").on("click", function () {
            var raw = prompt("Enter save info");
            var program = deserializeProgram(JSON.parse(raw));
            that.state.setProgram(program);
        });

        $("#save-btn").on("click", function () {
            var program = serializeProgram(that.state.program);
            console.log(program);
            console.log(JSON.stringify(program));
        });
        $("#check-btn").on("click", function () {
            var program = JSON.stringify(serializeProgram(that.state.program));
            var parsed = deserializeProgram(JSON.parse(program));
            var serializedAgain = JSON.stringify(serializeProgram(parsed));

            console.log(program);
            console.log(serializedAgain);
            console.log(program === serializedAgain);
        });


        this.sidePanel = createSidePanelVM(state);
        this.modulePathViewModel = createModulePathVM(state);

        ko.applyBindings(this.sidePanel, $(".side-panel")[0]);
        ko.applyBindings(this.modulePathViewModel, $(".module-path")[0]);

        this.state.listenMany(
            [ChangeTopics.Blocks, ChangeTopics.Connections, ChangeTopics.SelectedBlock, ChangeTopics.Mode, ChangeTopics.Modules, ChangeTopics.ModulePath],
            function () { that.render(); }
        );
    }

    setMode(mode) {
        if (mode == this.state.mode) {
            mode = Modes.None;
        } else if (mode == Modes.Connection) {
            this.state.connectionHandler.reset();
        }

        $("#" + this.state.mode + "-btn").removeClass("selected");
        this.container.classed("mode-" + this.state.mode, false);
        this.container.classed("mode-" + mode, true);
        $("#" + mode + "-btn").addClass("selected");
        this.state.setMode(mode);
    }

    render() {
        this.renderModule(this.state.currentModule(), this.container);

        this.renderModeSpecific();

    }

    renderModeSpecific() {
        if (this.state.mode == Modes.Placement) {
            this.renderBasicBlock(
                this.container.selectAll(".ghostBlock")
                    .data([new GhostBlock("", this.lastMousePosition.x, this.lastMousePosition.y)])
            ).allBlocks.classed("ghostBlock", true);
        } else {
            this.container.selectAll(".ghostBlock").remove();
        }

        if (this.state.mode == Modes.Connection) {
            // show ghost line if input or output is already specified
        } else {
            // hide ghost line
        }
    }

    /**
     * @param module {Module}
     * @param parent
     */
    renderModule(module, parent) {
        var container = this.renderModuleContainer(parent, module);
        this.renderBlocks(container.selectAll(".code-block").data(module.allBlocks()));

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

        connections.exit()
            .remove();

        connections.merge(newConnections)
            .attr("d", d => this.getConnectionLineData(module, d));

    }

    renderModuleContainer(parentElement) {
        var renderer = this;

        var clickCatcher = parentElement.selectAll(".click-catcher").data([0]).enter().append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .classed("click-catcher", true);

        clickCatcher
            .call(d3.zoom().on("zoom", zoomed));

        var moduleElement = parentElement.selectAll(".moduleElement")
            .data([0]);

        var newElem = moduleElement.enter()
            .append("g")
            .classed("moduleElement", true);

        function zoomed() {
            moduleElement.attr("transform", d3.event.transform);
        }

        clickCatcher
            .on("click", function () {
                if (renderer.state.mode == Modes.Placement) {
                    // TODO account for zoom and pan
                    var blockPosition = new GhostBlock("", d3.event.offsetX, d3.event.offsetY).getPosition();

                    var newBlock;
                    newBlock = ModuleBlock.create(blockPosition);
                    renderer.state.currentModule().addBlock(newBlock);
                    renderer.state.selectBlock(newBlock);
                    renderer.state.setMode(Modes.None);
                    renderer.state.trigger(ChangeTopics.Blocks);
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
                if (renderer.state.mode == Modes.Connection) {
                    renderer.state.connectionHandler.connectToOutput(block);
                }
            });
        outputArea.append("rect")
            .classed("output-click-area click-area", true);

        outputArea.append("path")
            .classed("output-line", true)
            .classed("io-line", true);

        // center the output area, three quarters down and sticking out by a bit
        var outputsToUpdate = result.allBlocks.select(".output-area")
            .attr("transform", data => "translate(" + data.getPosition().width/4 + ", " + data.getPosition().height*0.75 + ")");

        outputsToUpdate.select(".output-click-area")
            .attr("height", data => data.getPosition().height/3)
            .attr("width", data => data.getPosition().width/2);
        outputsToUpdate.select(".output-line")
            .attr("d", block => {
                return "M" + block.getPosition().width/4 + " " + block.getPosition().height/4 + " v" + BlockHelpers.getIOLineLength()
            });


        // add inputs
        var inputAreas = result.allBlocks.selectAll(".input-area")
            .data(function (blockData) {
                var inputs = blockData.getInputs();
                var totalInputs = inputs.length;
                return inputs.map(function (input, index) {
                    var inputData = {};
                    var position = blockData.getPosition();
                    inputData.block = blockData;
                    inputData.index = index;
                    inputData.width = 1/(totalInputs+1) * position.width;
                    inputData.height = position.height/3; // todo tweak this
                    var inputPosition = BlockHelpers.getInputPosition(blockData, index);
                    // this is a bit strange - getInputPosition includes the absolute block position
                    // Subtract block position to get position relative to the block
                    inputData.x = inputPosition.x - position.x;
                    inputData.y = inputPosition.y - position.y;

                    return inputData;
                });
            });

        var newInputAreas = inputAreas.enter().append("g")
            .classed("input-area", true)
            .classed("io-area", true)
            .on("click", function (inputData) {
                if (renderer.state.mode == Modes.Connection) {
                    renderer.state.connectionHandler.connectToInput(inputData.block, inputData.index);
                    d3.event.stopPropagation();
                }
            });

        inputAreas.exit().remove();

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
            .attr("d", "M0 0 v" + BlockHelpers.getIOLineLength());

        inputsToUpdate.select(".input-click-area")
            .attr("x", d => -d.width/2)
            .attr("y", d => -d.block.getPosition().height/12) // based on 3/4h+1/3h = 13/12h
            .attr("width", d => d.width)
            .attr("height", d => d.height);


        return result.allBlocks;
    }

    renderBasicBlock(blockElements) {
        var renderer = this;
        var drag = d3.drag();
        drag.on("drag", function (data) {
            data.getPosition().x += d3.event.dx;
            data.getPosition().y += d3.event.dy;
            renderer.render();
        });

        var newBlocks = blockElements.enter()
            .append("g")
            .classed("code-block", true)
            .on("click", function (data) {
                renderer.state.selectBlock(data);
            })
            .call(drag);

        newBlocks.append("rect")
            .classed("background", true);

        newBlocks.append("text")
            .classed("block-name-label", true)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle");

        var allBlocks = blockElements.merge(newBlocks)
            .classed("selected", data => data == renderer.state.selectedBlock)
            .attr("transform", data => _translate(data.getPosition().x, data.getPosition().y) );

        allBlocks.select(".background")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", data => data.getPosition().width)
            .attr("height", data => data.getPosition().height);

        allBlocks.select(".block-name-label")
            .attr("x", data => data.getPosition().width/2)
            .attr("y", data => data.getPosition().height/2)
            .text(data => {
                return data.getName()
            });

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

        var start = BlockHelpers.getOutputPosition(fromBlock);
        var end = BlockHelpers.getInputPosition(toBlock, d.inputIndex);

        return "M" + start.x + " " + start.y + " L" + end.x + " " + end.y;
    }
}


function _translate(x, y) {
    return "translate(" + x + "," + y + ")";
}