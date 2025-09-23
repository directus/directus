<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import formatTitle from '@directus/format-title';
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { render } from 'micromustache';
import { translate } from './temp/translate-literal';
import { useDrawerDialog } from './temp/useDrawerDialog';
import { useFlows } from './temp/useFlows';
import { useRouter } from 'vue-router';
import dompurify from 'dompurify';

export interface FlowIdentifier {
	collection: string;
	key: string;
}

export interface Action {
	label: string;
	icon?: string;
	type?: 'normal' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
	actionType: 'link' | 'flow';
	url?: string;
	flow?: FlowIdentifier;
}

const props = withDefaults(
	defineProps<{
		icon?: string;
		title?: string;
		subtitle?: string;
		actions?: Action[];
		help?: string;
		helpDisplayMode?: 'inline' | 'modal';
		enableHelpTranslations?: boolean;
		helpTranslationsString?: string;
		values: Record<string, any>;
		color?: string;
		collection: string;
		primaryKey?: string | number | null;
	}>(),
	{
		actions: () => [],
		help: '',
		helpDisplayMode: 'inline',
		enableHelpTranslations: false,
		helpTranslationsString: undefined,
	},
);

const { t } = useI18n();

const fieldsStore = useFieldsStore();
const router = useRouter();

const fields = computed(() => {
	return fieldsStore.getFieldsForCollection(props.collection);
});

const itemValues = inject('values', ref<Record<string, any>>({}));
const fetchedTemplateData = ref<Record<string, any>>({});
const isLoading = ref(false);

const primaryKey = computed(() => props.primaryKey ?? null);

const showReloadDialog = ref(false);

const flowFormData = ref<Record<string, any>>({});

const componentRoot = ref<HTMLElement | null>(null);

const confirmReload = () => {
	showReloadDialog.value = true;
};

const isDialogActive = () => !!displayConfirmDialog.value;

const combinedItemData = computed(() => {
	const result = { ...itemValues.value };

	Object.entries(fetchedTemplateData.value).forEach(([key, value]) => {
		if (
			value !== null &&
			typeof value === 'object' &&
			(!result[key] || typeof result[key] !== 'object' || result[key] === null)
		) {
			result[key] = value;
		}
	});

	return result;
});

function reloadPage() {
	router.go(0);
}

const expanded = ref(false);
const showHelpModal = ref(false);

function toggleHelp() {
	if (props.helpDisplayMode === 'modal') {
		showHelpModal.value = true;
	} else {
		expanded.value = !expanded.value;
	}
}

const actionList = computed(() => {
	if (!props.actions || !props.actions?.length) return [];

	const formattedActions = props.actions.map((action) => {
		if (action.actionType === 'link') {
			return {
				...action,
				url: render(action.url ?? '', combinedItemData.value),
			};
		}

		return action;
	});

	return formattedActions;
});

const hasMultipleActions = computed(() => {
	if (!actionList.value || !actionList.value?.length) return false;
	return actionList.value?.length > 1;
});

const primaryAction = computed(() => {
	if (!actionList.value || !actionList.value?.length) return null;
	return actionList.value[0] || null;
});

function isInternalLink(url: string) {
	const isInternal = url.startsWith('/') || url.startsWith('admin');

	let processedUrl = url;

	if (isInternal) {
		const adminPrefixes = ['/admin/', '/admin', 'admin/', 'admin'];

		for (const prefix of adminPrefixes) {
			if (processedUrl.startsWith(prefix)) {
				processedUrl = processedUrl.slice(prefix.length);
				break;
			}
		}

		processedUrl = processedUrl.startsWith('/') ? processedUrl : `/${processedUrl}`;
	}

	return { isInternal, processedUrl };
}

async function handleActionClick(action: Action) {
	if (action.actionType === 'flow' && action.flow) {
		const effectiveValues = { ...combinedItemData.value };

		if (!effectiveValues.id && primaryKey.value && primaryKey.value !== '+') {
			effectiveValues.id = primaryKey.value;
		}

		runFlow(action.flow, effectiveValues, false);
	}
}

const { dialogKeepBehind, initializeDrawerDetection } = useDrawerDialog(isDialogActive);

const helpText = computed(() => {
	if (props.enableHelpTranslations && props.helpTranslationsString) {
		const translated = translate(props.helpTranslationsString);

		if (translated) {
			return dompurify.sanitize(translated);
		}
	}

	return dompurify.sanitize(props.help);
});

const { runFlow, runningFlows, confirmRunFlow, resetConfirm, executeConfirmedFlow, getFlow } = useFlows(
	props.collection,
	primaryKey,
	confirmReload,
);

const displayConfirmDialog = computed(() => !!confirmRunFlow.value && !!confirmDetails.value);

