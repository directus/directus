<template>
	<div class="theme-selection">
		<div class="grid with-fill">
			<v-divider
				class="full theme-editor-divider"
				:style="{
					'--v-divider-color': 'var(--g-color-border-subtle)',
				}"
				large
				:inline-title="false"
			>
				<template #default>
					{{ t('field_options.directus_settings.theme_overrides.sections.select_theme.title') }}
				</template>
			</v-divider>
			<div class="theme-previews full">
				<div
					:class="[
						'theme-card',
						{
							'current-theme': currentTheme === 'light',
						},
					]"
				>
					<router-link to="./light">
						<!-- eslint-disable-next-line vue/no-v-html -->
						<div v-if="isSVG(ThemePreview)" class="preview-thumbnail theme-light" v-html="ThemePreview" />
						<div class="card-info">Light Theme</div>
					</router-link>
				</div>
				<div
					:class="[
						'theme-card',
						{
							'current-theme': currentTheme === 'dark',
						},
					]"
				>
					<router-link to="./dark">
						<!-- eslint-disable-next-line vue/no-v-html -->
						<div v-if="isSVG(ThemePreview)" class="preview-thumbnail theme-dark" v-html="ThemePreview" />
						<div class="card-info">Dark Theme</div>
					</router-link>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
// @ts-expect-error: Errors without '*.svg' type declaration
import ThemePreview from '../assets/theme-preview.svg?raw';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
interface Props {
	currentTheme?: string;
}

withDefaults(defineProps<Props>(), {
	currentTheme: 'light',
});

function isSVG(path: string) {
	return path.startsWith('<svg');
}
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';
.theme-selection {
	padding: var(--content-padding);
	transition: all var(--fast) var(--transition);
	.theme-previews {
		display: flex;
		grid-gap: 32px;
		flex-direction: row;
		.theme-card {
			display: flex;
			flex-direction: column;
			flex: auto;
			min-width: 200px;
			max-width: 240px;
			overflow: hidden;
			border-radius: var(--g-border-radius);
			border-width: var(--g-border-width);
			border-style: solid;
			cursor: pointer;
			&.current-theme {
				border-color: var(--g-color-primary-normal);
				color: var(--g-color-primary-accent);
				font-weight: 600;
				.card-info {
					border-color: var(--g-color-primary-normal);
					background-color: var(--g-color-primary-subtle);
				}
			}
			&:not(.current-theme) {
				border-color: var(--g-color-border-normal);
				transition: border-color var(--fast) var(--transition);
				&:hover {
					border-color: var(--g-color-border-accent);
					color: var(--g-color-primary-accent);
					transition: border-color var(--fast) var(--transition);
					.card-info {
						border-color: var(--g-color-border-accent);
						transition: border-color var(--fast) var(--transition), color var(--fast) var(--transition);
					}
				}
				&:active {
					border-color: var(--g-color-primary-normal);
					color: var(--g-color-primary-accent);
					transition: border-color var(--fast) var(--transition);
					.card-info {
						border-color: var(--g-color-primary-normal);
						background-color: var(--g-color-primary-subtle);
						transition: border-color var(--fast) var(--transition), color var(--fast) var(--transition),
							background-color var(--fast) var(--transition);
					}
				}
			}
			.preview-thumbnail {
				width: 100%;
				height: auto;
				font-size: 0;
				line-height: 0;
			}
			.card-info {
				display: flex;
				padding: 12px;
				border-top: var(--g-border-width) solid var(--g-color-border-normal);
				background-color: var(--g-color-background-page);
				transition: border-color var(--fast) var(--transition), color var(--fast) var(--transition);
			}
		}
	}
}
.grid {
	@include form-grid;
}
</style>
