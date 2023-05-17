<template>
	<div>
		<v-skeleton-loader v-if="loading" type="text" />
		<iframe v-if="!loading" :width="widthAttribute" :height="heightAttribute" :src="displayUrl"></iframe>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, computed } from 'vue';
import { useItem } from '@/composables/use-item';
import { Field } from '@directus/types';
import { renderStringTemplate } from '@/utils/render-string-template';

export default defineComponent({
	props: {
		fieldData: {
			type: Object as PropType<Field | undefined>,
			default: undefined,
		},
		value: {
			type: Array as PropType<Record<string, any>[]>,
			default: null,
		},
		primaryKey: {
			type: [Number, String],
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		urlAttribute: {
			type: String,
			default: '',
		},
		widthAttribute: {
			type: String,
			default: '800',
		},
		heightAttribute: {
			type: String,
			default: '600',
		},
		collection: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { collection, primaryKey } = toRefs(props);
		const { item, loading } = useItem(collection, primaryKey);
		const templateWithDefaults = computed(() => props.urlAttribute);

		const displayUrl = computed(() => {
			if (loading.value) return;
			const { displayValue } = renderStringTemplate(templateWithDefaults, {
				id: primaryKey.value,
				active_field: props.fieldData.meta.active_field,
				...item.value,
			});
			return displayValue.value;
		});

		return {
			loading,
			displayUrl,
		};
	},
});
</script>
