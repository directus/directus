import VCheckbox from '../src/components/v-checkbox.vue';
document.body.classList.add('light')

export default {
    title: 'Example/VCheckbox',
    component: VCheckbox,
    argTypes: {
        'modelValue': { action: 'updateModelValue' },
    },
};

const Template = (args) => ({
    setup() {
        return { args };
    },
    template: '<v-checkbox v-bind="args">My Checkbox</v-checkbox>',
});

export const Primary = Template.bind({});
Primary.args = {
    modelValue: true
};