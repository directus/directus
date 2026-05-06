<script setup lang="ts">
import type { LicensePendingResolution } from '@directus/license';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';
import { useLicenseStore } from '@/stores/license';

defineProps<{
	modelValue: boolean;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
	confirm: [];
}>();

const { t } = useI18n();

const licenseStore = useLicenseStore();
const { info, pendingResolution } = storeToRefs(licenseStore);

type ResolveScope = 'manual' | 'expired' | 'suspended' | 'env_removed';

const scope = computed<ResolveScope>(() => {
	if (info.value === null) return 'env_removed';
	const status = info.value.status;
	if (status === 'expired') return 'expired';
	if (status === 'suspended' || status === 'canceled') return 'suspended';
	return 'manual';
});

const title = computed(() => t(`licensing.resolve_title_${scope.value}`));
const noticeMessage = computed(() => t(`licensing.resolve_notice_${scope.value}`));

function close() {
	emit('update:modelValue', false);
}

function confirm() {
	emit('confirm');
}

function sectionLabel(item: LicensePendingResolution): string {
	if (item.kind === 'limit') {
		return t(`licensing.resolve_section_${item.key}`, { usage: item.usage, limit: item.limit });
	}

	return t(`licensing.resolve_section_${item.key}`);
}
</script>

<template>
	<VDialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" @esc="close">
		<VCard>
			<VCardTitle>{{ title }}</VCardTitle>

			<VCardText>
				<p class="subtitle">{{ t('licensing.resolve_subtitle') }}</p>

				<VNotice type="danger" class="notice">{{ noticeMessage }}</VNotice>

				<ul v-if="pendingResolution?.length" class="sections">
					<li v-for="item in pendingResolution" :key="item.key" class="section">
						<VIcon :name="item.kind === 'limit' ? 'warning' : 'block'" small />
						<span>{{ sectionLabel(item) }}</span>
						<!-- TODO: render candidates list (collections/seats) and feature gate blockers -->
					</li>
				</ul>
			</VCardText>

			<VCardActions>
				<VButton secondary @click="close">{{ t('cancel') }}</VButton>
				<VButton @click="confirm">{{ t('licensing.resolve_continue') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

<style scoped>
.subtitle {
	color: var(--theme--foreground-subdued);
	margin-block-end: 1rem;
}

.notice {
	margin-block-end: 1rem;
}

.sections {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 0;
	margin: 0;
	list-style: none;
}

.section {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}
</style>
