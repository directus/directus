<template>
	<public-view :wide="true">
		<div class="container">
			<!-- Top Navbar -->
			<div class="nav">
				<!-- Directus Logo -->
				<!-- <div class="logo-container">
					<div class="logo-wrapper">
						<div class="logo" :class="{ running: isLoading }"></div>
					</div>
				</div> -->
				<v-progress-linear :value="progressPercent" rounded :indeterminate="isLoading"></v-progress-linear>
			</div>

			<!-- Content -->
			<div class="onboarding-slides">
				<Transition name="dialog" mode="out-in">
					<!-- Welcome Slide -->
					<div class="intro-text" v-if="currentSlideIndex === 0">
						<h1 class="type-title">{{ t('onboarding.welcome.title') }}</h1>
						<p class="type-text">{{ t('onboarding.welcome.text') }}</p>
					</div>

					<!-- Project Slide -->
					<div class="slide" v-else-if="currentSlideIndex === 1">
						<div class="intro-text">
							<h1 class="type-title">{{ t('onboarding.project.title') }}</h1>
							<p class="type-text">{{ t('onboarding.project.text') }}</p>
						</div>
						<v-form v-model="projectModel" :fields="projectFields" :autofocus="true" />
					</div>

					<!-- User Slide -->
					<div class="slide" v-else-if="currentSlideIndex === 2">
						<div class="intro-text">
							<h1 class="type-title">{{ t('onboarding.user.title') }}</h1>
							<p class="type-text">{{ t('onboarding.user.text') }}</p>
						</div>
						<v-form v-model="userModel" :fields="userFields" :autofocus="true" />
					</div>

					<!-- Last Slide -->
					<div class="intro-text" v-else-if="currentSlideIndex === 3">
						<h1 class="type-title">{{ t('onboarding.loading.title') }}</h1>
						<p class="type-text">{{ t('onboarding.loading.text') }}</p>
					</div>
				</Transition>
			</div>

			<!-- Actions -->
			<div class="actions">
				<!-- Left Actions -->
				<div>
					<Transition name="dialog">
						<v-button v-if="!isLoading" secondary :disabled="isLoading || isFirstSlide" @click="prevSlide">
							{{ t('back') }}
						</v-button>
					</Transition>
					<!-- <Transition name="dialog">
						<v-button
							v-if="!isLoading && isLastSlide"
							secondary
							:disabled="isLoading"
							@click="skipOnboarding"
							class="btn-skip"
						>
							{{ t('skip') }}
						</v-button>
					</Transition> -->
				</div>
				<!-- Right Actions -->
				<div>
					<v-button @click="nextSlide" v-if="!isLoading" :disabled="isLoading">
						{{ isLastSlide ? t('finish_setup') : t('next') }}
					</v-button>
				</div>
			</div>
		</div>
	</public-view>
</template>

<script setup lang="ts">
import api from '@/api';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import { Field } from '@directus/types';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import VForm from '../../components/v-form/v-form.vue';

type OnboardingPayload = {
	version: 1;
	body: {
		user?: {
			email?: string;
			wants_emails?: boolean;
			primary_skillset?: string;
		};
		project?: {
			name?: string;
			url?: string;
			type?: string;
		};
	};
};

const { t } = useI18n();
const router = useRouter();
const settingsStore = useSettingsStore();
const serverStore = useServerStore();
const userStore = useUserStore();

// Split up the v-form models from the payload,
// so that we need to explicitly choose fields that we want to add
// Note: The models must match the field names of the v-forms
const projectModel = ref({
	project_name: settingsStore.settings?.project_name,
	project_url: settingsStore.settings?.project_url,
	project_logo: settingsStore.settings?.project_logo,
	project_color: settingsStore.settings?.project_color,
	project_use_case: undefined,
});
const userModel = ref({
	id: userStore.currentUser?.id,
	first_name: userStore.currentUser?.first_name,
	last_name: userStore.currentUser?.last_name,
	email: userStore.currentUser?.email,
	wants_emails: false,
	primary_skillset: undefined,
});

// TODO remove slides..
const slides = [0, 1, 2];
const currentSlideIndex = ref(0);
const slideCount = slides.length;
const progressPercent = computed(() => (currentSlideIndex.value / slideCount) * 100);
const isFirstSlide = computed(() => currentSlideIndex.value === 0);
const isLastSlide = computed(() => currentSlideIndex.value === slideCount - 1);
const isLoading = ref(false);

