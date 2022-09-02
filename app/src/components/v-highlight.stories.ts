import VHighlight from './v-highlight.vue';
document.body.classList.add('light');

export default {
	title: 'Components/VHighlight',
	component: VHighlight,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-highlight v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
	text: 'The cake is a lie.',
	query: ['cake', 'lie'],
};
