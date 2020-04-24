import withPadding from '../../../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import readme from './readme.md';
import SearchInput from './search-input.vue';
import RawValue from '../../../../../.storybook/raw-value.vue';

export default {
	title: 'Views / Private / Components / Search Input',
	decorators: [withPadding],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		components: { SearchInput, RawValue },
		props: {},
		setup() {
			const value = ref(null);
			return { value };
		},
		template: `
			<div>
				<search-input v-model="value" />
				<raw-value>{{ value }}</raw-value>
			</div>
		`,
	});
