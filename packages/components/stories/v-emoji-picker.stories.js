import VEmojiPicker from '../src/components/v-emoji-picker.vue';
document.body.classList.add('light')

export default {
    title: 'Example/VEmojiPicker',
    component: VEmojiPicker,
    argTypes: {

    },
};

const Template = (args) => ({
    setup() {
        return { args };
    },
    template: '<v-emoji-picker v-bind="args" >My Button</v-emoji-picker>',
});

export const Primary = Template.bind({});
Primary.args = {
};