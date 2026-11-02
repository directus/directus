<script setup lang="ts">
import { DIRECTUS_SECURITY_BEST_PRACTICES_URL } from '@directus/constants';
import { groupBy, uniq } from 'lodash-es';
import { computed } from 'vue';
import { I18nT } from 'vue-i18n';
import type { SystemPermissionChange } from './get-system-permission-changes';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VNotice from '@/components/v-notice.vue';

const props = defineProps<{
	changes: SystemPermissionChange[];
	saving: boolean;
}>();

const emit = defineEmits<{
	confirm: [];
}>();

const active = defineModel<boolean>({ required: true });

const systemPermissionActions = computed(() =>
	Object.entries(groupBy(props.changes, 'collection')).map(([collection, changes]) => ({
		collection,
		actions: uniq(changes.map(({ action }) => action)),
	})),
);

const hasUnfilteredRead = computed(() => props.changes.some(({ unfilteredRead }) => unfilteredRead));
</script>

<template>
	<VDialog v-model="active" @esc="active = false" @apply="emit('confirm')">
		<VCard class="system-permissions-card">
			<VCardTitle>{{ $t('public_policy_dialog.title') }}</VCardTitle>
			<VCardText class="system-permissions-confirm">
				<p>{{ $t('public_policy_dialog.copy') }}</p>

				<table class="system-permissions-table">
					<thead>
						<tr>
							<th scope="col">{{ $t('collection') }}</th>
							<th scope="col">{{ $t('actions') }}</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="{ collection, actions } in systemPermissionActions" :key="collection">
							<td class="collection">{{ collection }}</td>
							<td class="actions">{{ actions.map((action) => $t(action)).join(', ') }}</td>
						</tr>
					</tbody>
				</table>

				<VNotice v-if="hasUnfilteredRead" type="danger">
					{{ $t('public_policy_dialog.unfiltered_read_warning') }}
				</VNotice>

				<I18nT keypath="public_policy_dialog.best_practices" tag="p">
					<template #docs>
						<a :href="DIRECTUS_SECURITY_BEST_PRACTICES_URL" target="_blank" rel="noopener noreferrer">
							{{ $t('public_policy_warning_docs_link') }}
						</a>
					</template>
				</I18nT>
			</VCardText>
			<VCardActions>
				<VButton secondary @click="active = false">
					{{ $t('cancel') }}
				</VButton>
				<VButton :loading="saving" @click="emit('confirm')">
					{{ $t('save') }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

<style lang="scss" scoped>
.system-permissions-card {
	max-inline-size: unset;
	inline-size: min(39rem, calc(100vw - 2.25rem));
}

.system-permissions-confirm {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;

	a {
		text-decoration: underline;
		color: var(--theme--primary);
	}
}

.system-permissions-table {
	inline-size: 100%;
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	border-spacing: 0;

	th,
	td {
		padding: 0.5rem 0.6875rem;
		text-align: start;
		vertical-align: top;
	}

	th {
		font-weight: 600;
		background-color: var(--theme--form--field--input--background);
		border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);

		&:first-child {
			border-start-start-radius: var(--theme--border-radius);
		}

		&:last-child {
			border-start-end-radius: var(--theme--border-radius);
		}
	}

	tr + tr td {
		border-block-start: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}

	.collection {
		font-family: var(--theme--fonts--monospace--font-family);
		overflow-wrap: break-word;
	}

	.actions {
		color: var(--theme--foreground-subdued);
	}
}
</style>
