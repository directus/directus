import VButton from './v-button.vue';

document.body.classList.add('light');

export default {
	title: 'Components/VButton',
	component: VButton,

	argTypes: {
		click: { action: 'clicked' },
	},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-button v-bind="args" v-on="args">My Button{{args.onClick}}</v-button>',
});

export const Primary = Template.bind({});

Primary.args = {};
