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

watch(props, () => {
	selectedItem.value = props.archive;
});

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

<template>
	<sidebar-detail icon="archive" :title="$t('archive')" :badge="active">
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

<style lang="scss" scoped>
@use '@/styles/mixins';

.fields {
	--theme--form--row-gap: 24px;

	@include mixins.form-grid;

	.type-label {
		font-size: 1rem;
	}

	.v-radio + .v-radio {
		margin-block-start: 8px;
	}
}
</style>
