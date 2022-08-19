import VListItem from '../src/components/v-list-item.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VListItem',
    component: VListItem,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: `
<v-list-item v-bind="args" v-on="args" >List Item 1</v-list-item>
    `,
});

export const Primary = Template.bind({});
Primary.args = {
    
};