const confirmDetails = computed(() => {
	if (!confirmRunFlow.value) return null;

	const flow = getFlow(confirmRunFlow.value);
	if (!flow) return null;

	if (!flow.options?.requireConfirmation) return null;

	const formattedFields = (flow.options.fields ?? []).map((field: Record<string, any>) => ({
		...field,
		name: field.name || (field.field ? formatTitle(field.field) : ''),
	}));

	return {
		description: flow.options.confirmationDescription || t('run_flow_confirm'),
		fields: formattedFields,
	};
});

const resetFlowForm = () => {
	flowFormData.value = {};
};

onMounted(() => {
	const cleanup = initializeDrawerDetection(componentRoot.value);

	if (cleanup) {
		onUnmounted(cleanup);
	}
});

function getAllRequiredTemplateFields(): string[] {
	const fieldsFromTitle = props.title ? getFieldsFromTemplate(props.title) : [];
	const fieldsFromSubtitle = props.subtitle ? getFieldsFromTemplate(props.subtitle) : [];

	const fieldsFromLinks =
		props.actions
			?.filter((action) => action.actionType === 'link' && action.url)
			.flatMap((action) => getFieldsFromTemplate(action.url || '')) || [];

	const allFields = [...fieldsFromTitle, ...fieldsFromSubtitle, ...fieldsFromLinks];
	return [...new Set(allFields)];
}

watch(
	[primaryKey, () => getAllRequiredTemplateFields()],
	async ([value, fields]) => {
		if (!value || value === '+' || fields.length === 0) {
			fetchedTemplateData.value = {};
			return;
		}

		isLoading.value = true;

		try {
			const response = await api.get(`${getEndpoint(props.collection)}/${value}`, {
				params: {
					fields,
				},
			});

			fetchedTemplateData.value = response.data.data;
		} catch (error) {
			// TODO: Figure out how log error
			// console.error('Failed to fetch template data:', error);
			fetchedTemplateData.value = {};
		} finally {
			isLoading.value = false;
		}
	},
	{ immediate: true },
);
</script>

