import VTextarea from './v-textarea.vue';

document.body.classList.add('light');

export default {
	title: 'Components/VTextarea',
	component: VTextarea,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-textarea v-bind="args" v-on="args" >My Button</v-textarea>',
});

export const Primary = Template.bind({});

Primary.args = {
	modelValue: `This is some text that will be displayed in the textarea.
This is a new line.`,
};
