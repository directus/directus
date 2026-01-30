<script setup lang="ts">
import { useApi } from '@directus/composables';
import { Alterations, Item, Policy } from '@directus/types';
import { cloneDeep, isEmpty, isEqual, isObjectLike } from 'lodash';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import RoleInfoSidebarDetail from './role-info-sidebar-detail.vue';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useShortcut } from '@/composables/use-shortcut';
import { useFieldsStore } from '@/stores/fields';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import RevisionsSidebarDetail from '@/views/private/components/revisions-sidebar-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';

type Access = {
	id: string;
	policy: Policy;
};

const { t } = useI18n();

const api = useApi();
const router = useRouter();

const fieldsStore = useFieldsStore();
const policiesField = cloneDeep(fieldsStore.getField('directus_roles', 'policies'));

// Add filter in order to correctly display the policies of the public role
policiesField!.meta!.options = {
	...policiesField!.meta!.options,
	// Needed for showing policies of the public role in the field
	junctionFilter: {
		role: { _null: true },
		user: { _null: true },
	},
	// Needed for filtering the policies that can be selected, as the list-m2m field applies the same filter, but with
	// _eq: null, which does not work correctly
	filter: {
		'$FOLLOW(directus_access,policy)': {
			_none: {
				_and: [
					{
						role: {
							_null: true,
						},
					},
					{
						user: { _null: true },
					},
				],
			},
		},
	},
};

const fields = [
	{
		field: 'notice',
		type: 'alias',
		meta: {
			system: true,
			interface: 'presentation-notice',
			options: {
				text: t('public_role_info'),
			},
			width: 'full',
			sort: 0,
		},
	},
	policiesField,
];

const loading = ref(false);
const saving = ref(false);
const initialValue = ref<{ policies: string[] | null }>({ policies: null });
const edits = ref<{ policies?: Alterations<Access> | null }>({});

const hasEdits = computed(() => !isEmpty(edits.value) && !isEqual(initialValue.value, edits.value));

const revisionsSidebarDetailRef = ref<InstanceType<typeof RevisionsSidebarDetail> | null>(null);

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

useShortcut('meta+s', () => {
	if (hasEdits.value) saveAndStay();
});

useShortcut('meta+shift+s', () => {
	if (hasEdits.value) saveAndAddNew();
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
	} catch (error) {
		unexpectedError(error);
	} finally {
		loading.value = false;
	}
}

async function save() {
	saving.value = true;

	try {
		if (isAlterations(edits.value.policies)) {
			const { create, update, delete: deleted } = edits.value.policies;
			const requests = [];

			if (create && create.length > 0) {
				requests.push(api.post('/access', create));
			}

			if (update && update.length > 0) {
				requests.push(api.patch('/access', update));
			}

			if (deleted && deleted.length > 0) {
				requests.push(api.delete('/access', { data: deleted }));
			}

			await Promise.all(requests);
		}

		edits.value = {};
		await fetchPolicies();
	} catch (error) {
		unexpectedError(error);
		throw error;
	} finally {
		saving.value = false;
	}
}

async function saveAndStay() {
	try {
		await save();
		revisionsSidebarDetailRef.value?.refresh?.();
	} catch {
		// `save` shows unexpected error dialog
	}
}

async function saveAndAddNew() {
	try {
		await save();
		router.push(`/settings/roles/+`);
	} catch {
		// `save` shows unexpected error dialog
	}
}

async function saveAndQuit() {
	try {
		await save();
		router.push(`/settings/roles`);
	} catch {
		// `save` shows unexpected error dialog
	}
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	edits.value = {};
	confirmLeave.value = false;
	router.push(leaveTo.value);
}

function discardAndStay() {
	edits.value = {};
	confirmLeave.value = false;
}

function isAlterations<T extends Item>(value: any): value is Alterations<T> {
	return isObjectLike(value) && 'create' in value && 'update' in value && 'delete' in value;
}
</script>

<template>
	<PrivateView :title="$t('public_label')" show-back back-to="/settings/roles">
		<template #headline>
			<VBreadcrumb :items="[{ name: $t('settings_roles'), to: '/settings/roles' }]" />
		</template>

		<template #actions>
			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="$t('save')"
				:loading="saving"
				:disabled="!hasEdits"
				icon="check"
				@click="saveAndQuit"
			>
				<template #append-outer>
					<SaveOptions
						v-if="hasEdits"
						:disabled-options="['save-as-copy']"
						@save-and-stay="saveAndStay"
						@save-and-add-new="saveAndAddNew"
						@discard-and-stay="discardAndStay"
					/>
				</template>
			</PrivateViewHeaderBarActionButton>
		</template>

		<template #navigation>
			<SettingsNavigation />
		</template>

		<div class="content">
			<VForm v-model="edits" :initial-values="initialValue" :fields="fields" :primary-key="null" :loading />
		</div>

		<template #sidebar>
			<RoleInfoSidebarDetail :role="null" />
		</template>

		<VDialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
			<VCard>
				<VCardTitle>{{ $t('unsaved_changes') }}</VCardTitle>
				<VCardText>{{ $t('unsaved_changes_copy') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="discardAndLeave">
						{{ $t('discard_changes') }}
					</VButton>
					<VButton @click="confirmLeave = false">{{ $t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</PrivateView>
</template>

<style lang="scss" scoped>
.header-icon {
	--v-button-background-color: var(--theme--primary-background);
	--v-button-color: var(--theme--primary);
	--v-button-background-color-hover: var(--theme--primary-subdued);
	--v-button-color-hover: var(--theme--primary);
}

.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
	display: flex;
	flex-direction: column;
	gap: var(--theme--form--row-gap);
}
</style>
