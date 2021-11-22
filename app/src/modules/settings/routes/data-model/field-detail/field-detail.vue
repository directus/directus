<template>
	<v-drawer :model-value="isOpen" :title="title" persistent @cancel="cancel" @update:model-value="cancel">
		<field-detail-simple
			v-if="!showAdvanced"
			:collection="collectionInfo"
			@save="save"
			@toggleAdvanced="simple = false"
		/>

		<template v-if="showAdvanced" #sidebar>
			<field-detail-advanced-tabs v-model:current-tab="currentTab" />
		</template>

		<template v-if="showAdvanced" #actions>
			<field-detail-advanced-actions @save="save" />
		</template>

		<field-detail-advanced v-if="showAdvanced" :collection="collectionInfo" :current-tab="currentTab[0]" @save="save" />
	</v-drawer>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, toRefs, watch } from 'vue';
import { LocalType } from '@directus/shared/types';
import { useFieldDetailStore } from './store/';
import FieldDetailSimple from './field-detail-simple/field-detail-simple.vue';
import FieldDetailAdvanced from './field-detail-advanced/field-detail-advanced.vue';
import FieldDetailAdvancedTabs from './field-detail-advanced/field-detail-advanced-tabs.vue';
import FieldDetailAdvancedActions from './field-detail-advanced/field-detail-advanced-actions.vue';
import { useRouter } from 'vue-router';
import { useCollectionsStore, useFieldsStore } from '@/stores';
import { useI18n } from 'vue-i18n';
import formatTitle from '@directus/format-title';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { storeToRefs } from 'pinia';

export default defineComponent({
	name: 'FieldDetail',
	components: { FieldDetailSimple, FieldDetailAdvanced, FieldDetailAdvancedTabs, FieldDetailAdvancedActions },
	props: {
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		type: {
			type: String as PropType<LocalType>,
			default: null,
		},
	},
	setup(props) {
		const { collection } = toRefs(props);

		const isOpen = useDialogRoute();

		const fieldDetail = useFieldDetailStore();

		const { editing } = storeToRefs(fieldDetail);

		watch(
			() => props.field,
			() => fieldDetail.startEditing(props.collection, props.field, props.type),
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

		return { simple, cancel, collectionInfo, t, title, save, isOpen, currentTab, showAdvanced };

		async function cancel() {
			await router.push(`/settings/data-model/${props.collection}`);
			fieldDetail.$reset();
		}

		async function save() {
			await fieldDetail.save();
			router.push(`/settings/data-model/${props.collection}`);
			fieldDetail.$reset();
		}
	},
});
</script>

<style scoped>
:deep(.required-mark) {
	--v-icon-color: var(--primary);
}
</style>
