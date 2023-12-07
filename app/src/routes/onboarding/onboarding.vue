<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { useOnboarding } from './use-onboarding';

const { t } = useI18n();

const {
	isLoading,
	nextButtonDisabled,
	validationErrors,
	currentSlide,
	progressPercent,
	isLastSlide,
	nextSlide,
	skipOnboarding,
} = useOnboarding();

const introTextBox = ref<HTMLDivElement | null>(null);

/**
 * Scroll to the intro-box upon slide changes, because on smaller screens
 * we might be too far down the page after switching slides
 */
watchEffect(() => {
	if (!introTextBox.value) {
		return;
	}

	introTextBox.value.scrollIntoView({ behavior: 'smooth' });
});
</script>

<template>
	<public-view wide>
		<template #actions>
			<Transition name="dialog">
				<v-button v-if="!isLoading" secondary x-small kind="link" class="btn-skip" @click="skipOnboarding">
					{{ t('onboarding.action.skip') }}
				</v-button>
			</Transition>
		</template>

		<div class="container">
			<!-- Top Navbar -->
			<div class="nav">
				<v-progress-linear :value="progressPercent" rounded :indeterminate="isLoading" />
			</div>

			<!-- Content -->
			<div class="onboarding-slides">
				<Transition name="dialog" mode="out-in">
					<div :key="currentSlide.key" class="slide">
						<div ref="introTextBox" class="intro-text">
							<h2 class="type-title">{{ currentSlide.title }}</h2>
							<div v-md="{ value: currentSlide.text, target: '_blank' }" class="text-content" />
						</div>
						<v-form
							v-if="currentSlide.form"
							v-model="currentSlide.form.model.value"
							:initial-values="currentSlide.form.initialValues"
							:fields="currentSlide.form.fields"
							:validation-errors="validationErrors"
							:loading="isLoading"
							autofocus
							:disabled-menu-options="['edit-raw']"
						/>
					</div>
				</Transition>
			</div>

			<!-- Actions -->
			<div class="actions">
				<!-- Left Actions -->
				<div class="actions-left"></div>
				<!-- Right Actions -->
				<div class="actions-right">
					<v-button
						v-if="!isLoading && currentSlide.secondaryAction"
						kind="link"
						:disabled="nextButtonDisabled"
						@click="nextSlide(currentSlide.secondaryAction.action)"
					>
						{{ currentSlide.secondaryAction.label }}
					</v-button>
					<v-button
						v-if="!isLoading && !isLastSlide && currentSlide.primaryAction"
						:disabled="nextButtonDisabled"
						@click="nextSlide(currentSlide.primaryAction.action)"
					>
						{{ currentSlide.primaryAction.label }}
					</v-button>
				</div>
			</div>
		</div>
	</public-view>
</template>

<style lang="scss" scoped>
.container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 64px;
	padding: 64px 0;
	margin-left: auto;
	margin-right: auto;
	width: 100%;
}

.nav {
	display: flex;
	flex-direction: column;
	justify-content: start;
	align-items: start;
	width: 100%;
	gap: 16px;
}

.actions {
	width: 100%;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
}

.actions-right,
.actions-left {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	gap: 16px;
}

@media only screen and (max-width: 600px) {
	.actions {
		flex-direction: column;
		gap: 32px;
	}

	.actions > div.actions-left {
		width: 100%;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
	}

	.actions > div.actions-right {
		width: 100%;
		flex-direction: column;
		justify-content: flex-end;
		align-items: flex-end;
	}
}

.onboarding-slides {
	width: 100%;
}

.btn-skip {
	:deep(button) {
		color: var(--foreground-subdued);
	}
}

.intro-text {
	max-width: 512px;
	margin-bottom: 64px;

	.type-title {
		margin-bottom: 1em;
	}

	:deep() {
		@import '@/styles/markdown';

		a {
			text-decoration: underline;
		}
	}
}
</style>
