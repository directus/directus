import VProgressCircular from '../src/components/v-progress-circular.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VProgressCircular',
    component: VProgressCircular,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-progress-circular v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
    value: 70
};