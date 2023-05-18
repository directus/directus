<template>
	<v-drawer :model-value="isOpen" :title="title" persistent @cancel="cancel" @update:model-value="cancel">
		<field-detail-simple
			v-if="!showAdvanced"
			:collection="collectionInfo"
			:search="search"
			@save="save"
			@toggle-advanced="simple = false"
		/>

		<template v-if="showAdvanced" #sidebar>
			<field-detail-advanced-tabs v-model:current-tab="currentTab" />
		</template>

		<template v-if="showAdvanced" #actions>
			<field-detail-advanced-actions @save="save" />
		</template>
		<template v-else #actions>
			<v-input
				v-model="search"
				class="search"
				small
				autofocus
				type="search"
				:placeholder="t('search_field')"
				:full-width="false"
			>
				<template #prepend>
					<v-icon name="search" outline />
				</template>
				<template #append>
					<v-icon v-if="search" clickable class="clear" name="close" @click.stop="search = null" />
				</template>
			</v-input>
		</template>

		<field-detail-advanced v-if="showAdvanced" :collection="collectionInfo" :current-tab="currentTab[0]" @save="save" />
	</v-drawer>
</template>

<script setup lang="ts">
import { ref, computed, toRefs, watch } from 'vue';
import { LocalType } from '@directus/types';
import { useFieldDetailStore } from './store/';
import FieldDetailSimple from './field-detail-simple/field-detail-simple.vue';
import FieldDetailAdvanced from './field-detail-advanced/field-detail-advanced.vue';
import FieldDetailAdvancedTabs from './field-detail-advanced/field-detail-advanced-tabs.vue';
import FieldDetailAdvancedActions from './field-detail-advanced/field-detail-advanced-actions.vue';
import { useRouter } from 'vue-router';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useI18n } from 'vue-i18n';
import formatTitle from '@directus/format-title';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { storeToRefs } from 'pinia';
import { unexpectedError } from '@/utils/unexpected-error';

const props = withDefaults(
	defineProps<{
		collection: string;
		field: string;
		type: LocalType | null;
	}>(),
	{
		type: null,
	}
);

const { collection, field, type } = toRefs(props);

const search = ref<string | null>(null);

const isOpen = useDialogRoute();

const fieldDetail = useFieldDetailStore();

const { editing } = storeToRefs(fieldDetail);

watch(
	field,
	() => {
		fieldDetail.startEditing(collection.value, field.value, type.value ?? undefined);
	},
	{ immediate: true }
);

const collectionsStore = useCollectionsStore();
const fieldsStore = useFieldsStore();
const router = useRouter();
const { t } = useI18n();

const collectionInfo = computed(() => {
	return collectionsStore.getCollection(collection.value);
});

const simple = ref(props.type === null);

const title = computed(() => {
	const existingField = fieldsStore.getField(props.collection, props.field);
	const fieldName = existingField?.name || formatTitle(fieldDetail.field.name || '');

	if (props.field === '+' && fieldName === '') {
		return t('creating_new_field', { collection: collectionInfo.value?.name });
	} else {
		return t('field_in_collection', { field: fieldName, collection: collectionInfo.value?.name });
	}
});

const currentTab = ref(['schema']);

const showAdvanced = computed(() => {
	return editing.value !== '+' || !simple.value;
});

async function cancel() {
	await router.push(`/settings/data-model/${props.collection}`);
	fieldDetail.$reset();
}

async function save() {
	try {
		await fieldDetail.save();
	} catch (err: any) {
		unexpectedError(err);
		return;
	}

	router.push(`/settings/data-model/${props.collection}`);
	fieldDetail.$reset();
}
</script>

<style lang="scss" scoped>
:deep(.required-mark) {
	--v-icon-color: var(--primary);
}

.v-input.search {
	--border-radius: calc(44px / 2);
	width: 200px;
	margin-left: auto;

	@media (min-width: 600px) {
		width: 300px;
		margin-top: 0px;
	}
}
</style>
