<script setup lang="ts">
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';
import { useItem } from '@/composables/use-item';
import RevisionsSidebarDetail from '@/views/private/components/revisions-sidebar-detail.vue';
import { PrivateView } from '@/views/private';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';

const props = defineProps<{
	primaryKey: string;
}>();

const { t } = useI18n();

const router = useRouter();

const { primaryKey } = toRefs(props);

const revisionsSidebarDetailRef = ref<InstanceType<typeof RevisionsSidebarDetail> | null>(null);

const { isNew, edits, item, loading, remove, deleting, validationErrors } = useItem(
	ref('directus_webhooks'),
	primaryKey,
);

const confirmDelete = ref(false);

const title = computed(() => {
	if (loading.value) return t('loading');
	if (isNew.value) return t('creating_webhook');
	return item.value?.name;
});

async function deleteAndQuit() {
	if (deleting.value) return;

	await remove();
	edits.value = {};
	router.replace(`/settings/webhooks`);
}
</script>

<template>
	<private-view :title="title" show-back>
		<template #headline>
			<v-breadcrumb :items="[{ name: $t('settings_webhooks'), to: '/settings/webhooks' }]" />
		</template>

		<template #actions>
			<v-dialog v-model="confirmDelete" @esc="confirmDelete = false" @apply="deleteAndQuit">
				<template #activator="{ on }">
					<v-button rounded icon class="action-delete" :disabled="item === null" small @click="on">
						<v-icon name="delete" small />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmDelete = false">
							{{ $t('cancel') }}
						</v-button>
						<v-button kind="danger" :loading="deleting" @click="deleteAndQuit">
							{{ $t('delete_label') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="deprecation-notice-wrapper">
			<v-notice type="danger">
				<span v-md="{ value: $t('webhooks_deprecation_notice'), target: '_blank' }"></span>
			</v-notice>
		</div>

		<v-form
			v-model="edits"
			:loading="loading"
			:initial-values="item"
			collection="directus_webhooks"
			:primary-key="primaryKey"
			:validation-errors="validationErrors"
		/>

		<template #sidebar>
			<revisions-sidebar-detail
				v-if="isNew === false"
				ref="revisionsSidebarDetailRef"
				collection="directus_webhooks"
				:primary-key="primaryKey"
			/>
		</template>
	</private-view>
</template>

<style lang="scss" scoped>
.deprecation-notice-wrapper {
	padding: 0 var(--content-padding);
	inline-size: fit-content;
	:deep(a) {
		text-decoration: underline;
	}
}

.action-delete {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--theme--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--theme--danger);
}

.v-form {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.header-icon {
	--v-button-background-color: var(--theme--primary-background);
	--v-button-color: var(--theme--primary);
	--v-button-background-color-hover: var(--theme--primary-subdued);
	--v-button-color-hover: var(--theme--primary);
}
</style>
