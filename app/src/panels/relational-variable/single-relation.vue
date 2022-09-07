<template>
	<!-- <v-notice v-if="!relationInfo" type="warning">
			{{ t('relationship_not_setup') }}
		</v-notice>
		<v-notice v-else-if="!displayTemplate" type="warning">
			{{ t('display_template_not_setup') }}
		</v-notice>
		<v-notice v-else-if="!displayItem">
			{{ t('no_items') }}
		</v-notice> -->
	<div class="many-to-one">
		<v-skeleton-loader v-if="loading" type="input" />
		<v-input v-else clickable :placeholder="t('select_an_item')" @click="$emit('select')">
			<template v-if="displayItem" #input>
				<div class="preview">
					<render-template :collection="collection" :item="displayItem" :template="displayTemplate || `{{ id }}`" />
				</div>
			</template>

			<template #append>
				<template v-if="displayItem">
					<v-icon v-tooltip="t('deselect')" name="close" class="deselect" @click.stop="$emit('input', [])" />
				</template>
				<template v-else>
					<v-icon class="expand" name="expand_more" />
				</template>
			</template>
		</v-input>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getEndpoint, getFieldsFromTemplate } from '@directus/shared/utils';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { useApi } from '@directus/shared/composables';

interface Props {
	value: (string | number)[];
	collection: string;
	template: string;
	filter: Record<string, any>;
}
const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(['input', 'select']);

const collectionsStore = useCollectionsStore();
const fieldStore = useFieldsStore();
const api = useApi();

const { t } = useI18n();
const loading = ref(false);

const displayItem = ref<Record<string, any> | undefined>(undefined);
watch(() => props.value, getDisplayItems, { immediate: true });

const displayTemplate = computed(() => {
	if (props.template) return props.template;

	const displayTemplate = collectionsStore.getCollection(props.collection)?.meta?.display_template;
	const pkField = fieldStore.getPrimaryKeyFieldForCollection(props.collection);

	return displayTemplate || `{{ ${pkField?.field || 'id'} }}`;
});
const requiredFields = computed(() => {
	if (!displayTemplate.value || !props.collection) return [];
	return adjustFieldsForDisplays(getFieldsFromTemplate(displayTemplate.value), props.collection);
});

async function getDisplayItems() {
	if (props.value.length === 0) {
		displayItem.value = undefined;
		return;
	}

	const pkField = fieldStore.getPrimaryKeyFieldForCollection(props.collection);
	if (!props.collection || !pkField) return;

	const fields = new Set(requiredFields.value);
	fields.add(pkField.field);

	loading.value = true;

	try {
		const response = await api.get(getEndpoint(props.collection) + `/${encodeURIComponent(props.value[0])}`, {
			params: {
				fields: Array.from(fields),
			},
		});

		displayItem.value = response.data.data;
	} catch (err: any) {
		// eslint-disable-next-line no-console
		console.error(err);
	} finally {
		loading.value = false;
	}
}
</script>

<style lang="scss" scoped>
.preview {
	flex-grow: 1;
}
</style>
