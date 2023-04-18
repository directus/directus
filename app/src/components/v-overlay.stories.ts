import VOverlay from './v-overlay.vue';

document.body.classList.add('light');

export default {
	title: 'Components/VOverlay',
	component: VOverlay,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<div>This is hidden behind the overlay.</div><v-overlay v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});

Primary.args = {
	active: true,
};
