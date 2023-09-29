<template>
	<div class="container">
		<!-- Top Navbar -->
		<div class="nav">
			<!-- Directus Logo -->
			<div class="logo-container">
				<div class="logo-wrapper">
					<div class="logo" :class="{ running: isLoading }"></div>
				</div>
			</div>

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
					<v-form v-model="payload.body.project" :fields="projectFields" :autofocus="true" />
				</div>

				<!-- User Slide -->
				<div class="slide" v-else-if="currentSlideIndex === 2">
					<div class="intro-text">
						<h1 class="type-title">{{ t('onboarding.user.title') }}</h1>
						<p class="type-text">{{ t('onboarding.user.text') }}</p>
					</div>
					<v-form v-model="payload.body.user" :fields="userFields" :autofocus="true" :inline="true" />
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
				<Transition name="dialog">
					<v-button v-if="!isLoading" secondary :disabled="isLoading" @click="skipSlide" class="btn-skip">
						{{ t('skip') }}
					</v-button>
				</Transition>
			</div>
			<!-- Right Actions -->
			<div>
				<v-button @click="nextSlide" v-if="!isLoading" :disabled="isLoading">
					{{ isLastSlide ? t('finish_setup') : t('next') }}
				</v-button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Field } from '@directus/types';
import { Ref, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import VForm from '../../components/v-form/v-form.vue';
import ProjectSlide from './slides/project.vue';
import UserSlide from './slides/user.vue';
import WelcomeSlide from './slides/welcome.vue';

type OnboardingPayload = {
	version: 1;
	body: {
		user?: {};
		project?: {};
	};
};

const { t } = useI18n();
const router = useRouter();

const payload: Ref<OnboardingPayload> = ref({
	version: 1,
	body: {
		user: {},
		project: {},
	},
});

const slides = [WelcomeSlide, ProjectSlide, UserSlide];
const currentSlideIndex = ref(0);
const slideCount = slides.length;
const progressPercent = computed(() => (currentSlideIndex.value / slideCount) * 100);
const isFirstSlide = computed(() => currentSlideIndex.value === 0);
const isLastSlide = computed(() => currentSlideIndex.value === slideCount - 1);
const isLoading = ref(false);

function prevSlide() {
	currentSlideIndex.value = Math.max(currentSlideIndex.value - 1, 0);
}

async function skipSlide() {
	if (isLastSlide.value) {
		isLoading.value = true;
		setTimeout(() => {
			router.replace('/content');
		}, 3000);
	}
	currentSlideIndex.value = Math.min(currentSlideIndex.value + 1, slideCount);
}

async function nextSlide() {
	if (isLastSlide.value) {
		isLoading.value = true;
		setTimeout(() => {
			router.replace('/content');
		}, 3000);
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
		name: t('todo'),
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
				label: 'yes',
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
		name: t('todo'),
		field: 'questions_user',
		type: 'string',
		schema: {
			name: 'questions_user',
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
			field: 'questions_user',
			special: null,
			interface: 'select-radio',
			options: {
				choices: [
					{ text: 'Frontend', value: 'frontend' },
					{ text: 'Backend', value: 'backend' },
					{ text: 'Fullstack', value: 'fullstack' },
					{ text: 'SQL queries & basic coding', value: 'sql queries and basic coding' },
					{ text: 'Non technical', value: 'non technical' },
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
		field: 'public_url',
		type: 'string',
		schema: {
			name: 'public_url',
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
			field: 'public_url',
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
		field: 'brand_color',
		type: 'string',
		schema: {
			name: 'brand_color',
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
			field: 'brand_color',
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
		name: t('todo'),
		field: 'questions_project',
		type: 'string',
		schema: {
			name: 'questions_project',
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
			field: 'questions_project',
			special: null,
			interface: 'select-radio',
			options: {
				choices: [
					{ text: 'Personal project', value: 'personal project' },
					{ text: 'Work project', value: 'work project' },
					// Attention! Small hack: Make one option so long that <select-radio> renders with grid-1
					{ text: 'Just exploring            ', value: 'just exploring' },
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
	padding: 64px 16px;
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
