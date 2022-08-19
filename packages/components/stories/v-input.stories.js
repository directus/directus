import VInput from '../src/components/v-input.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VInput',
    component: VInput,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-input v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
    modelValue: 'Shut up and take my money. 💸',
    disabled: false
};