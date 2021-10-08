<template>
	<div class="form-grid">
		<div class="field full">
			<p class="type-label">{{ t('interfaces.presentation-links.links') }}</p>
			<interface-list
				:collection="collection"
				:value="links"
				:placeholder="t('title')"
				template="{{ label }}"
				:fields="fields"
				@input="links = $event"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { Field } from '@directus/shared/types';
import { defineComponent, PropType, computed } from 'vue';
export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		fieldData: {
			type: Object as PropType<Field>,
			default: null,
		},
		value: {
			type: Object as PropType<Record<string, any>>,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const links = computed({
			get() {
				return props.value?.links;
			},
			set(newLinks: string) {
				emit('input', {
					...(props.value || {}),
					links: newLinks,
				});
			},
		});

		const fields = computed(() => {
			return [
				{
					field: 'label',
					type: 'string',
					name: '$t:label',
					meta: {
						width: 'full',
						interface: 'input',
						options: {
							placeholder: '$t:label',
						},
					},
				},
				{
					field: 'icon',
					name: '$t:icon',
					type: 'string',
					meta: {
						width: 'half',
						interface: 'select-icon',
					},
				},
				{
					field: 'type',
					name: '$t:type',
					type: 'string',
					meta: {
						width: 'half',
						interface: 'select-dropdown',
						default_value: 'normal',
						options: {
							choices: [
								{ text: '$t:primary', value: 'primary' },
								{ text: '$t:normal', value: 'normal' },
								{ text: '$t:info', value: 'info' },
								{ text: '$t:success', value: 'success' },
								{ text: '$t:warning', value: 'warning' },
								{ text: '$t:danger', value: 'danger' },
							],
						},
					},
					schema: {
						default_value: 'normal',
					},
				},
				{
					field: 'url',
					type: 'string',
					name: '$t:url',
					meta: {
						width: 'full',
						interface: 'system-display-template',
						options: {
							collectionName: props.collection,
							font: 'monospace',
							placeholder: 'https://example.com/articles/{{ id }}/{{ slug }}',
						},
					},
				},
			];
		});

		return { t, links, fields };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.form-grid {
	@include form-grid;
}
</style>
