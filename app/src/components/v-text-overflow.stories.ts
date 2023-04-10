import VTextOverflow from './v-text-overflow.vue';
document.body.classList.add('light');

export default {
	title: 'Components/VTextOverflow',
	component: VTextOverflow,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-text-overflow v-bind="args" v-on="args"></v-text-overflow>',
});

export const Primary = Template.bind({});
Primary.args = {
	text: 'This text should not wrap to a new line!',
};
