<script setup lang="ts">
import { render } from 'micromustache';
import { computed, inject, ref, useAttrs } from 'vue';
import { useInjectRunManualFlow } from '@/composables/use-flows';
import HelperText from './helper-text.vue';
import { useFieldsStore } from '@/stores/fields';
import { useTemplateData } from '@/composables/use-template-data';
import type { Collection } from '@directus/types';

type Link = {
	icon: string;
	label: string;
	type: string;
	actionType: string;
	url?: string;
	flow?: string;
};

type ParsedLink = Omit<Link, 'url'> & {
	to?: string;
	href?: string;
};

const props = withDefaults(
	defineProps<{
		icon?: string;
		title?: string;
		subtitle?: string;
		links?: Link[];
		help?: string;
		helpDisplayMode?: 'inline' | 'modal';
		enableHelpTranslations?: boolean;
		helpTranslationsString?: string;
		color?: string;
		collection: string;
		primaryKey?: string | number | null;
		disabled?: boolean;
	}>(),
	{
		links: () => [],
		help: '',
		helpDisplayMode: 'inline',
		enableHelpTranslations: false,
		helpTranslationsString: undefined,
	},
);

const fieldsStore = useFieldsStore();

const fields = computed(() => {
	return fieldsStore.getFieldsForCollection(props.collection);
});

const itemValues = inject('values', ref<Record<string, any>>({}));

const primaryKey = computed(() => props.primaryKey ?? null);

const combinedItemData = computed(() => {
	const result = { ...itemValues.value };

	if (fetchedTemplateData.value) {
		Object.entries(fetchedTemplateData.value).forEach(([key, value]) => {
			if (
				value !== null &&
				typeof value === 'object' &&
				(!result[key] || typeof result[key] !== 'object' || result[key] === null)
			) {
				result[key] = value;
			}
		});
	}

	return result;
});

const attrs = useAttrs();

const linksParsed = computed<ParsedLink[]>(() =>
	props.links.map((link) => {
		const interpolatedUrl = link.url ? render(link.url, itemValues.value) : '';
		const isInternalLink = interpolatedUrl?.startsWith('/');

		return {
			icon: link.icon,
			type: link.type,
			label: link.label,
			actionType: link.actionType,
			to: isInternalLink ? interpolatedUrl : undefined,
			href: isInternalLink ? undefined : interpolatedUrl,
			flow: link.actionType === 'flow' ? link.flow : undefined,
		};
	}),
);

const buttonProps = computed(() =>
	linksParsed.value.map((link, index) => {
		const baseProps = {
			key: `${link.actionType}-${index}`,
			class: ['action', link.type],
			secondary: link.type !== 'primary',
			icon: !link.label,
			disabled: (link.actionType === 'flow' && attrs['batch-mode']) || props.disabled,
			loading: link.flow && runningFlows.value.includes(link.flow),
		};

		if (link.actionType === 'url' && link.href) {
			return {
				...baseProps,
				href: link.href,
				to: link.to,
			};
		} else if (link.flow) {
			return {
				...baseProps,
				onClick: () => handleActionClick(link),
			};
		}

		return baseProps;
	}),
);

const expanded = ref(false);
const showHelpModal = ref(false);

function toggleHelp() {
	if (props.helpDisplayMode === 'modal') {
		showHelpModal.value = true;
	} else {
		expanded.value = !expanded.value;
	}
}

async function handleActionClick(action: Link) {
	if (action.actionType === 'flow' && action.flow) {
		if (runningFlows.value.includes(action.flow)) return;

		runManualFlow(action.flow);
	}
}

const primaryLink = computed(() => {
	if (linksParsed.value.length === 1) {
		return linksParsed.value[0];
	}

	return null;
});

const primaryLinkProps = computed(() => {
	if (primaryLink.value) {
		return buttonProps.value[0];
	}

	return null;
});

const helpText = computed(() => {
	if (props.enableHelpTranslations && props.helpTranslationsString) {
		return props.helpTranslationsString;
	}

	return props.help;
});

const collectionRef = computed(
	() =>
		({
			collection: props.collection,
			meta: {},
		}) as Collection,
);

const templateForData = computed(() => {
	const templateParts = [];

	if (props.title) templateParts.push(props.title);
	if (props.subtitle) templateParts.push(props.subtitle);

	props.links?.forEach((link) => {
		if (link.url) templateParts.push(link.url);
	});

	if (templateParts.length) {
		return templateParts.join(' ');
	}

	return '';
});

const { templateData: fetchedTemplateData } = useTemplateData(collectionRef, primaryKey, {
	template: ref(templateForData.value),
});

const { runManualFlow, runningFlows } = useInjectRunManualFlow();
</script>

