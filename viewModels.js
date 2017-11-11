createSidePanelVM = function (state) {
    var viewModel = {};
    var subscriptions = [];
    var onChangeObservable = ko.observable();

    viewModel.isEditingName = ko.observable(false);
    viewModel.toggleEditingName = function () {
        viewModel.isEditingName(!viewModel.isEditingName());
    };
    viewModel.blockName = ko.observable(""); // String
    viewModel.blueprints = ko.computed(function () {
        onChangeObservable();
        return state.program.blueprints.map(function (blueprint) {
            return {
                name: blueprint.name,
                id: blueprint.id
            };
        })
    });
    viewModel.linkedBlueprint = ko.observable(undefined);
    viewModel.inputs = ko.computed(function () {
        onChangeObservable();
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
        onChangeObservable();
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

    function update() {
        var block = state.selectedBlock;
        // update the fields that can't be computed
        viewModel.blockName(block ? block.name : "");
        viewModel.linkedBlueprint((function () {
            if (block) {
                return viewModel.blueprints().find(function (blueprintVM) {
                    return blueprintVM.id == block.blueprint.id
                });
            } else {
                return undefined;
            }
        })())
    }

    function subscribe() {
        subscriptions.push(viewModel.blockName.subscribe((newValue) => {
            state.selectedBlock.setName(newValue);
            state.trigger(ChangeTopics.Blueprints);
        }));
        subscriptions.push(viewModel.linkedBlueprint.subscribe((newLinkedBlueprint) => {
            state.selectedBlock.blueprint = state.program.findBlueprint(newLinkedBlueprint.id);
            state.trigger(ChangeTopics.Blocks);
        }));

        // viewModel.inputs().forEach(function (inputObservable) {
        //     subscriptions.push(inputObservable.name.subscribe((newValue) => input.name = newValue));
        //     subscriptions.push(inputObservable.type.subscribe((newValue) => input.type = newValue));
        // })
    }

    state.listenMany([ChangeTopics.SelectedBlock, ChangeTopics.Blueprints, ChangeTopics.Blocks], function () {
        unsubscribe();
        onChangeObservable.valueHasMutated();
        update();
        subscribe();
    });

    state.listen(ChangeTopics.SelectedBlock, function () {
        viewModel.isEditingName(false);
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
                        state.popToModule(index);
                    }
                }
            })
    }

    vm.path = ko.observableArray(getPathViewModels());
    vm.current = ko.observable(state.currentModuleInfo().name);

    state.listen(ChangeTopics.ModulePath, function () {
        vm.path(getPathViewModels());
        vm.current(state.currentModuleInfo().name);
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