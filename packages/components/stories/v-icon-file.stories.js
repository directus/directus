import VIconFile from '../src/components/v-icon-file.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VIconFile',
    component: VIconFile,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-icon-file v-bind="args" v-on="args" >My Button</v-icon-file>',
});

export const Primary = Template.bind({});
Primary.args = {
    ext: "png"
};