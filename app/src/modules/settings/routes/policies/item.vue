<script setup lang="ts">
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { useShortcut } from '@/composables/use-shortcut';
import { useUserStore } from '@/stores/user';
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail.vue';
import { Role } from '@directus/types';
import { ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';

const props = withDefaults(
	defineProps<{
		primaryKey: string;
		permissionKey?: string;
		deleteAllowed?: boolean;
	}>(),
	{
		deleteAllowed: true,
	},
);

const { t } = useI18n();

const router = useRouter();

const userStore = useUserStore();
const { primaryKey } = toRefs(props);

const revisionsDrawerDetailRef = ref<InstanceType<typeof RevisionsDrawerDetail> | null>(null);

const { edits, hasEdits, item, saving, loading, save, remove, deleting } = useItem<Role>(
	ref('directus_policies'),
	primaryKey,
);

const confirmDelete = ref(false);

useShortcut('meta+s', () => {
	if (hasEdits.value) saveAndStay();
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

/**
 * @NOTE
 * The userStore contains the information about the role of the current user. We want to
 * update the userstore to make sure the role information is accurate with the latest changes
 * in case we're changing the current user's role
 */

async function saveAndStay() {
	await save();
	await userStore.hydrate();
	revisionsDrawerDetailRef.value?.refresh?.();
}

async function saveAndQuit() {
	await save();
	await userStore.hydrate();
	router.push(`/settings/policies`);
}

async function deleteAndQuit() {
	await remove();
	edits.value = {};
	router.replace(`/settings/policies`);
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	edits.value = {};
	confirmLeave.value = false;
	router.push(leaveTo.value);
}
</script>

<template>
	<private-view :title="loading ? t('loading') : t('editing_policy', { policy: item && item.name })">
		<template #headline>
			<v-breadcrumb :items="[{ name: t('settings_permissions'), to: '/settings/policies' }]" />
		</template>
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact :to="`/settings/policies/`">
				<v-icon name="arrow_back" />
			</v-button>
		</template>
		<template #actions>
			<!-- TODO figure out when deletes are allowed, probably some API call involved? -->
			<v-dialog v-if="[1, 2].includes(+primaryKey) === false" v-model="confirmDelete" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button
						v-if="deleteAllowed"
						v-tooltip.bottom="t('delete_label')"
						rounded
						icon
						class="action-delete"
						secondary
						:disabled="item === null"
						@click="on"
					>
						<v-icon name="delete" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmDelete = false">
							{{ t('cancel') }}
						</v-button>
						<v-button kind="danger" :loading="deleting" @click="deleteAndQuit">
							{{ t('delete_label') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

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
			<v-form v-model="edits" collection="directus_policies" :primary-key="primaryKey" :initial-values="item" />
		</div>

		<template #sidebar>
			<revisions-drawer-detail
				ref="revisionsDrawerDetailRef"
				collection="directus_policies"
				:primary-key="primaryKey"
			/>
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
.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.roles {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
	display: flex;
	flex-direction: column;
	row-gap: var(--theme--form--row-gap);
}

.v-notice,
.v-skeleton-loader {
	max-width: 800px;
}

.header-icon {
	--v-button-background-color: var(--theme--primary-background);
	--v-button-color: var(--theme--primary);
	--v-button-background-color-hover: var(--theme--primary-subdued);
	--v-button-color-hover: var(--theme--primary);
}

.permissions-overview,
.roles .v-notice {
	margin-bottom: 48px;
}
</style>
