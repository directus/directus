import VPagination from '../src/components/v-pagination.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VPagination',
    component: VPagination,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-pagination v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
    length: 7,
    totalVisible: 4,
    modelValue: 3
};