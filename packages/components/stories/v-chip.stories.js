import VChip from '../src/components/v-chip.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VChip',
    component: VChip,
    argTypes: {
        close: { 'control': 'boolean' }
    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-chip v-bind="args" v-on="args" >Cake</v-chip>',
});

export const Primary = Template.bind({});
Primary.args = {
};