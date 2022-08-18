import VHighlight from '../src/components/v-highlight.vue';
document.body.classList.add('light')

export default {
    title: 'Example/VHighlight',
    component: VHighlight,
    argTypes: {

    },
};

const Template = (args) => ({
    setup() {
        return { args };
    },
    template: '<v-highlight v-bind="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
    text: 'The cake is a lie.',
    query: ['cake','lie'],
};