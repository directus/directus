<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { findPlaceholderMarker } from '@/ai/prompt-markers';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VChip from '@/components/v-chip.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';

const props = defineProps<{
	points: { key: string; icon: string; label: string }[];
	prompt: unknown;
}>();

const emit = defineEmits<{
	apply: [key: string];
	startOver: [];
}>();

const { t } = useI18n();

const marker = computed(() => findPlaceholderMarker(String(props.prompt ?? '')));

const confirmStartOver = ref(false);

function startOver() {
	confirmStartOver.value = false;
	emit('startOver');
}
</script>

<template>
	<div v-if="!prompt" class="starting-points">
		<span class="type-note label">{{ t('ai.flow_operations.start_from') }}</span>
		<VChip v-for="point in points" :key="point.key" clickable small outlined @click="emit('apply', point.key)">
			<VIcon :name="point.icon" x-small left />
			{{ point.label }}
		</VChip>
	</div>

	<div v-else class="prompt-actions">
		<VNotice v-if="marker" type="warning">
			<span v-md="{ value: t('ai.flow_operations.replace_marker', { marker }), target: '_blank' }" />
		</VNotice>

		<VButton class="start-over" secondary x-small @click="confirmStartOver = true">
			<VIcon name="restart_alt" x-small left />
			{{ t('ai.flow_operations.start_over') }}
		</VButton>

		<VDialog v-model="confirmStartOver" @esc="confirmStartOver = false" @apply="startOver">
			<VCard>
				<VCardTitle>{{ t('ai.flow_operations.start_over_title') }}</VCardTitle>
				<VCardText>{{ t('ai.flow_operations.start_over_copy') }}</VCardText>

				<VCardActions>
					<VButton secondary @click="confirmStartOver = false">
						{{ t('cancel') }}
					</VButton>
					<VButton kind="danger" @click="startOver">
						{{ t('ai.flow_operations.start_over') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</div>
</template>

<style lang="scss" scoped>
.starting-points,
.prompt-actions {
	display: flex;
	gap: 0.5rem;
	margin-block-start: calc(-1 * var(--theme--form--row-gap) + 0.5rem);
}

.starting-points {
	flex-wrap: wrap;
	align-items: center;

	.label {
		font-style: normal;
		margin-inline-end: 0.25rem;
	}
}

.prompt-actions {
	flex-direction: column;
}

.start-over {
	align-self: flex-start;
}
</style>
