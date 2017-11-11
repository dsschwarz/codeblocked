createSidePanelVM = function (state) {
    var viewModel = {};
    var subscriptions = [];
    var selectedBlock = ko.observable();

    viewModel.blockName = ko.observable(""); // String
    viewModel.blueprintNames = state.program.blueprints.map(function (blueprint) {
        return blueprint.name;
    });
    viewModel.inputs = ko.computed(function () {
        selectedBlock();
        if (state.selectedBlock) {
            return state.selectedBlock.getInputs().map(function (input) {
                return {
                    name:  ko.observable(input.name),
                    type: ko.observable(input.type) // Type object
                };
            })
        } else {
            return [];
        }
    });
    viewModel.contents = ko.observable(new ContentsViewModel(state)); // Contents View Model
    // subscriptions.push(viewModel.contents().value.subscribe((newValue) => selectedBlock().getContents().value = newValue));

    viewModel.showBlockInfo = ko.computed(function () {
        selectedBlock();
        return !!state.selectedBlock;
    });
    viewModel.messages = ko.observableArray([]);

    state.reporter.subscribe(function () {
        viewModel.messages(state.reporter.messages);

        var el = $(".messages")[0];
        el.scrollTop = el.scrollHeight;
    });

    function unsubscribe() {
        subscriptions.forEach((sub) => sub.dispose());
        subscriptions = [];
    }

    function subscribe() {
        subscriptions.push(viewModel.blockName.subscribe((newValue) => {
            state.selectedBlock.setName(newValue);
            state.trigger(ChangeTopics.Blueprints);
        }));

        // viewModel.inputs().forEach(function (inputObservable) {
        //     subscriptions.push(inputObservable.name.subscribe((newValue) => input.name = newValue));
        //     subscriptions.push(inputObservable.type.subscribe((newValue) => input.type = newValue));
        // })
    }

    state.listenMany([ChangeTopics.SelectedBlock, ChangeTopics.Blueprints], function () {
        unsubscribe();
        selectedBlock.valueHasMutated();
        subscribe();
    });

    viewModel.addInput = function () {
        state.selectedBlock.createInput();
        state.trigger(ChangeTopics.Blueprints);
    };

    return viewModel;
};

/**
 * @param state {State}
 */
function createModulePathVM(state) {
    var vm = {};

    function getPathViewModels() {
        var modulePath = state.modulePath;
        return modulePath
            .slice(0, modulePath.length - 1)
            .map(function (modulePathInfo, index) {
                return {
                    name: modulePathInfo.name,
                    click: function () {
                        modulePath.splice(index + 1);
                        state.trigger(ChangeTopics.ModulePath);
                    }
                }
            })
    }

    function getCurrent() {
        return state.currentModule();
    }

    vm.path = ko.observableArray(getPathViewModels());
    vm.current = ko.observable(getCurrent().name);

    state.listen(ChangeTopics.ModulePath, function () {
        vm.path(getPathViewModels());
        vm.current(getCurrent().name);
    });
    return vm;
}

class ContentsViewModel {
    /**
     * @param state {State}
     */
    constructor(state) {
        var that = this;
        var selectedBlockObservable = ko.observable();
        this.isStringContents = ko.computed(function () {
            selectedBlockObservable();
            var block = state.selectedBlock;
            return block && block.getContents().isStringContents();
        });

        this.value = ko.computed(function () {
            if (that.isStringContents()) {
                return state.selectedBlock.getContents().value;
            }
        });
        this.goToModule = function () {
            var block = state.selectedBlock;
            state.addModule({module: block.getContents().module, name: block.name});
        };
        this.toggleContentsType = function () {
            var block = state.selectedBlock;
            block.setContentsTypeString(!that.isStringContents());
            state.trigger(ChangeTopics.Blueprints);
        };

        state.listenMany([ChangeTopics.SelectedBlock, ChangeTopics.Blueprints], function () {
            selectedBlockObservable.valueHasMutated();
        })
    }
}