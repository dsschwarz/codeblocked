// helper classes for rendering and UI

// This class is used when creating connections. It remembers what's been selected so far
class ConnectionHandler {
    constructor(state) {
        this.state = state;
        this.selectedOutput = null;
        this.selectedInputBlock = null;
        this.selectedInputIndex = null;
    }

    reset() {
        this.selectedOutput = null;
        this.selectedInputBlock = null;
        this.selectedInputIndex = null;
    }

    connectToOutput(block) {
        this.selectedOutput = block;

        // can't connect a block to itself.
        if (this.selectedInputBlock == block) {
            this.selectedInputBlock = null;
        }

        this.createIfPossible();
    }

    connectToInput(block, index) {
        this.selectedInputBlock = block;
        this.selectedInputIndex = index;

        if (this.selectedOutput == block) {
            this.selectedOutput = null;
        }

        this.createIfPossible();
    }

    createIfPossible() {
        // Check error conditions
        if (this.selectedOutput && this.selectedOutput == this.selectedInputBlock) {
            console.error("Output is the same as input");
            return;
        }

        // check if both output and input are selected
        if (this.selectedInputBlock && this.selectedOutput && this.selectedInputIndex != null) {
            if (this.selectedInputBlock.getModule() != this.selectedOutput.getModule()) {
                console.error("Input and output belong to different modules");
            } else {
                var module = this.selectedOutput.getModule();
                if (module.getConnection(this.selectedOutput, this.selectedInputBlock, this.selectedInputIndex)) {
                    console.warn("Connection already exists");
                } else {
                    // we're good to go
                    module
                        .createConnection(this.selectedOutput, this.selectedInputBlock, this.selectedInputIndex);

                }
                this.reset();
                this.state.trigger(ChangeTopics.Connections)
            }
        }
    }
}
