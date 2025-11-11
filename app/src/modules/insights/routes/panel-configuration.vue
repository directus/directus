<script setup lang="ts">
import { useDialogRoute } from '@/composables/use-dialog-route';
import { useExtension } from '@/composables/use-extension';
import { useExtensions } from '@/extensions';
import { CreatePanel, useInsightsStore } from '@/stores/insights';
import type { Panel } from '@directus/extensions';
import { assign, clone, isUndefined, omitBy } from 'lodash';
import { nanoid } from 'nanoid/non-secure';
import { storeToRefs } from 'pinia';
import { computed, reactive, unref } from 'vue';
import { useRouter } from 'vue-router';
import ExtensionOptions from '../../settings/routes/data-model/field-detail/shared/extension-options.vue';

const props = defineProps<{
	dashboardKey: string;
	panelKey: string;
}>();


const isOpen = useDialogRoute();

const edits = reactive<Partial<Panel>>({
	show_header: undefined,
	type: undefined,
	name: undefined,
	note: undefined,
	icon: undefined,
	color: undefined,
	width: undefined,
	height: undefined,
	position_x: undefined,
	position_y: undefined,
	options: undefined,
});

const insightsStore = useInsightsStore();

const { panels } = storeToRefs(insightsStore);
const { panels: panelTypes } = useExtensions();

const router = useRouter();

const panel = computed<Partial<Panel>>(() => {
	if (props.panelKey === '+') return edits;
	const existing: Partial<Panel> = unref(panels).find((panel) => panel.id === props.panelKey) ?? {};
	return assign({}, existing, omitBy(edits, isUndefined));
});

const currentTypeInfo = useExtension(
	'panel',
	computed(() => panel.value.type ?? null),
);

const customOptionsFields = computed(() => {
	if (typeof currentTypeInfo.value?.options === 'function') {
		return currentTypeInfo.value.options(unref(panel)) ?? undefined;
	}

	return undefined;
});

function isSVG(path: string) {
	return path.startsWith('<svg');
}

const configRow = computed(() => {
	if (!panel.value.type) return null;

	let indexInGroup: number | null = null;

	const index = panelTypes.value.findIndex((pan) => pan.id === panel.value.type);
	if (index !== -1) indexInGroup = index;

	if (indexInGroup === null) return null;

	const windowWidth = window.innerWidth;

	let columns = 1;

	if (windowWidth > 400) {
		columns = 2;
	}

	if (windowWidth > 600) {
		columns = 3;
	}

	if (windowWidth > 840) {
		columns = 4;
	}

	return Math.ceil((indexInGroup + 1) / columns) + 1;
});

function togglePanel(id: string) {
	if (edits.type === id) {
		edits.type = undefined;
	} else {
		edits.type = id;
	}
}

const stageChanges = () => {
	if (!panel.value.type) return;

	if (props.panelKey === '+') {
		const createPanel = clone(unref(panel));

		createPanel.id = `_${nanoid()}`;
		createPanel.dashboard = props.dashboardKey;
		createPanel.width ??= unref(currentTypeInfo)?.minWidth ?? 4;
		createPanel.height ??= unref(currentTypeInfo)?.minHeight ?? 4;
		createPanel.position_x ??= 1;
		createPanel.position_y ??= 1;
		createPanel.options ??= {};

		insightsStore.stagePanelCreate(unref(createPanel as CreatePanel));
		router.push(`/insights/${props.dashboardKey}`);
	} else {
		insightsStore.stagePanelUpdate({ id: props.panelKey, edits: unref(panel) });
		router.push(`/insights/${props.dashboardKey}`);
	}
};
</script>

