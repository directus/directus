<template>
	<div>
		<v-skeleton-loader v-if="loading"></v-skeleton-loader>
		<v-select v-else :value="value" @input="onSelect" :items="options" />
		<drawer-collection
			v-if="collection !== null"
			:active="collection !== null"
			@update:active="collection = null"
			@input="onSelectItem"
			:collection="collection"
		/>
	</div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from '@vue/composition-api';
import i18n from '@/lang';
import DrawerCollection from '@/views/private/components/drawer-collection';
import api from '@/api';
import { userName } from '@/utils/user-name';

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
	setup(props, { emit }) {
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
					text: i18n.t('global') + ': ' + i18n.t('all_users'),
					value: 'all',
				},
				{
					text: i18n.t('user') + ': ' + i18n.t('select'),
					value: 'directus_users',
				},
				{
					text: i18n.t('role') + ': ' + i18n.t('select'),
					value: 'directus_roles',
				},
			];

			if (isItem.value) {
				const [type, id] = props.value.split('_');

				options = [
					{
						text: i18n.t(type) + ': ' + (itemName.value || id),
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

			loading.value = false;
		}
	},
});
</script>
