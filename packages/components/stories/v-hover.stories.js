import VHover from '../src/components/v-hover.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VHover',
    component: VHover,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-hover v-bind="args" v-on="args" v-slot="{ hover }">Hover me!<div v-if="hover">This is only shown on hover.</div></v-hover>',
});

export const Primary = Template.bind({});
Primary.args = {
};