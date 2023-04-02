<template>
	<v-form
		v-model="internalEdits"
		:disabled="disabled"
		:loading="loading"
		:show-no-visible-fields="false"
		:initial-values="initialValues"
		:primary-key="currentPrimaryKey"
		:fields="fields"
		:validation-errors="validationErrors"
	/>
</template>

<script lang="ts" setup>
import api from '@/api';
import { computed, ref, toRefs, watch } from 'vue';
import { get, isEmpty } from 'lodash';
import { useRelationM2O } from '@/composables/use-relation-m2o';
import { getEndpoint } from '@directus/shared/utils';
import { unexpectedError } from '@/utils/unexpected-error';
import { useFieldsStore } from '@/stores/fields';

interface Props {
	value?: string | number | Record<string, any> | null;
	collection: string;
	field: string;
	disabled?: boolean;
	alwaysCreate?: boolean;
	removeEmpty?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	value: null,
	disabled: false,
});

const emit = defineEmits<{
	(e: 'input', value: Props['value']): void;
	(e: 'setFieldValue', value: any): void;
}>();

const { collection, field } = toRefs(props);
const fieldsStore = useFieldsStore();

const validationErrors = ref<any[]>([]);

const { relationInfo } = useRelationM2O(collection, field);
const fields = computed(() =>
	relationInfo.value?.relatedCollection.collection
		? fieldsStore.getFieldsForCollection(relationInfo.value?.relatedCollection.collection)
		: []
);

const currentPrimaryKey = computed<string | number>(() => {
	if (!props.value || !relationInfo.value) return '+';

	if (typeof props.value === 'number' || typeof props.value === 'string') {
		return props.value;
	}

	return get(props.value, relationInfo.value.relatedPrimaryKeyField.field, '+');
});

const { internalEdits, loading, initialValues, fetchItem } = useItem();

watch(
	internalEdits,
	() => {
		if (!relationInfo.value) return;

		if (!isEmpty(internalEdits.value)) {
			const item = internalEdits.value;

			if (currentPrimaryKey.value !== '+') {
				item[relationInfo.value.relatedPrimaryKeyField.field] = currentPrimaryKey.value;
			}

			emit('input', item);
		}
	},
	{ deep: true }
);

watch(
	() => props.value,
	() => {
		if (!relationInfo.value) return;

		if (
			get(initialValues.value, relationInfo.value.relatedPrimaryKeyField.field) === props.value &&
			currentPrimaryKey.value !== '+'
		) {
			fetchItem();
		}
	}
);

function useItem() {
	const internalEdits = ref<Record<string, any>>({});
	const loading = ref(false);
	const initialValues = ref<Record<string, any> | null>(null);

	watch(
		[currentPrimaryKey, relationInfo],
		() => {
			if (currentPrimaryKey.value !== '+') fetchItem();
		},
		{ immediate: true }
	);

	return { internalEdits, loading, initialValues, fetchItem };

	async function fetchItem() {
		if (!currentPrimaryKey.value || !relationInfo.value) return;

		loading.value = true;

		const baseEndpoint = getEndpoint(relationInfo.value.relatedCollection.collection);
		const endpoint = relationInfo.value.relatedCollection.collection.startsWith('directus_')
			? `${baseEndpoint}/${currentPrimaryKey.value}`
			: `${baseEndpoint}/${encodeURIComponent(currentPrimaryKey.value)}`;

		let fields = '*';

		try {
			const response = await api.get(endpoint, { params: { fields } });

			initialValues.value = response.data.data;
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			loading.value = false;
			internalEdits.value = {};
		}
	}
}
</script>
