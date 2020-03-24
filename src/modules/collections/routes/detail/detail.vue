<template>
	<private-view :title="$t('editing', { collection: currentCollection.name })">
		<template #title-outer:prepend>
			<v-button rounded icon secondary exact :to="breadcrumb[1].to">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #actions>
			<v-dialog v-model="confirmDelete">
				<template #activator="{ on }">
					<v-button rounded icon class="action-delete" @click="on">
						<v-icon name="delete" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmDelete = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button @click="deleteAndQuit" class="action-delete" :loading="deleting">
							{{ $t('delete') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				rounded
				icon
				:loading="saving"
				:disabled="hasEdits === false"
				@click="saveAndQuit"
			>
				<v-icon name="check" />
			</v-button>
		</template>

		<template v-if="item">
			<v-form :initial-values="item" :collection="collection" v-model="edits" />
		</template>

		<template #navigation>
			<collections-navigation />
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref, toRefs } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import useFieldsStore from '@/stores/fields';
import { Field } from '@/stores/fields/types';
import api from '@/api';
import CollectionsNavigation from '../../components/navigation/';
import useCollectionsStore from '../../../../stores/collections';
import { i18n } from '@/lang';
import router from '@/router';

type Values = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[field: string]: any;
};

export default defineComponent({
	name: 'collections-detail',
	components: { CollectionsNavigation },
	props: {
		collection: {
			type: String,
			required: true,
		},
		primaryKey: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const projectsStore = useProjectsStore();
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const { currentProjectKey } = toRefs(projectsStore.state);

		const isNew = computed<boolean>(() => props.primaryKey === '+');

		const fieldsInCurrentCollection = computed<Field[]>(() => {
			return fieldsStore.state.fields.filter(
				(field) => field.collection === props.collection
			);
		});

		const visibleFields = computed<Field[]>(() => {
			return fieldsInCurrentCollection.value
				.filter((field) => field.hidden_browse === false)
				.sort((a, b) => (a.sort || Infinity) - (b.sort || Infinity));
		});

		const item = ref<Values>(null);
		const error = ref(null);
		const loading = ref(false);
		const saving = ref(false);
		const deleting = ref(false);
		const confirmDelete = ref(false);

		const currentCollection = collectionsStore.getCollection(props.collection);

		if (isNew.value === true) {
			useDefaultValues();
		} else {
			fetchItem();
		}

		const breadcrumb = computed(() => [
			{
				name: i18n.tc('collection', 2),
				to: `/${currentProjectKey.value}/collections/`,
			},
			{
				name: currentCollection.name,
				to: `/${currentProjectKey.value}/collections/${props.collection}/`,
			},
		]);

		const edits = ref({});

		const hasEdits = computed<boolean>(() => Object.keys(edits.value).length > 0);

		return {
			visibleFields,
			item,
			loading,
			error,
			isNew,
			currentCollection,
			breadcrumb,
			edits,
			hasEdits,
			saveAndQuit,
			saving,
			deleting,
			deleteAndQuit,
			confirmDelete,
		};

		async function fetchItem() {
			loading.value = true;
			try {
				const response = await api.get(
					`/${currentProjectKey.value}/items/${props.collection}/${props.primaryKey}`
				);
				item.value = response.data.data;
			} catch (error) {
				error.value = error;
			} finally {
				loading.value = false;
			}
		}

		function useDefaultValues() {
			const defaults: Values = {};

			visibleFields.value.forEach((field) => {
				defaults[field.field] = field.default_value;
			});

			item.value = defaults;
		}

		async function saveAndQuit() {
			saving.value = true;

			try {
				if (isNew.value === true) {
					await api.post(`/${currentProjectKey}/items/${props.collection}`, edits.value);
				} else {
					await api.patch(
						`/${currentProjectKey}/items/${props.collection}/${props.primaryKey}`,
						edits.value
					);
				}
			} catch (error) {
				/** @TODO show real notification */
				alert(error);
			} finally {
				saving.value = true;
				router.push(`/${currentProjectKey}/collections/${props.collection}`);
			}
		}

		async function deleteAndQuit() {
			if (isNew.value === true) return;

			deleting.value = true;

			try {
				await api.delete(
					`/${currentProjectKey}/items/${props.collection}/${props.primaryKey}`
				);
			} catch (error) {
				/** @TODO show real notification */
				alert(error);
			} finally {
				router.push(`/${currentProjectKey}/collections/${props.collection}`);
				deleting.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color: var(--danger);
	--v-button-background-color-hover: var(--danger-dark);
}

.v-form {
	padding: var(--content-padding);
}
</style>
