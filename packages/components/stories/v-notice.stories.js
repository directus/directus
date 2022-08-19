import VNotice from '../src/components/v-notice.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VNotice',
    component: VNotice,
    argTypes: {
        type: {
            control: { type: 'select', options: ['normal','info', 'success', 'warning', 'danger'] },
        }
    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-notice v-bind="args" v-on="args" >Making a pizza ist best done without ordering a pizza.</v-notice>',
});

export const Primary = Template.bind({});
Primary.args = {
};