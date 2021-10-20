<template>
	<field-detail-simple v-if="simple" :collection="collectionInfo" :title="title" @cancel="cancel" @save="save" />
	<field-detail-full v-else :collection="collectionInfo" :title="title" @cancel="cancel" @save="save" />
</template>

<script lang="ts">
import { defineComponent, PropType, ref, onUnmounted, computed, toRefs } from 'vue';
import { LocalType } from '@directus/shared/types';
import { useFieldDetailStore } from './store';
import FieldDetailSimple from './field-detail-simple/field-detail-simple.vue';
import FieldDetailFull from './field-detail-full/field-detail-full.vue';
import { useRouter } from 'vue-router';
import { useCollectionsStore, useFieldsStore } from '@/stores';
import { useI18n } from 'vue-i18n';
import formatTitle from '@directus/format-title';

export default defineComponent({
	name: 'FieldDetail',
	components: { FieldDetailSimple, FieldDetailFull },
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

		const fieldDetail = useFieldDetailStore();

		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const router = useRouter();
		const { t } = useI18n();

		const collectionInfo = computed(() => {
			return collectionsStore.getCollection(collection.value);
		});

		const simple = computed(() => {
			return props.field === '+' && !props.type;
		});

		const title = computed(() => {
			const existingField = fieldsStore.getField(props.collection, props.field);
			const fieldName = existingField?.name || formatTitle(fieldDetail.field.name || '');

			if (props.field === '+' && fieldName === '') {
				return t('creating_new_field', { collection: collectionInfo.value?.name });
			} else {
				return t('field_in_collection', { field: fieldName, collection: collectionInfo.value?.name });
			}
		});

		return { simple, cancel, collectionInfo, t, title, save };

		function cancel() {
			fieldDetail.$reset();
			router.push(`/settings/data-model/${props.collection}`);
		}

		async function save() {
			await fieldDetail.save();
			router.push(`/settings/data-model/${props.collection}`);
		}
	},
});
</script>
