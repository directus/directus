<script setup lang="ts">
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { useShortcut } from '@/composables/use-shortcut';
import { useUserStore } from '@/stores/user';
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail.vue';
import { Policy } from '@directus/types';
import { ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';

const props = defineProps<{
	primaryKey: string;
	permissionKey?: string;
}>();

const { t } = useI18n();

const router = useRouter();

const userStore = useUserStore();
const { primaryKey } = toRefs(props);

const revisionsDrawerDetailRef = ref<InstanceType<typeof RevisionsDrawerDetail> | null>(null);

const { edits, hasEdits, item, saving, loading, save, remove, deleting, validationErrors } = useItem<Policy>(
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
 * update the userStore to make sure the role information is accurate with the latest changes
 * in case we're changing the current user's role
 */

async function saveAndStay() {
	try {
		await save();
		revisionsDrawerDetailRef.value?.refresh?.();
		await userStore.hydrate();
	} catch {
		// 'save' shows unexpected error dialog
	}
}

async function saveAndQuit() {
	try {
		await save();
		router.push(`/settings/policies`);
		await userStore.hydrate();
	} catch {
		// 'save' shows unexpected error dialog
	}
}

async function deleteAndQuit() {
	try {
		await remove();
		edits.value = {};
		router.replace(`/settings/policies`);
	} catch {
		// 'remove' shows unexpected error dialog
	}
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
			<v-dialog v-model="confirmDelete" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button
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

		<div class="content">
			<v-form
				v-model="edits"
				collection="directus_policies"
				:primary-key="primaryKey"
				:loading
				:initial-values="item"
				:validation-errors="validationErrors"
			/>
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
.header-icon {
	--v-button-background-color: var(--theme--primary-background);
	--v-button-color: var(--theme--primary);
	--v-button-background-color-hover: var(--theme--primary-subdued);
	--v-button-color-hover: var(--theme--primary);
}

.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.content {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
	display: flex;
	flex-direction: column;
	row-gap: var(--theme--form--row-gap);
}
</style>
