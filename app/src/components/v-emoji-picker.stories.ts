import VEmojiPicker from './v-emoji-picker.vue';
document.body.classList.add('light');

export default {
	title: 'Components/VEmojiPicker',
	component: VEmojiPicker,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-emoji-picker v-bind="args" v-on="args" >My Button</v-emoji-picker>',
});

export const Primary = Template.bind({});
Primary.args = {};
