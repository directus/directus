import VSkeletonLoader from '../src/components/v-skeleton-loader.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VSkeletonLoader',
    component: VSkeletonLoader,
    argTypes: {
        type: {
            control: {
                type: 'select',
                options: ['input','input-tall','block-list-item','block-list-item-dense','text','list-item-icon']
            }
        }
    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-skeleton-loader v-bind="args" v-on="args"  />',
});

export const Primary = Template.bind({});
Primary.args = {
};