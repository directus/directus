import VRadio from '../src/components/v-radio.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VRadio',
    component: VRadio,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-radio v-bind="args" v-on="args"/>',
});

export const Primary = Template.bind({});
Primary.args = {
    value: '1',
    label: 'My Radio',
    modelValue: '1'
};