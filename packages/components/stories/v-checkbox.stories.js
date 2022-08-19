import VCheckbox from '../src/components/v-checkbox.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VCheckbox',
    component: VCheckbox,
    argTypes: {
        'modelValue': { action: 'updateModelValue' },
    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-checkbox v-bind="args" v-on="args">My Checkbox</v-checkbox>',
});

export const Primary = Template.bind({});
Primary.args = {
    modelValue: true
};