async function finishOnboarding() {
	const settingUpdate = settingsStore
		.updateSettings({
			project_name: projectModel.value.project_name,
			project_url: projectModel.value.project_url,
			project_logo: projectModel.value.project_logo,
			project_color: projectModel.value.project_color,
			onboarding: JSON.stringify({ project_use_case: projectModel.value.project_use_case }),
		})
		.then(() => serverStore.hydrate())
		.catch((e) => console.error('Error when updating settings', e));

	const userUpdate = api
		.patch(`/users/${userModel.value.id}`, {
			first_name: userModel.value.first_name,
			last_name: userModel.value.last_name,
			email: userModel.value.email, // TODO validate before!
			onboarding: JSON.stringify({ primary_skillset: userModel.value.primary_skillset }),
		})
		.then(() => userStore.hydrate())
		.catch((e) => console.error('Error when updating users', e));

	// TODO: Remove fields when $TELEMETRY is set
	const onboarding: OnboardingPayload = {
		version: 1,
		body: {
			user: {
				email: userModel.value.email,
				wants_emails: userModel.value.wants_emails,
				primary_skillset: userModel.value.primary_skillset,
			},
			project: {
				name: projectModel.value.project_name,
				url: projectModel.value.project_url ?? undefined,
				type: projectModel.value.project_use_case,
			},
		},
	};
	// TODO: Do telemetry

	await Promise.allSettled([settingUpdate, userUpdate]);
	return router.replace('/content');
}

function prevSlide() {
	currentSlideIndex.value = Math.max(currentSlideIndex.value - 1, 0);
}

async function skipOnboarding() {
	isLoading.value = true;
	const userUpdate = api
		.patch(`/users/${userModel.value.id}`, {
			onboarding: '{}',
		})
		.then(() => userStore.hydrate())
		.catch((e) => console.error('Error when updating users', e));

	await Promise.allSettled([userUpdate]);
	router.replace('/content').finally(() => (isLoading.value = false));
}

async function nextSlide() {
	if (isLastSlide.value) {
		isLoading.value = true;
		finishOnboarding().finally(() => (isLoading.value = false));
	}
	currentSlideIndex.value = Math.min(currentSlideIndex.value + 1, slideCount);
}

