import VButton from '../src/components/v-button.vue';
import { fix } from './fix-actions';

document.body.classList.add('light')

export default {
    title: 'Example/VButton',
    component: VButton,
    
    argTypes: {
        click: { action: 'clicked' },
    },
};

const Template = (args, {argTypes}) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-button v-bind="args" v-on="args">My Button{{args.onClick}}</v-button>',
});

export const Primary = Template.bind({});
Primary.args = {
};