/**
 * @param state {State}
 */
createSidePanelVM = function (state) {
    var viewModel = {};
    viewModel.messages = ko.observableArray([]);

    state.reporter.subscribe(function () {
        viewModel.messages(state.reporter.messages);

        var el = $(".messages")[0];
        el.scrollTop = el.scrollHeight;
    });

    function createBlockVM() {
        if (!state.selectedBlock) {
            return _noBlockVM();
        } else {
            var blockType = state.selectedBlock.getType();
            if (blockType == BlockTypes.Module) {
                return _createModuleBlockVM(state.selectedBlock, state);
            } else if (blockType == BlockTypes.Literal) {
                return _literalBlockVM(state.selectedBlock, state);
            } else {
                return _basicBlockVM(state.selectedBlock);
            }
        }
    }
    viewModel.selectedBlock = ko.observable(createBlockVM());

    state.listen(ChangeTopics.SelectedBlock, function () {
        viewModel.selectedBlock(createBlockVM());
    });

    return viewModel;
};

/**
 * @param input {Input}
 */
function _inputVM(input) {
    return {
        name:  ko.observable(input.name),
        type: ko.observable(input.type) // Type object
    };
}

/**
 * @param block {ModuleBlock}
 * @param state {State}
 */
function _createModuleBlockVM(block, state) {
    var viewModel = {};
    var subscriptions = [];
    var onChangeObservable = ko.observable();

    viewModel.isEditingName = ko.observable(false);
    viewModel.toggleEditingName = function () {
        viewModel.isEditingName(!viewModel.isEditingName());
    };
    viewModel.blockName = ko.observable(block.getName()); // String
    viewModel.modules = ko.computed(function () {
        onChangeObservable();
        return state.program.modules.map(function (module) {
            return {
                name: module.name,
                id: module.id
            };
        })
    });

    function findBlueprint() {
        return viewModel.modules().find(function (moduleVM) {
            return moduleVM.id == block.module.id
        });
    }
    viewModel.linkedBlueprint = ko.observable(findBlueprint());
    viewModel.inputs = ko.computed(function () {
        onChangeObservable();
        return block.getInputs().map(_inputVM);
    });

    viewModel.goToModule = function () {
        state.addModule(block.module);
    };

    function unsubscribe() {
        subscriptions.forEach((sub) => sub.dispose());
        subscriptions = [];
    }

    function update() {
        // update the fields that can't be computed
        viewModel.blockName(block.getName());
        viewModel.linkedBlueprint(findBlueprint());
    }

    function subscribe() {
        subscriptions.push(viewModel.blockName.subscribe((newValue) => {
            block.setName(newValue);
            state.trigger(ChangeTopics.Modules);
        }));
        subscriptions.push(viewModel.linkedBlueprint.subscribe((newLinkedBlueprint) => {
            block.setBlueprint(state.program.findBlueprint(newLinkedBlueprint.id));
            state.trigger(ChangeTopics.Blocks);
        }));
    }

    state.listenMany([ChangeTopics.Modules, ChangeTopics.Blocks], function () {
        unsubscribe();
        onChangeObservable.valueHasMutated();
        update();
        subscribe();
    });

    viewModel.addInput = function () {
        block.createInput();
        state.trigger(ChangeTopics.Modules);
    };

    viewModel.templateName = ko.observable(TemplateNames.module);

    subscribe();

    return viewModel;
}

function _literalBlockVM(block, state) {
    var viewModel = {};

    if (block.literalType == LiteralTypes.String) {
        viewModel.templateName = TemplateNames.stringLiteral;
    } else if (block.literalType == LiteralTypes.Number) {
        viewModel.templateName = TemplateNames.numericLiteral;
    }

    viewModel.value = ko.observable(block.getValue());

    viewModel.value.subscribe((value) => {
        block.setValue(value);
        state.trigger(ChangeTopics.Blocks);
    });

    return viewModel;
}

function _noBlockVM() {
    return {
        templateName: ko.observable(TemplateNames.empty)
    }
}

/**
 * @param block {BaseBlock}
 * @private
 */
function _basicBlockVM(block) {
    var viewModel = {};

    viewModel.blockName = block.getName();

    viewModel.blockType = block.getType();

    viewModel.inputs = block.getInputs().map(_inputVM);

    viewModel.templateName = TemplateNames.basic;

    return viewModel;
}

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
    vm.current = ko.observable(state.currentModule().name);

    state.listen(ChangeTopics.ModulePath, function () {
        vm.path(getPathViewModels());
        vm.current(state.currentModule().name);
    });
    return vm;
}

var TemplateNames = {
    empty: "no-selected-block-template",
    module: "module-block-template",
    basic: "basic-block-template",
    numericLiteral: "numeric-literal-block-template",
    stringLiteral: "string-literal-block-template"
};
