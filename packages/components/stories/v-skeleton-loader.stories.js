import VSkeletonLoader from '../src/components/v-skeleton-loader.vue';
document.body.classList.add('light')

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

const Template = (args) => ({
    setup() {
        return { args };
    },
    template: '<v-skeleton-loader v-bind="args"  />',
});

export const Primary = Template.bind({});
Primary.args = {
};