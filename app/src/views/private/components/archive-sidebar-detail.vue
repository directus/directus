<template>
	<sidebar-detail icon="archive" :title="t('archive')" :badge="active">
		<div class="fields">
			<div class="field full">
				<v-radio
					v-for="item in items"
					:key="item.value"
					:value="item.value"
					:label="item.text"
					:model-value="selectedItem"
					@update:model-value="selectedItem = $event"
				/>
			</div>
		</div>
	</sidebar-detail>
</template>

<script setup lang="ts">
import { computed, ref, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const props = defineProps<{
	collection?: string;
	archive?: string;
}>();

const { t } = useI18n();

const router = useRouter();

const selectedItem = ref<string | undefined>(props.archive);

const items = [
	{
		text: t('show_active_items'),
		value: null,
	},
	{ text: t('show_archived_items'), value: 'archived' },
	{ text: t('show_all_items'), value: 'all' },
];

const active = computed(() => !!unref(selectedItem));

watch(selectedItem, () => {
	const url = new URL(unref(router.currentRoute).fullPath, window.location.origin);

	url.searchParams.delete('archived');
	url.searchParams.delete('all');

	const selectedItemValue = unref(selectedItem);

	if (selectedItemValue) {
		url.searchParams.set(selectedItemValue, '');
	}

	router.push(url.pathname + url.search);
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

	.v-radio + .v-radio {
		margin-top: 8px;
	}
}
</style>
