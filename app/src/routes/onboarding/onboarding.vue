<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useOnboarding } from './use-onboarding';

const { t } = useI18n();

const {
	isLoading,
	nextButtonDisabled,
	validationErrors,
	currentSlide,
	progressPercent,
	isFirstSlide,
	isLastSlide,
	nextSlide,
	skipOnboarding,
} = useOnboarding();
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
						<div class="intro-text">
							<h2 class="type-title">{{ currentSlide.title }}</h2>
							<div v-md="{ value: currentSlide.text, target: '_blank' }" class="text-content" />
						</div>
						<v-form
							v-if="currentSlide.form"
							v-model="currentSlide.form.model.value"
							:initial-values="currentSlide.form.initialValues"
							:fields="currentSlide.form.fields"
							:validation-errors="validationErrors"
							autofocus
							:disabled-menu-options="['edit-raw']"
						/>
					</div>
				</Transition>
			</div>

			<!-- Actions -->
			<div class="actions">
				<!-- Left Actions -->
				<div></div>
				<!-- Right Actions -->
				<div>
					<v-button v-if="!isLoading && !isLastSlide" :disabled="nextButtonDisabled" @click="nextSlide">
						{{ isFirstSlide ? t('onboarding.action.first') : t('onboarding.action.saveAndContinue') }}
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

.actions > div {
	display: flex;
	flex-direction: row;
	gap: 16px;
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
	max-width: 600px;
	margin-bottom: 64px;

	.type-title {
		margin-bottom: 1em;
	}

	:deep() {
		@import '@/styles/markdown';
	}
}
</style>
