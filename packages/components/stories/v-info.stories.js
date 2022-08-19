import VInfo from '../src/components/v-info.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VInfo',
    component: VInfo,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-info v-bind="args" v-on="args" >You have sadly eaten all the cookies!</v-info>',
});

export const Primary = Template.bind({});
Primary.args = {
    title: 'No more cookies',
    icon: 'cookie'
};