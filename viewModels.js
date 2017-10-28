createSidePanelVM = function (renderer) {
    var viewModel = {};
    var subscriptions = [];
    var contentsSubscriptions = [];
    var selectedBlock = ko.observable();

    viewModel.blockName = ko.observable(""); // String
    viewModel.inputs = ko.observableArray(); // Array of observable objects
    viewModel.output = ko.observable(null); // Type
    viewModel.contents = ko.observable(); // Contents View Model

    viewModel.showBlockInfo = ko.observable(false);
    viewModel.messages = ko.observableArray([]);

    renderer.reporter.subscribe(function () {
        viewModel.messages(renderer.reporter.messages);

        var el = $(".messages")[0];
        el.scrollTop = el.scrollHeight;
    });

    viewModel.setSelectedBlock = function (block) {
        selectedBlock(block);
        if (block) {
            updateSidePanel();
        }

        viewModel.showBlockInfo(_shouldShowBlockInfo());
    };

    function cleanContentsSubscriptions() {
        contentsSubscriptions.forEach((sub) => sub.dispose());
        contentsSubscriptions = [];
    }

    function updateSidePanel() {
        var block = selectedBlock();
        // unsub all
        subscriptions.forEach((sub) => sub.dispose());
        subscriptions = [];
        cleanContentsSubscriptions();

        viewModel.blockName(block.name);
        subscriptions.push(viewModel.blockName.subscribe((newValue) => {
            block.setName(newValue);
            _updateView();
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

        function updateContents() {
            cleanContentsSubscriptions();
            var contents = block.getContents();
            var contentsVM;
            if (contents.isStringContents()) {
                contentsVM = {
                    value: ko.observable(contents.value),
                    isStringContents: true,
                    toggleContentsType: function () {
                        block.setContentsTypeString(false);
                        updateContents();
                    }
                };
                contentsSubscriptions.push(contentsVM.value.subscribe((newValue) => contents.value = newValue));
            } else {
                contentsVM = {
                    goToModule: function () {
                        renderer.setCurrentModule(contents.module, block.name);
                        renderer.render();
                    },
                    isStringContents: false,
                    toggleContentsType: function () {
                        block.setContentsTypeString(true);
                        updateContents();
                    }
                }
            }
            viewModel.contents(contentsVM);
        }

        updateContents();
    }

    viewModel.addInput = function () {
        selectedBlock().createInput();
        updateSidePanel();
        _updateView();
    };

    var _shouldShowBlockInfo = function () {
        if (selectedBlock()) {
            return true;
        }
    };

    var _updateView = function () {
        renderer.render();
    };

    return viewModel;
};


function createModulePathVM(renderer) {
    var vm = {};

    function getPathViewModels() {
        return renderer.modulePath
            .slice(0, renderer.modulePath.length - 1)
            .map(function (modulePathInfo, index) {
                return {
                    name: modulePathInfo.name,
                    click: function () {
                        renderer.modulePath.splice(index + 1);
                        renderer.currentModule = modulePathInfo.module;
                        vm.update();
                        renderer.render();
                    }
                }
            })
    }

    function getCurrent() {
        return renderer.modulePath[renderer.modulePath.length - 1];
    }

    vm.path = ko.observableArray(getPathViewModels());
    vm.current = ko.observable(getCurrent().name);
    vm.update = function () {
        vm.path(getPathViewModels());
        vm.current(getCurrent().name);
    };
    return vm;
}