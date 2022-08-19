import VHighlight from '../src/components/v-highlight.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VHighlight',
    component: VHighlight,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-highlight v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
    text: 'The cake is a lie.',
    query: ['cake','lie'],
};