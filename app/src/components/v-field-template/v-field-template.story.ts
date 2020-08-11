import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import { withKnobs } from '@storybook/addon-knobs';
import fullWidth from '../../../.storybook/decorators/full-width';
import readme from './readme.md';
import RawValue from '../../../.storybook/raw-value.vue';

import { useFieldsStore, useCollectionsStore, useRelationsStore } from '@/stores/';

import fields from '../../../.storybook/mock-data/fields.json';
import collections from '../../../.storybook/mock-data/collections.json';
import relations from '../../../.storybook/mock-data/relations.json';

export default {
	title: 'Components / Field Template',
	decorators: [withPadding, withKnobs, fullWidth],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		components: { RawValue },
		setup() {
			const req = {};
			const fieldsStore = useFieldsStore(req);
			const collectionsStore = useCollectionsStore(req);
			const relationsStore = useRelationsStore(req);

			// eslint-disable-next-line
			fieldsStore.state = fields as any;

			// eslint-disable-next-line
			collectionsStore.state = collections as any;

			// eslint-disable-next-line
			relationsStore.state = relations as any;

			const value = ref<string>('{{first_name}} ({{ last_name }})');
			return { value };
		},
		template: `
			<div>
				<v-field-template  v-model="value" collection="staff" />
				<raw-value>{{ value }}</raw-value>
				<portal-target name="outlet" />
			</div>
		`,
	});
