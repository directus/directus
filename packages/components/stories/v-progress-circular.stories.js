import VProgressCircular from '../src/components/v-progress-circular.vue';
document.body.classList.add('light')

export default {
    title: 'Example/VProgressCircular',
    component: VProgressCircular,
    argTypes: {

    },
};

const Template = (args) => ({
    setup() {
        return { args };
    },
    template: '<v-progress-circular v-bind="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
    value: 70
};