import TransitionExpand from './expand.vue';

document.body.classList.add('light');

export default {
	title: 'Components/Transition/TransitionExpand',
	component: TransitionExpand,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template:
		'<v-hover v-slot="{ hover }">Hover me!<transition-expand v-bind="args" v-on="args"><div v-if="hover" style="background-color: var(--background-normal); height: 200px; width: 400px; display: flex; justify-content: center; align-items: center">This is only shown on hover.</div></transition-expand></v-hover>',
});

export const Primary = Template.bind({});

Primary.args = {};
