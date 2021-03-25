<template>
	<sidebar-detail icon="save_alt" :title="$t('export_data')">
		<div class="fields">
			<div class="field full">
				<p class="type-label">{{ $t('format') }}</p>
				<v-select
					:items="[
						...[
							{
								text: $t('csv'),
								value: 'csv',
							},
							{
								text: $t('json'),
								value: 'json',
							},
						],
						// enable XLIFF for translatable content only
						...(translatable
							? [
									{
										text: $t('xliff'),
										value: 'xliff',
									},
									{
										text: $t('xliff2'),
										value: 'xliff2',
									},
							  ]
							: []),
					]"
					v-model="format"
				/>
				<v-checkbox v-model="useFilters" :label="$t('use_current_filters_settings')" />
			</div>
			<div class="field full">
				<v-button full-width @click="exportData">
					{{ $t('export_collection', { collection: collection.name }) }}
				</v-button>
			</div>
		</div>
	</sidebar-detail>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from '@vue/composition-api';
import { Collection } from '@/types';
import { useFieldsStore, useUserStore } from '@/stores/';
import { Field } from '@/types';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';

export default defineComponent({
	props: {
		layoutQuery: {
			type: Object,
			default: () => ({}),
		},
		searchQuery: {
			type: String,
			default: null,
		},
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
	},
	computed: {
		translatable(): boolean {
			const fieldsStore = useFieldsStore();
			const fields = fieldsStore.getFieldsForCollection(this.collection.collection);
			return fields.some((field: Field) => field.type === 'translations');
		},
	},
	setup(props) {
		const format = ref('csv');
		const useFilters = ref(true);

		return { format, useFilters, exportData };

		function exportData() {
			const url = getRootPath() + `items/${props.collection.collection}`;

			let params: Record<string, any> = {
				access_token: api.defaults.headers.Authorization.substring(7),
			};

			switch (format.value) {
				case 'csv':
					params.export = 'csv';
					break;
				case 'json':
					params.export = 'json';
					break;
				case 'xliff':
				case 'xliff2':
					const userStore = useUserStore();
					const user = userStore.state.currentUser;
					params.language = (user && user.language) || 'en-US';
					params.export = format.value;
					break;
			}

			if (useFilters.value === true) {
				params = {
					...params,
					...props.layoutQuery,
				};

				if (props.searchQuery) {
					params.search = props.searchQuery;
				}
			}

			const qs = Object.keys(params)
				.map((key) => `${key}=${params[key]}`)
				.join('&');

			window.open(`${url}?${qs}`);
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.fields {
	--form-vertical-gap: 24px;

	@include form-grid;

	.type-label {
		font-size: 1rem;
	}
}

.v-checkbox {
	margin-top: 8px;
}
</style>
