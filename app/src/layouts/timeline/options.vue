<template>
	<div class="field">
		<div class="type-label">{{ t('layouts.timeline.date') }}</div>
		<v-select v-model="dateSync" item-value="field" item-text="name" :items="fieldGroups.date" />
	</div>

	<div v-if="timeFieldRequired" class="field">
		<div class="type-label">{{ t('layouts.timeline.time') }}</div>
		<v-select v-model="timeSync" item-value="field" item-text="name" :items="fieldGroups.time" />
	</div>

	<div class="field">
		<div class="type-label">{{ t('layouts.timeline.title') }}</div>
		<v-field-template v-model="titleSync" :collection="collection" />
	</div>

	<div class="field">
		<div class="type-label">{{ t('layouts.timeline.user') }}</div>
		<v-select v-model="userSync" show-deselect item-value="field" item-text="name" :items="fieldGroups.user" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType } from 'vue';

import { Field } from '@directus/shared/types';
import { useSync } from '@directus/shared/composables';

export default defineComponent({
	inheritAttrs: false,
	props: {
		collection: {
			type: String,
			required: true,
		},
		fieldGroups: {
			type: Object as PropType<Record<string, Field[]>>,
			default: () => ({}),
		},
		dateField: {
			type: String,
			default: null,
		},
		timeField: {
			type: String,
			default: null,
		},
		title: {
			type: String,
			default: null,
		},
		userField: {
			type: String,
			default: null,
		},
		timeFieldRequired: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:dateField', 'update:timeField', 'update:title', 'update:userField'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const dateSync = useSync(props, 'dateField', emit);
		const timeSync = useSync(props, 'timeField', emit);
		const titleSync = useSync(props, 'title', emit);
		const userSync = useSync(props, 'userField', emit);

		return { t, dateSync, timeSync, titleSync, userSync };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.nested-options {
	@include form-grid;
}
</style>