const userFields: Field[] = [
	{
		collection: 'onboarding',
		name: t('fields.directus_users.first_name'),
		field: 'first_name',
		type: 'string',
		schema: {
			name: 'first_name',
			table: 'onboarding',
			schema: 'public',
			data_type: 'character varying',
			is_nullable: false,
			generation_expression: null,
			default_value: null,
			is_generated: false,
			max_length: 255,
			comment: null,
			numeric_precision: null,
			numeric_scale: null,
			is_unique: false,
			is_primary_key: false,
			has_auto_increment: false,
			foreign_key_schema: null,
			foreign_key_table: null,
			foreign_key_column: null,
		},
		meta: {
			id: 17,
			collection: 'onboarding',
			field: 'first_name',
			special: null,
			interface: 'input',
			options: { placeholder: t('fields.directus_users.first_name'), trim: true },
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 2,
			width: 'half',
			translations: null,
			note: null,
			conditions: null,
			required: false,
			group: null,
			validation: null,
			validation_message: null,
		},
	},
	{
		collection: 'onboarding',
		name: t('fields.directus_users.last_name'),
		field: 'last_name',
		type: 'string',
		schema: {
			name: 'last_name',
			table: 'onboarding',
			schema: 'public',
			data_type: 'character varying',
			is_nullable: false,
			generation_expression: null,
			default_value: null,
			is_generated: false,
			max_length: 255,
			comment: null,
			numeric_precision: null,
			numeric_scale: null,
			is_unique: false,
			is_primary_key: false,
			has_auto_increment: false,
			foreign_key_schema: null,
			foreign_key_table: null,
			foreign_key_column: null,
		},
		meta: {
			id: 18,
			collection: 'onboarding',
			field: 'last_name',
			special: null,
			interface: 'input',
			options: { placeholder: t('fields.directus_users.last_name'), trim: true },
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 3,
			width: 'half',
			translations: null,
			note: null,
			conditions: null,
			required: false,
			group: null,
			validation: null,
			validation_message: null,
		},
	},
	{
		collection: 'onboarding',
		name: t('fields.directus_users.email'),
		field: 'email',
		type: 'string',
		schema: {
			name: 'email',
			table: 'onboarding',
			schema: 'public',
			data_type: 'character varying',
			is_nullable: false,
			generation_expression: null,
			default_value: null,
			is_generated: false,
			max_length: 255,
			comment: null,
			numeric_precision: null,
			numeric_scale: null,
			is_unique: false,
			is_primary_key: false,
			has_auto_increment: false,
			foreign_key_schema: null,
			foreign_key_table: null,
			foreign_key_column: null,
		},
		meta: {
			id: 19,
			collection: 'onboarding',
			field: 'email',
			special: null,
			interface: 'input',
			options: { placeholder: t('fields.directus_users.email'), trim: true },
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 4,
			width: 'half',
			translations: null,
			note: null,
			conditions: null,
			required: false,
			group: null,
			validation: { _and: [{ email: { _regex: '.+@.+\\..+' } }] },
			validation_message: "t('validationError.email')",
		},
	},
	{
		collection: 'onboarding',
		name: t('onboarding.user.mailinglist_name'),
		field: 'wants_emails',
		type: 'boolean',
		schema: {
			name: 'wants_emails',
			table: 'onboarding',
			schema: 'public',
			data_type: 'boolean',
			is_nullable: false,
			generation_expression: null,
			default_value: false,
			is_generated: false,
			max_length: null,
			comment: null,
			numeric_precision: null,
			numeric_scale: null,
			is_unique: false,
			is_primary_key: false,
			has_auto_increment: false,
			foreign_key_schema: null,
			foreign_key_table: null,
			foreign_key_column: null,
		},
		meta: {
			id: 20,
			collection: 'onboarding',
			field: 'wants_emails',
			special: ['cast-boolean'],
			interface: 'boolean',
			options: {
				label: t('onboarding.user.mailinglist_label'),
			},
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 5,
			width: 'half',
			translations: null,
			note: null,
			conditions: null,
			required: false,
			group: null,
			validation: null,
			validation_message: null,
		},
	},
	{
		collection: 'onboarding',
		name: t('onboarding.user.primary_skillset'),
		field: 'primary_skillset',
		type: 'string',
		schema: {
			name: 'primary_skillset',
			table: 'onboarding',
			schema: 'public',
			data_type: 'character varying',
			is_nullable: true,
			generation_expression: null,
			default_value: null,
			is_generated: false,
			max_length: 255,
			comment: null,
			numeric_precision: null,
			numeric_scale: null,
			is_unique: false,
			is_primary_key: false,
			has_auto_increment: false,
			foreign_key_schema: null,
			foreign_key_table: null,
			foreign_key_column: null,
		},
		meta: {
			id: 25,
			collection: 'onboarding',
			field: 'primary_skillset',
			special: null,
			interface: 'select-radio',
			options: {
				choices: [
					{ text: t('onboarding.user.frontend'), value: 'frontend' },
					{ text: t('onboarding.user.backend'), value: 'backend' },
					{ text: t('onboarding.user.fullstack'), value: 'fullstack' },
					{ text: t('onboarding.user.sql_lowcode'), value: 'sql and basic coding' },
					{ text: t('onboarding.user.nontechnical'), value: 'non technical' },
				],
			},
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 6,
			width: 'full',
			translations: null,
			note: null,
			conditions: null,
			required: false,
			group: null,
			validation: null,
			validation_message: null,
		},
	},
];

