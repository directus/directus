<script setup lang="ts">
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useShortcut } from '@/composables/use-shortcut';
import { useFieldsStore } from '@/stores/fields';
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail.vue';
import { useApi } from '@directus/composables';
import { Alterations, Item, Policy } from '@directus/types';
import { isEmpty, isEqual, isObjectLike } from 'lodash';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import RoleInfoSidebarDetail from './role-info-sidebar-detail.vue';

const { t } = useI18n();

const api = useApi();
const router = useRouter();

const fieldsStore = useFieldsStore();
const policiesField = fieldsStore.getField('directus_roles', 'policies');

const loading = ref(false);
const error = ref<any | null>(null);
const saving = ref(false);
const initialValue = ref<{ policies: string[] | null }>({ policies: null });
const edits = ref<{ policies?: Policy[] | Alterations<Policy> | null }>({});

const hasEdits = computed(() => !isEmpty(edits.value) && !isEqual(initialValue.value, edits.value));

const revisionsDrawerDetailRef = ref<InstanceType<typeof RevisionsDrawerDetail> | null>(null);

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

useShortcut('meta+s', () => {
	if (hasEdits.value) saveAndStay();
});

onMounted(() => {
	fetchPolicies();
});

async function fetchPolicies() {
	loading.value = true;

	try {
		const response = await api.get<{ data: { id: string }[] }>('/access', {
			params: {
				filter: {
					_and: [{ role: { _null: true } }, { user: { _null: true } }],
				},
				fields: ['id'],
				limit: -1,
			},
		});

		initialValue.value = {
			policies: response.data.data.map(({ id }) => id),
		};
	} catch (e) {
		error.value = e;
	} finally {
		loading.value = false;
	}
}

async function save() {
	saving.value = true;

	try {
		if (isAlterations(edits.value)) {
			const { create, update, delete: deleted } = edits.value;
			const requests = [];

			if (create) {
				requests.push(api.post('/access', { data: create }));
			}

			if (update) {
				requests.push(api.patch('/access', { data: update }));
			}

			if (deleted) {
				requests.push(api.delete('/access', { data: deleted }));
			}

			await Promise.all(requests);
		}

		edits.value = {};
		await fetchPolicies();
	} catch (e) {
		error.value = e;
	} finally {
		saving.value = false;
	}
}

async function saveAndStay() {
	await save();
	revisionsDrawerDetailRef.value?.refresh?.();
}

async function saveAndQuit() {
	await save();
	router.push(`/settings/roles`);
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	edits.value = {};
	confirmLeave.value = false;
	router.push(leaveTo.value);
}

function isAlterations<T extends Item>(value: any): value is Alterations<T> {
	return isObjectLike(value) && 'create' in value && 'update' in value && 'delete' in value;
}
</script>

<template>
	<private-view :title="t('public_label')">
		<template #headline>{{ t('settings_roles') }}</template>
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact :to="`/settings/roles/`">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #actions>
			<v-button
				v-tooltip.bottom="t('save')"
				rounded
				icon
				:loading="saving"
				:disabled="hasEdits === false"
				@click="saveAndQuit"
			>
				<v-icon name="check" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div v-if="!loading" class="roles">
			<v-form v-model="edits" :initial-values="initialValue" :fields="[policiesField]" :primary-key="null" />
		</div>

		<template #sidebar>
			<role-info-sidebar-detail :role="null" />
		</template>

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">
						{{ t('discard_changes') }}
					</v-button>
					<v-button @click="confirmLeave = false">{{ t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</private-view>
</template>

<style lang="scss" scoped>
.header-icon {
	--v-button-background-color: var(--theme--primary-background);
	--v-button-color: var(--theme--primary);
	--v-button-background-color-hover: var(--theme--primary-subdued);
	--v-button-color-hover: var(--theme--primary);
}

.roles {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}
</style>
