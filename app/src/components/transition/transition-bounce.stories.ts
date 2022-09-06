import TransitionBounce from './bounce.vue';
document.body.classList.add('light');

export default {
	title: 'Components/Transition/TransitionBounce',
	component: TransitionBounce,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template:
		'<v-hover v-slot="{ hover }">Hover me!<transition-bounce v-bind="args" v-on="args"><div v-if="hover" style="background-color: var(--background-normal); height: 200px; width: 400px; display: flex; justify-content: center; align-items: center">This is only shown on hover.</div></transition-bounce></v-hover>',
});

export const Primary = Template.bind({});
Primary.args = {};
