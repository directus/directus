import VTextOverflow from '../src/components/v-text-overflow.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VTextOverflow',
    component: VTextOverflow,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-text-overflow v-bind="args" v-on="args"></v-text-overflow>',
});

export const Primary = Template.bind({});
Primary.args = {
    text: "This text should not wrap to a new line!"
};