<template>
	<div ref="componentRoot" class="page-header">
		<div class="header-content" :style="{ '--header-color': color }">
			<div class="text-content">
				<p v-if="title" class="text-title">
					<v-icon v-if="icon" :name="icon" />
					<render-template :collection="collection" :fields="fields" :item="combinedItemData" :template="title" />
				</p>
				<p v-if="subtitle" class="text-subtitle">
					<render-template :collection="collection" :fields="fields" :item="combinedItemData" :template="subtitle" />
				</p>
			</div>
			<div class="actions-wrapper">
				<div class="actions-container">
					<template v-if="help">
						<v-button :secondary="!expanded" small class="help-button" icon @click="toggleHelp">
							<v-icon name="help_outline" />
						</v-button>
					</template>
					<template v-if="!hasMultipleActions && primaryAction">
						<template v-if="primaryAction.actionType === 'link'">
							<v-button
								v-if="isInternalLink(primaryAction.url || '').isInternal"
								:to="isInternalLink(primaryAction.url || '').processedUrl"
								small
								:kind="primaryAction.type"
							>
								{{ primaryAction.label }}
								<v-icon v-if="primaryAction.icon" :name="primaryAction.icon" right />
							</v-button>
							<v-button
								v-else
								tag="a"
								:href="primaryAction.url || ''"
								target="_blank"
								rel="noopener noreferrer"
								small
								:kind="primaryAction.type"
							>
								{{ primaryAction.label }}
								<v-icon v-if="primaryAction.icon" :name="primaryAction.icon" right />
							</v-button>
						</template>

						<v-button
							v-else-if="primaryAction.actionType === 'flow' && primaryAction.flow"
							:kind="primaryAction.type"
							small
							:loading="runningFlows.includes(primaryAction.flow.key)"
							@click="handleActionClick(primaryAction)"
						>
							{{ primaryAction.label }}
							<v-icon v-if="primaryAction.icon" :name="primaryAction.icon" right />
						</v-button>
					</template>

					<v-menu v-else-if="hasMultipleActions" placement="bottom-end">
						<template #activator="{ toggle }">
							<div>
								<v-button secondary small class="full-button" @click="toggle">
									{{ t('actions') }}
									<v-icon name="expand_more" right />
								</v-button>
								<v-button v-tooltip="t('actions')" secondary small class="icon-button" icon @click="toggle">
									<v-icon name="expand_more" />
								</v-button>
							</div>
						</template>

						<v-list>
							<v-list-item
								v-for="(action, index) in actionList"
								:key="index"
								clickable
								@click="action.actionType === 'flow' ? handleActionClick(action) : null"
							>
								<v-list-item-icon v-if="action.icon">
									<v-icon :name="action.icon" />
								</v-list-item-icon>
								<v-list-item-content>
									<template v-if="action.actionType === 'link'">
										<template v-if="isInternalLink(action.url || '').isInternal">
											<router-link :to="isInternalLink(action.url || '').processedUrl">
												<v-list-item-title>
													{{ t(action.label) }}
												</v-list-item-title>
											</router-link>
										</template>
										<template v-else>
											<a :href="action.url" target="_blank" rel="noopener noreferrer">
												<v-list-item-title>
													{{ t(action.label) }}
												</v-list-item-title>
											</a>
										</template>
									</template>
									<template v-else>
										<v-list-item-title>
											{{ t(action.label) }}
										</v-list-item-title>
									</template>
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</div>
			</div>
		</div>
		<transition-expand>
			<div v-if="expanded && help && helpDisplayMode !== 'modal'" class="help-text">
				<!-- eslint-disable-next-line vue/no-v-html -->
				<div v-html="helpText" />
				<div class="collapse-button-container">
					<v-button class="collapse-button" small secondary @click="toggleHelp">
						{{ `${t('collapse')} ${t('help')}` }}
						<v-icon name="expand_less" right />
					</v-button>
				</div>
			</div>
		</transition-expand>

		<!-- Help Modal -->
		<v-dialog v-model="showHelpModal" :keep-behind="dialogKeepBehind">
			<v-card class="help-modal">
				<v-button icon class="close-button" secondary small @click="showHelpModal = false">
					<v-icon name="close" />
				</v-button>
				<v-card-text>
					<!-- eslint-disable-next-line vue/no-v-html -->
					<div v-html="helpText" />
				</v-card-text>
				<v-card-actions>
					<v-button @click="showHelpModal = false">
						{{ t('dismiss') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-model="displayConfirmDialog" :keep-behind="dialogKeepBehind" @esc="resetConfirm">
			<v-card>
				<v-card-title>{{ confirmDetails!.description ?? t('run_flow_confirm') }}</v-card-title>
				<v-card-text class="confirm-form">
					<v-form
						v-if="confirmDetails?.fields && confirmDetails.fields.length > 0"
						v-model="flowFormData"
						:fields="confirmDetails.fields"
						primary-key="+"
						autofocus
					/>
				</v-card-text>
				<v-card-actions>
					<v-button
						secondary
						@click="
							() => {
								resetConfirm();
								resetFlowForm();
							}
						"
					>
						{{ t('cancel') }}
					</v-button>
					<v-button
						@click="
							() => {
								executeConfirmedFlow(confirmRunFlow || '', flowFormData);
								resetFlowForm();
							}
						"
					>
						{{ t('run_flow') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-model="showReloadDialog" :keep-behind="dialogKeepBehind">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>
					{{
						'The item has been updated. Would you like to reload to see the latest changes? Any unsaved changes will be lost.'
					}}
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="showReloadDialog = false">
						{{ t('dismiss') || 'Dismiss' }}
					</v-button>
					<v-button warning @click="reloadPage">
						{{ t('reload_page') || 'Reload Page' }}
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
	border-block-end: var(--theme--border-width) solid var(--theme--border-color);
	color: var(--header-color, var(--theme--foreground));
	align-items: flex-start;
	justify-content: space-between;
	min-inline-size: 0;
}

.text-content {
	min-inline-size: 0;
	flex: 1;

	.v-icon {
		--v-icon-color: var(--header-color);
		margin-block-start: 2px;
		flex-shrink: 0;
	}

	.text-title {
		display: flex;
		overflow: hidden;
		gap: 8px;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 20px;
		font-weight: 600;
	}

	.text-subtitle {
		margin-block-start: 4px;
		font-size: 14px;
		color: color-mix(in srgb, var(--theme--foreground), var(--theme--background) 25%);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}

.actions-wrapper {
	flex-shrink: 0;
}

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

.help-text {
	padding-block: 16px;
	border-block-end: var(--theme--border-width) solid var(--theme--border-color);
	max-block-size: 540px;
	overflow-y: scroll;
	background-color: var(--theme--background-subdued);

	:deep(.helper-text) {
		padding: var(--v-card-padding, 16px);
		padding-block-start: 0;
		max-inline-size: 100%;
		overflow-x: auto;
	}
}

.collapse-button-container {
	display: flex;
	justify-content: flex-end;
}

.confirm-form {
	--theme--form--column-gap: 24px;
	--theme--form--row-gap: 24px;

	margin-block-start: var(--v-card-padding, 16px);

	:deep(.type-label) {
		font-size: 1rem;
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