const projectFields: Field[] = [
	{
		collection: 'onboarding',
		name: t('fields.directus_settings.project_name'),
		field: 'project_name',
		type: 'string',
		schema: {
			name: 'project_name',
			table: 'onboarding',
			schema: 'public',
			data_type: 'character varying',
			is_nullable: false,
			generation_expression: null,
			default_value: null,
			is_generated: false,
			max_length: 255,
			comment: null,
			numeric_precision: null,
			numeric_scale: null,
			is_unique: false,
			is_primary_key: false,
			has_auto_increment: false,
			foreign_key_schema: null,
			foreign_key_table: null,
			foreign_key_column: null,
		},
		meta: {
			id: 27,
			collection: 'onboarding',
			field: 'project_name',
			special: null,
			interface: 'input',
			options: { placeholder: t('fields.directus_settings.project_name'), trim: true },
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 8,
			width: 'half',
			translations: null,
			note: null,
			conditions: null,
			required: false,
			group: null,
			validation: null,
			validation_message: null,
		},
	},
	{
		collection: 'onboarding',
		name: t('fields.directus_settings.project_url'),
		field: 'project_url',
		type: 'string',
		schema: {
			name: 'project_url',
			table: 'onboarding',
			schema: 'public',
			data_type: 'character varying',
			is_nullable: false,
			generation_expression: null,
			default_value: null,
			is_generated: false,
			max_length: 255,
			comment: null,
			numeric_precision: null,
			numeric_scale: null,
			is_unique: false,
			is_primary_key: false,
			has_auto_increment: false,
			foreign_key_schema: null,
			foreign_key_table: null,
			foreign_key_column: null,
		},
		meta: {
			id: 28,
			collection: 'onboarding',
			field: 'project_url',
			special: null,
			interface: 'input',
			options: { placeholder: t('fields.directus_settings.project_url'), trim: true },
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 9,
			width: 'half',
			translations: null,
			note: null,
			conditions: null,
			required: false,
			group: null,
			validation: null,
			validation_message: null,
		},
	},
	{
		collection: 'onboarding',
		name: t('fields.directus_settings.project_color'),
		field: 'project_color',
		type: 'string',
		schema: {
			name: 'project_color',
			table: 'onboarding',
			schema: 'public',
			data_type: 'character varying',
			is_nullable: false,
			generation_expression: null,
			default_value: null,
			is_generated: false,
			max_length: 255,
			comment: null,
			numeric_precision: null,
			numeric_scale: null,
			is_unique: false,
			is_primary_key: false,
			has_auto_increment: false,
			foreign_key_schema: null,
			foreign_key_table: null,
			foreign_key_column: null,
		},
		meta: {
			id: 29,
			collection: 'onboarding',
			field: 'project_color',
			special: null,
			interface: 'select-color',
			options: { placeholder: t('fields.directus_settings.project_color'), trim: true },
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 11,
			width: 'half',
			translations: null,
			note: null,
			conditions: null,
			required: false,
			group: null,
			validation: null,
			validation_message: null,
		},
	},
	{
		collection: 'onboarding',
		name: t('fields.directus_settings.project_logo'),
		field: 'project_logo',
		type: 'uuid',
		schema: {
			name: 'project_logo',
			table: 'onboarding',
			schema: 'public',
			data_type: 'uuid',
			is_nullable: true,
			generation_expression: null,
			default_value: null,
			is_generated: false,
			max_length: null,
			comment: null,
			numeric_precision: null,
			numeric_scale: null,
			is_unique: false,
			is_primary_key: false,
			has_auto_increment: false,
			foreign_key_schema: 'public',
			foreign_key_table: 'directus_files',
			foreign_key_column: 'id',
		},
		meta: {
			id: 30,
			collection: 'onboarding',
			field: 'project_logo',
			special: ['file'],
			interface: 'file-image',
			options: { crop: false },
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 10,
			width: 'half',
			translations: null,
			note: null,
			conditions: null,
			required: false,
			group: null,
			validation: null,
			validation_message: null,
		},
	},
	{
		collection: 'onboarding',
		name: t('onboarding.project.use_case'),
		field: 'project_use_case',
		type: 'string',
		schema: {
			name: 'project_use_case',
			table: 'onboarding',
			schema: 'public',
			data_type: 'character varying',
			is_nullable: true,
			generation_expression: null,
			default_value: null,
			is_generated: false,
			max_length: 255,
			comment: null,
			numeric_precision: null,
			numeric_scale: null,
			is_unique: false,
			is_primary_key: false,
			has_auto_increment: false,
			foreign_key_schema: null,
			foreign_key_table: null,
			foreign_key_column: null,
		},
		meta: {
			id: 31,
			collection: 'onboarding',
			field: 'project_use_case',
			special: null,
			interface: 'select-radio',
			options: {
				choices: [
					{ text: t('onboarding.project.personal'), value: 'personal' },
					{ text: t('onboarding.project.work'), value: 'work' },
					{ text: t('onboarding.project.exploring'), value: 'exploring' },
				],
			},
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 12,
			width: 'full',
			translations: null,
			note: null,
			conditions: null,
			required: false,
			group: null,
			validation: null,
			validation_message: null,
		},
	},
];
</script>

<style scoped>
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

@media (min-width: 640px) {
	.container {
		max-width: 640px;
	}
}
@media (min-width: 768px) {
	.container {
		max-width: 768px;
	}
}
@media (min-width: 1024px) {
	.container {
		max-width: 1024px;
	}
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

.logo-wrapper {
	padding: 8px 12px;
	border-radius: var(--border-radius-outline);
	width: 64px;
	height: 64px;
	background-color: var(--purple);
	display: flex;
	justify-content: center;
	align-items: center;
}
.logo {
	width: 40px;
	height: 32px;
	transform: translateY(4px); /* To center the animated rabbit because the sprite has too much height */
	background-image: url('@/assets/sprite.svg');
	background-position: 0% 0%;
	background-size: 600px 32px;
}

.logo-container {
	display: flex;
	flex-direction: row;
	align-items: center;
	font-style: italic;
	letter-spacing: -1px;
	gap: 16px;
}

.logo-type {
	font-size: 38px;
}

.logo.running {
	animation: 560ms run steps(14) infinite;
}

@keyframes run {
	100% {
		background-position: 100%;
	}
}

.intro-text {
	margin-bottom: 64px;
}

/* Inherits from global class */
.type-title {
	margin-bottom: 8px;
}
/* Inherits from global class */
.type-text {
	max-width: 600px;
}
</style>
