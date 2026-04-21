<script setup lang="ts">
import type { AddonRow } from './types';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';
import InterfacePresentationDivider from '@/interfaces/presentation-divider/presentation-divider.vue';

defineProps<{
	title: string;
	error: string | null;
	rows: AddonRow[];
	licensePortalHref: string;
}>();

const emit = defineEmits<{
	(event: 'manage-addon', addon: AddonRow): void;
}>();

function handleActionClick(addon: AddonRow) {
	if (addon.disabled) return;
	emit('manage-addon', addon);
}
</script>

<template>
	<section class="section">
		<InterfacePresentationDivider icon="diamond" :title="title" />

		<VNotice v-if="error" type="warning">
			{{ error }}
		</VNotice>

		<div class="addon-grid">
			<article v-for="addon in rows" :key="addon.id" class="addon-card" :class="{ muted: addon.disabled }">
				<div class="addon-icon">
					<VIcon :name="addon.icon" />
				</div>

				<div class="addon-copy">
					<p class="addon-title">{{ addon.name }}</p>
					<p v-if="addon.description" class="addon-description">{{ addon.description }}</p>
					<p v-if="addon.pricingSummary" class="addon-pricing">{{ addon.pricingSummary }}</p>
				</div>

				<VButton
					small
					secondary
					class="addon-action"
					:disabled="addon.disabled"
					:href="addon.action === 'upgrade' && !addon.disabled ? licensePortalHref : undefined"
					:target="addon.action === 'upgrade' ? '_blank' : undefined"
					@click="addon.action === 'upgrade' ? undefined : handleActionClick(addon)"
				>
					<VIcon
						:name="
							addon.action === 'upgrade' ? 'diamond' : addon.action === 'manage' ? 'settings' : 'add_shopping_cart'
						"
						left
					/>
					{{
						addon.action === 'upgrade'
							? $t('license.upgrade_plan')
							: addon.action === 'manage'
								? $t('manage')
								: $t('license.purchase')
					}}
				</VButton>
			</article>
		</div>
	</section>
</template>

<style scoped lang="scss">
.section {
	display: grid;
	gap: 1rem;
}

.addon-grid {
	display: grid;
	gap: 0.75rem;
}

.addon-card {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1rem 1.25rem;
	border-radius: 0.5rem;
	border: var(--theme--border-width) solid var(--theme--border-color-subdued);
	background: var(--theme--background);
	transition: border-color var(--fast) var(--transition);
}

.addon-card:hover {
	border-color: var(--theme--border-color-accent);
}

.addon-card.muted {
	background: var(--theme--form--field--input--background-subdued);
	border-color: var(--theme--border-color-subdued);
}

.addon-card.muted:hover {
	border-color: var(--theme--border-color-accent);
}

.addon-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 2.75rem;
	block-size: 2.75rem;
	flex-shrink: 0;
	border-radius: 50%;
	background: var(--theme--primary);

	.v-icon {
		--v-icon-color: var(--white);
	}
}

.addon-card.muted .addon-icon {
	background: var(--theme--background-accent);

	.v-icon {
		--v-icon-color: var(--theme--foreground-subdued);
	}
}

.addon-copy {
	flex: 1;
	min-inline-size: 0;
}

.addon-title {
	margin: 0;
	font-weight: 600;
	font-size: 0.9375rem;
	color: var(--theme--foreground);
}

.addon-description {
	margin: 0.25rem 0 0;
	color: var(--theme--foreground-subdued);
	font-size: 0.875rem;
}

.addon-pricing {
	margin: 0.125rem 0 0;
	color: var(--theme--foreground-subdued);
	font-size: 0.875rem;
}

.addon-action {
	flex-shrink: 0;
}

@media (width <= 56rem) {
	.addon-card {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		grid-template-areas:
			'icon copy'
			'icon action';
		align-items: start;
	}

	.addon-icon {
		grid-area: icon;
	}

	.addon-copy {
		grid-area: copy;
	}

	.addon-action {
		grid-area: action;
		justify-self: start;
		margin-block-start: 0.75rem;
	}
}
</style>
