import withPadding from '../../../.storybook/decorators/with-padding';
import readme from './readme.md';
import { defineComponent } from '@vue/composition-api';
import { withKnobs, select } from '@storybook/addon-knobs';

export default {
	title: 'Components / Info',
	decorators: [withPadding, withKnobs],
	parameters: { notes: readme },
};

export const basic = () =>
	defineComponent({
		props: {
			type: {
				default: select('Type', ['info', 'success', 'warning', 'danger'], 'info'),
			},
		},
		template: `
			<v-info :type="type" title="No Collections" icon="box">
				It looks like you don’t have any Collections yet.
				Fortunately, it’s very easy to create one — click the button below to get started.
				<template #append>
					<v-button>Create Collection</v-button>
				</template>
			</v-info>
		`,
	});
