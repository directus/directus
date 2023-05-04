import VRadio from './v-radio.vue';

document.body.classList.add('light');

export default {
	title: 'Components/VRadio',
	component: VRadio,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-radio v-bind="args" v-on="args"/>',
});

export const Primary = Template.bind({});

Primary.args = {
	value: '1',
	label: 'My Radio',
	modelValue: '1',
};
