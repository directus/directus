import VList from '../src/components/v-list.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VList',
    component: VList,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: `
<v-list v-bind="args" v-on="args" >
    <v-list-item>Item 1 </v-list-item>
    <v-list-item>Item 2 </v-list-item>
    <v-list-item>Item 3 </v-list-item>
</v-list>
    `,
});

export const Primary = Template.bind({});
Primary.args = {
    modelValue: [1]
};