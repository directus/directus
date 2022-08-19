import VProgressLinear from '../src/components/v-progress-linear.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VProgressLinear',
    component: VProgressLinear,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-progress-linear v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
    value: 70,
    colorful: true
};