<template>
	<v-drawer
		:model-value="isOpen"
		:title="panel?.name || $t('panel')"
		:subtitle="$t('panel_options')"
		:icon="panel?.icon || 'insert_chart'"
		persistent
		@cancel="router.push(`/insights/${dashboardKey}`)"
		@apply="stageChanges"
	>
		<template #actions>
			<v-button v-tooltip.bottom="$t('done')" :disabled="!panel.type" icon rounded @click="stageChanges">
				<v-icon name="check" />
			</v-button>
		</template>
		<div class="content">
			<div class="panel-grid">
				<button
					v-for="pan of panelTypes"
					:key="pan.id"
					class="interface"
					:class="{ active: panel.type === pan.id, subdued: panel.type && panel.type !== pan.id }"
					@click="togglePanel(pan.id)"
				>
					<div class="preview">
						<template v-if="pan.preview">
							<!-- eslint-disable-next-line vue/no-v-html -->
							<span v-if="isSVG(pan.preview)" class="svg" v-html="pan.preview" />
							<img v-else :src="pan.preview" alt="" />
						</template>

						<span v-else class="fallback">
							<v-icon large :name="pan.icon" />
						</span>
					</div>
					<v-text-overflow :text="pan.name" class="name" />
				</button>

				<transition-expand>
					<div v-if="panel.type" class="field-configuration" :style="configRow ? { 'grid-row': configRow } : {}">
						<div class="setup">
							<extension-options
								:model-value="panel.options"
								:options="customOptionsFields"
								type="panel"
								:extension="panel.type"
								raw-editor-enabled
								@update:model-value="edits.options = $event"
							/>
							<v-divider :inline-title="false" large>
								<template #icon><v-icon name="info" /></template>
								<template #default>{{ $t('panel_header') }}</template>
							</v-divider>

							<div class="form-grid">
								<div class="field half-left">
									<p class="type-label">{{ $t('visible') }}</p>
									<v-checkbox
										:model-value="panel.show_header"
										block
										:label="$t('show_header')"
										@update:model-value="edits.show_header = $event"
									/>
								</div>

								<div class="field half-right">
									<p class="type-label">{{ $t('name') }}</p>
									<v-input
										:model-value="panel.name"
										:nullable="false"
										:disabled="panel.show_header !== true"
										:placeholder="$t('panel_name_placeholder')"
										@update:model-value="edits.name = $event"
									/>
								</div>

								<div class="field half-left">
									<p class="type-label">{{ $t('icon') }}</p>
									<interface-select-icon
										:value="panel.icon"
										:disabled="panel.show_header !== true"
										@input="edits.icon = $event"
									/>
								</div>

								<div class="field half-right">
									<p class="type-label">{{ $t('color') }}</p>
									<interface-select-color
										:value="panel.color"
										:disabled="panel.show_header !== true"
										width="half"
										@input="edits.color = $event"
									/>
								</div>

								<div class="field full">
									<p class="type-label">{{ $t('note') }}</p>
									<v-input
										:model-value="panel.note"
										:disabled="panel.show_header !== true"
										:placeholder="$t('panel_note_placeholder')"
										@update:model-value="edits.note = $event"
									/>
								</div>
							</div>
						</div>
					</div>
				</transition-expand>
			</div>
		</div>
	</v-drawer>
</template>

<style scoped lang="scss">
.content {
	padding: var(--content-padding);
	padding-block: 0 var(--content-padding-bottom);
}

.v-divider {
	margin: 68px 0 48px;
}

.group h2 {
	margin-block-end: 40px;
	padding-block-end: 2px;
	font-weight: 700;
	border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.group + .group {
	margin-block-start: 80px;
}

.panel-grid {
	--columns: 1;

	display: grid;
	grid-template-columns: repeat(var(--columns), 1fr);
	gap: 32px;

	@media (min-width: 400px) {
		--columns: 2;
	}

	@media (min-width: 600px) {
		--columns: 3;
	}

	@media (min-width: 840px) {
		--columns: 4;
	}
}

.interface {
	min-block-size: 100px;
	overflow: hidden;
	text-align: start;
}

.preview {
	--v-icon-color: var(--background-page);

	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 160px;
	block-size: 100px;
	margin-block-end: 8px;
	border: var(--theme--border-width) solid var(--theme--border-color-subdued);
	border-radius: var(--theme--border-radius);
	transition: var(--fast) var(--transition);
	transition-property: background-color, border-color;
}

.preview img {
	inline-size: 100%;
	block-size: 100%;
	object-fit: cover;
}

.preview .svg {
	display: contents;
}

.preview :deep(svg) {
	inline-size: 100%;
	block-size: 100%;
}

.preview :deep(svg) .glow {
	filter: drop-shadow(0 0 4px var(--theme--primary-subdued));
}

.preview .fallback {
	--v-icon-color: var(--theme--primary-75);

	display: block;
	padding: 8px 16px;
	background-color: var(--background-page);
	border: var(--theme--border-width) solid var(--theme--primary);
	border-radius: var(--theme--border-radius);
	box-shadow: 0 0 8px var(--theme--primary-75);
}

.interface:hover .preview {
	border-color: var(--theme--form--field--input--border-color);
}

.interface.active .preview {
	background-color: var(--theme--primary-background);
	border-color: var(--theme--primary);
}

.interface.subdued .preview {
	background-color: var(--theme--background-subdued);
}

.interface.subdued .preview .fallback {
	--v-icon-color: var(--theme--foreground-subdued);

	box-shadow: 0 0 8px var(--theme--foreground-subdued);
}

.field-configuration {
	--v-button-background-color-disabled: var(--theme--background-normal);
	--columns: 1;

	grid-column: 1 / span var(--columns);
	background-color: var(--theme--background-subdued);
	border-block-start: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-block-end: var(--theme--border-width) solid var(--theme--form--field--input--border-color);

	@media (min-width: 400px) {
		--columns: 2;
	}

	@media (min-width: 600px) {
		--columns: 3;
	}

	@media (min-width: 840px) {
		--columns: 4;
	}
}

:deep(.v-notice.normal) {
	background-color: var(--foreground-inverted);
}

:deep(.v-notice.string) {
	background-color: var(--foreground-inverted);
}

.setup {
	--theme--form--row-gap: 20px;
	margin: 34px;
}
</style>
