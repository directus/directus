import VDivider from '../src/components/v-divider.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VDivider',
    component: VDivider,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-divider v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
};