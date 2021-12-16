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

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { computed, defineComponent, watch, ref } from 'vue';

export default defineComponent({
	props: {
		collection: {
			type: String,
			default: null,
		},
		archive: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const router = useRouter();

		const selectedItem = ref<string | null>(props.archive);

		const items = [
			{
				text: t('show_active_items'),
				value: null,
			},
			{ text: t('show_archived_items'), value: 'archived' },
			{ text: t('show_all_items'), value: 'all' },
		];

		const active = computed(() => selectedItem.value !== null);

		watch(
			() => selectedItem.value,
			() => {
				if (selectedItem.value === null) {
					router.push(`/content/${props.collection}`);
				} else {
					router.push(`/content/${props.collection}?${selectedItem.value}`);
				}
			}
		);

		return { t, active, selectedItem, items };
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

	.v-radio + .v-radio {
		margin-top: 8px;
	}
}
</style>
