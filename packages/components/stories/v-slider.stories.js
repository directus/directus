import VSlider from '../src/components/v-slider.vue';

document.body.classList.add('light')

// More on default export: https://storybook.js.org/docs/vue/writing-stories/introduction#default-export
import { fix } from './fix-actions';

export default {
  title: 'Example/VSlider',
  component: VSlider,
  // More on argTypes: https://storybook.js.org/docs/vue/api/argtypes
  argTypes: {
    'update:modelValue': { action: 'update:modelValue' },
  },
};

// More on component templates: https://storybook.js.org/docs/vue/writing-stories/introduction#using-args
const Template = (args, { argTypes }) => ({
  // The story's `args` need to be mapped into the template through the `setup()` method
  setup() {
    return { args: fix(args, argTypes) };
  },
  // And then the `args` are bound to your component with `v-bind="args" v-on="args"`
  template: '<v-slider v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/vue/writing-stories/args
Primary.args = {
  modelValue: 50,
};