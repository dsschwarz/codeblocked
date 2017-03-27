createSidePanelVM = function (renderer) {
    var viewModel = {};
    var subscriptions = [];
    var selectedBlock = ko.observable();

    viewModel.blockName = ko.observable(""); // String
    viewModel.inputs = ko.observableArray(); // Array of observable objects
    viewModel.output = ko.observable(null); // Type
    viewModel.contents = ko.observable(""); // Type
    viewModel.showBlockInfo = ko.observable(false);

    viewModel.setSelectedBlock = function (block) {
        selectedBlock(block);
        if (block) {
            updateSidePanel();
        }

        viewModel.showBlockInfo(_shouldShowBlockInfo());
    };

    function updateSidePanel() {
        var block = selectedBlock();
        // unsub all
        subscriptions.forEach((sub) => sub.dispose());
        subscriptions = [];

        viewModel.blockName(block.name);
        subscriptions.push(viewModel.blockName.subscribe((newValue) => {
            block.setName(newValue);
        }));

        viewModel.inputs(block.getInputs().map(function (input) {
            var inputObservable = {
                name:  ko.observable(input.name),
                type: ko.observable(input.type) // Type object
            };

            subscriptions.push(inputObservable.name.subscribe((newValue) => input.name = newValue));
            subscriptions.push(inputObservable.type.subscribe((newValue) => input.type = newValue));

            return inputObservable;
        }));
        viewModel.output(block.getOutput());
        subscriptions.push(viewModel.output.subscribe((newValue) => {
            block.setOutputType(newValue);
        }));

        viewModel.contents(block.getContents());
        subscriptions.push(viewModel.contents.subscribe((newValue) => {
            block.setContents(newValue);
        }));
    }

    viewModel.addInput = function () {
        selectedBlock().createInput();
        updateSidePanel();
    };

    var _shouldShowBlockInfo = function () {
        if (selectedBlock()) {
            return true;
        }
    };

    return viewModel;
};