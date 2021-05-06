<template>
	<v-notice class="full" type="warning" v-if="collection === null">
		{{ $t('interfaces.one-to-many.no_collection') }}
	</v-notice>
	<div v-else class="form-grid">
		<div class="field full">
			<p class="type-label">{{ $t('interfaces.many-to-one.display_template') }}</p>
			<v-field-template :collection="collection" v-model="template" :depth="1"></v-field-template>
		</div>

		<div class="field half-left">
			<p class="type-label">{{ $t('creating_items') }}</p>
			<v-checkbox block :label="$t('enable_create_button')" v-model="enableCreate" />
		</div>

		<div class="field half-right">
			<p class="type-label">{{ $t('selecting_items') }}</p>
			<v-checkbox block :label="$t('enable_select_button')" v-model="enableSelect" />
		</div>
	</div>
</template>

<script lang="ts">
import { Field } from '@/types';
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Relation } from '@/types/relations';
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
		relations: {
			type: Array as PropType<Relation[]>,
			default: () => [],
		},
		value: {
			type: Object as PropType<any>,
			default: null,
		},
	},
	setup(props, { emit }) {
		const template = computed({
			get() {
				return props.value?.displayTemplate;
			},
			set(newTemplate: string) {
				emit('input', {
					...(props.value || {}),
					displayTemplate: newTemplate,
				});
			},
		});

		const enableCreate = computed({
			get() {
				return props.value?.enableCreate ?? true;
			},
			set(val: boolean) {
				emit('input', {
					...(props.value || {}),
					enableCreate: val,
				});
			},
		});

		const enableSelect = computed({
			get() {
				return props.value?.enableSelect ?? true;
			},
			set(val: boolean) {
				emit('input', {
					...(props.value || {}),
					enableSelect: val,
				});
			},
		});

		return { template, enableCreate, enableSelect };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.form-grid {
	@include form-grid;
}
</style>