<template>
	<div class="page-header">
		<div class="header-content" :style="{ '--header-color': color }">
			<div class="text-content">
				<p v-if="title" class="text-title">
					<v-icon v-if="icon" :name="icon" />
					<render-template :collection="collection" :fields="fields" :item="combinedItemData" :template="title" />
				</p>
			</div>
			<div class="actions-wrapper">
				<div class="actions-container">
					<template v-if="help">
						<v-button :secondary="!expanded" small class="help-button" icon @click="toggleHelp">
							<v-icon name="help_outline" />
						</v-button>
					</template>

					<template v-if="primaryLink">
						<v-button
							v-if="primaryLink!.href || primaryLink!.flow"
							v-bind="primaryLinkProps"
							small
							:kind="primaryLink!.type"
						>
							<v-icon v-if="!primaryLink.icon && !primaryLink.label" name="smart_button" />

							<v-icon v-if="primaryLink!.icon" :left="primaryLink.label" :name="primaryLink!.icon" />

							<span v-if="primaryLink!.label">{{ primaryLink!.label }}</span>
						</v-button>
					</template>

					<template v-else-if="linksParsed.length > 1">
						<v-menu placement="bottom-end">
							<template #activator="{ toggle }">
								<div>
									<v-button secondary small class="full-button" @click="toggle">
										{{ $t('actions') }}
										<v-icon name="expand_more" right />
									</v-button>
									<v-button v-tooltip="$t('actions')" secondary small class="icon-button" icon @click="toggle">
										<v-icon name="expand_more" />
									</v-button>
								</div>
							</template>

							<v-list>
								<v-list-item
									v-for="(link, index) in linksParsed"
									:key="index"
									:clickable="!link.flow || (link.flow && !runningFlows.includes(link.flow))"
									:disabled="link.flow && runningFlows.includes(link.flow)"
									@click="link.actionType === 'flow' ? handleActionClick(link) : null"
								>
									<v-list-item-icon v-if="link.icon">
										<v-icon :name="link.icon" />
									</v-list-item-icon>
									<v-list-item-content>
										<template v-if="link.actionType === 'url'">
											<router-link v-if="link.to" :to="link.to">
												{{ $t(link.label) }}
											</router-link>
											<template v-else-if="link.href">
												<a :href="link.href" target="_blank" rel="noopener noreferrer">
													{{ $t(link.label) }}
												</a>
											</template>
										</template>
										<template v-else>
											<template v-if="link.flow && runningFlows.includes(link.flow)">
												<v-progress-circular small indeterminate />
											</template>
											<template v-else>
												{{ $t(link.label) }}
											</template>
										</template>
									</v-list-item-content>
								</v-list-item>
							</v-list>
						</v-menu>
					</template>
				</div>
			</div>
		</div>
		<p v-if="subtitle" class="text-subtitle">
			<render-template :collection="collection" :fields="fields" :item="combinedItemData" :template="subtitle" />
		</p>
		<transition-expand>
			<div v-if="expanded && help && helpDisplayMode !== 'modal'" class="helper-text-outer">
				<helper-text :content="helpText" />
				<div class="collapse-button-container">
					<v-button class="collapse-button" small secondary @click="toggleHelp">
						{{ `${$t('interfaces.header.collapse')}` }}
						<v-icon name="expand_less" right />
					</v-button>
				</div>
			</div>
		</transition-expand>

		<!-- Help Modal -->
		<v-dialog v-model="showHelpModal" keep-behind>
			<v-card class="help-modal">
				<v-button icon class="close-button" secondary small @click="showHelpModal = false">
					<v-icon name="close" />
				</v-button>
				<v-card-text>
					<helper-text :content="helpText" />
				</v-card-text>
				<v-card-actions>
					<v-button @click="showHelpModal = false">
						{{ $t('dismiss') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<style scoped lang="scss">
.page-header {
	position: relative;
	display: block;
	inline-size: 100%;
}

.header-content {
	container-type: inline-size;
	inline-size: 100%;
	display: flex;
	gap: calc(var(--theme--form--column-gap) / 2);
	padding-block-end: 8px;
	border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
	color: var(--header-color, var(--theme--foreground));
	align-items: baseline;
	justify-content: space-between;
	min-inline-size: 0;

	.text-content {
		min-inline-size: 0;
		line-height: normal;

		.text-title {
			display: flex;
			color: var(--theme--foreground-accent);
			overflow: hidden;
			gap: 8px;
			text-overflow: ellipsis;
			white-space: nowrap;
			font-size: 24px;
			font-weight: 600;
			align-items: center;

			.v-icon {
				--v-icon-color: var(--header-color);
				margin-block-start: 2px;
				flex-shrink: 0;
			}
		}
	}

	.actions-wrapper {
		flex-shrink: 0;

		.actions-container {
			display: flex;
			gap: 12px;
			align-items: center;

			.v-button {
				inline-size: 100%;
				justify-content: center;
				position: relative;
			}

			.full-button,
			.help-button {
				display: block;
				position: relative;
			}

			.icon-button {
				display: none;
				position: relative;
			}

			@container (max-width: 600px) {
				align-items: stretch;
				inline-size: 100%;

				.full-button {
					display: none;
					position: relative;
				}

				.icon-button {
					display: block;
					position: relative;
				}
			}
		}
	}
}

.text-subtitle {
	margin-block-start: 4px;
	font-size: 14px;
	color: color-mix(in srgb, var(--theme--foreground), var(--theme--background) 25%);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.helper-text-outer {
	padding-block: 40px;
	padding-inline: 32px;
	border-block-end: var(--theme--border-width) solid var(--theme--border-color);
	background-color: var(--theme--background-subdued);
	overflow-y: scroll;

	:deep(.helper-text) {
		padding: var(--v-card-padding, 16px);
		padding-block-start: 0;
		max-inline-size: 100%;
		overflow-x: auto;
	}

	.collapse-button-container {
		display: flex;
		justify-content: flex-end;
		margin-block-start: 16px;
	}
}

.help-modal {
	position: relative;
	padding-block-start: var(--v-card-padding, 16px);

	.close-button {
		position: absolute;
		inset-block-start: 16px;
		inset-inline-end: 16px;

		:deep(.button) {
			border-radius: 100%;
		}
	}
}
</style>
