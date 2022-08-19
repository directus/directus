import VEmojiPicker from '../src/components/v-emoji-picker.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VEmojiPicker',
    component: VEmojiPicker,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-emoji-picker v-bind="args" v-on="args" >My Button</v-emoji-picker>',
});

export const Primary = Template.bind({});
Primary.args = {
};