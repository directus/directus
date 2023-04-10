<template>
	<div>
		<v-skeleton-loader v-if="loading"></v-skeleton-loader>
		<v-select v-else :model-value="value" :items="options" @update:model-value="onSelect" />
		<drawer-collection
			v-if="collection !== null"
			:active="collection !== null"
			:collection="collection"
			@update:active="collection = null"
			@input="onSelectItem"
		/>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { computed, defineComponent, ref, watch } from 'vue';
import DrawerCollection from '@/views/private/components/drawer-collection.vue';
import api from '@/api';
import { userName } from '@/utils/user-name';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	components: {
		DrawerCollection,
	},
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const collection = ref<string | null>(null);
		const itemName = ref<string | null>(null);
		const loading = ref(false);

		const isItem = computed(
			() => props.value !== null && (props.value.startsWith('role_') || props.value.startsWith('user_'))
		);

		watch(() => props.value, loadItemName);

		loadItemName();

		const options = computed(() => {
			let options: any[] = [
				{
					text: t('global') + ': ' + t('all_users'),
					value: 'all',
				},
				{
					text: t('user') + ': ' + t('select'),
					value: 'directus_users',
				},
				{
					text: t('role') + ': ' + t('select'),
					value: 'directus_roles',
				},
			];

			if (isItem.value) {
				const [type, id] = props.value.split('_');

				options = [
					{
						text: t(type) + ': ' + (itemName.value || id),
						value: props.value,
					},
					{ divider: true },
					...options,
				];
			}

			return options;
		});

		return { options, collection, onSelect, onSelectItem, loading };

		function onSelect(value: string) {
			if (value === 'all') {
				collection.value = null;
				return emit('input', 'all');
			}

			collection.value = value;
		}

		function onSelectItem(value: string[]) {
			if (collection.value === 'directus_users') return emit('input', 'user_' + value[0]);
			if (collection.value === 'directus_roles') return emit('input', 'role_' + value[0]);
		}

		async function loadItemName() {
			if (!isItem.value) {
				itemName.value = null;
				return;
			}

			loading.value = true;

			const [endpoint, id] = props.value.split('_');

			try {
				if (endpoint === 'role') {
					const result = await api.get('/roles/' + id, {
						params: {
							fields: ['id', 'name'],
						},
					});

					itemName.value = result.data.data.name;
				} else if (endpoint === 'user') {
					const result = await api.get('/users/' + id, {
						params: {
							fields: ['id', 'first_name', 'last_name', 'email'],
						},
					});

					itemName.value = userName(result.data.data);
				}
			} catch (error: any) {
				unexpectedError(error);
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>
