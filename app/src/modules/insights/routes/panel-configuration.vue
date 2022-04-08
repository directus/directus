<template>
	<v-drawer
		:model-value="isOpen"
		:title="panel?.name || t('panel')"
		:subtitle="t('panel_options')"
		:icon="panel?.icon || 'insert_chart'"
		persistent
		@cancel="$emit('cancel')"
	>
		<template #actions>
			<v-button v-tooltip.bottom="t('done')" :disabled="!edits.type" icon rounded @click="emitSave">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="content">
			<p class="type-label panel-type-label">{{ t('type') }}</p>
			<div v-for="group of groups" :key="group.key" class="group">
				<h2>{{ group.name }}</h2>

				<div class="grid">
					<button
						v-for="panel of group.panels"
						:key="panel.id"
						class="panel"
						:class="{ active: chosenPanel === panel.id, gray: chosenPanel && chosenPanel !== panel.id }"
						@click="toggleInterface(panel.id)"
					>
						<div class="preview">
							<span class="fallback">
								<v-icon large :name="panel.icon ?? 'insert_chart'" />
							</span>
						</div>
						<v-text-overflow :text="panel.name" class="name" />
					</button>

					<transition-expand>
						<extension-options
							v-if="edits.type"
							v-model="edits.options"
							:options="customOptionsFields"
							type="panel"
							:extension="edits.type"
						/>
					</transition-expand>
				</div>
			</div>
			<v-divider :inline-title="false" large>
				<template #icon><v-icon name="info" /></template>
				<template #default>{{ t('panel_header') }}</template>
			</v-divider>

			<div class="form-grid">
				<div class="field half-left">
					<p class="type-label">{{ t('visible') }}</p>
					<v-checkbox v-model="edits.show_header" block :label="t('show_header')" />
				</div>

				<div class="field half-right">
					<p class="type-label">{{ t('name') }}</p>
					<v-input
						v-model="edits.name"
						:nullable="false"
						:disabled="edits.show_header !== true"
						:placeholder="t('panel_name_placeholder')"
					/>
				</div>

				<div class="field half-left">
					<p class="type-label">{{ t('icon') }}</p>
					<interface-select-icon
						:value="edits.icon"
						:disabled="edits.show_header !== true"
						@input="edits.icon = $event"
					/>
				</div>

				<div class="field half-right">
					<p class="type-label">{{ t('color') }}</p>
					<interface-select-color
						:value="edits.color"
						:disabled="edits.show_header !== true"
						width="half"
						@input="edits.color = $event"
					/>
				</div>

				<div class="field full">
					<p class="type-label">{{ t('note') }}</p>
					<v-input
						v-model="edits.note"
						:disabled="edits.show_header !== true"
						:placeholder="t('panel_note_placeholder')"
					/>
				</div>
			</div>
		</div>
	</v-drawer>
</template>

<script lang="ts">
import ExtensionOptions from '../../settings/routes/data-model/field-detail/shared/extension-options.vue';
import { computed, defineComponent, reactive, watch, PropType, ref } from 'vue';
import { getPanels, getPanel } from '@/panels';
import { Panel } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { sortGroups } from '../utils/sortGroups';

export default defineComponent({
	name: 'PanelConfiguration',
	components: { ExtensionOptions },
	props: {
		panel: {
			type: Object as PropType<Partial<Panel>>,
			default: null,
		},
	},
	emits: ['cancel', 'save'],
	setup(props, { emit }) {
		const { t } = useI18n();
		const isOpen = useDialogRoute();
		const chosenPanel = ref();

		const edits = reactive<Partial<Panel>>({
			show_header: props.panel?.show_header ?? true,
			type: props.panel?.type || chosenPanel.value,
			name: props.panel?.name,
			note: props.panel?.note,
			icon: props.panel?.icon ?? undefined,
			color: props.panel?.color,
			width: props.panel?.width ?? undefined,
			height: props.panel?.height ?? undefined,
			position_x: props.panel?.position_x ?? 1,
			position_y: props.panel?.position_y ?? 1,
			options: props.panel?.options ?? {},
		});

		const extensionInfo = computed(() => {
			return getPanel(edits.type);
		});

		watch(extensionInfo, (newPanel) => {
			if (newPanel) {
				edits.width = newPanel.minWidth;
				edits.height = newPanel.minHeight;
			} else {
				edits.width = undefined;
				edits.height = undefined;
			}
		});

		const customOptionsFields = computed(() => {
			if (typeof extensionInfo.value?.options === 'function') {
				return extensionInfo.value?.options(edits);
			}

			return null;
		});

		const configRow = computed(() => {
			if (!chosenPanel.value) return null;

			let indexInGroup: number | null = null;

			groups.value.forEach((group) => {
				const index = group.panels.findIndex((inter) => inter.id === chosenPanel.value);
				if (index !== -1) indexInGroup = index;
			});

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

		const { panels } = getPanels();

		const groups = computed(() => sortGroups(panels.value));

		return {
			t,
			isOpen,
			panels,
			groups,
			chosenPanel,
			toggleInterface,
			configRow,
			close,
			emitSave,
			edits,
			setOptionsValues,
			customOptionsFields,
		};

		function toggleInterface(id: string) {
			if (chosenPanel.value === id) {
				chosenPanel.value = null;
			} else {
				chosenPanel.value = id;
			}
		}
		function emitSave() {
			emit('save', edits);
		}

		function setOptionsValues(newValues: any) {
			edits.options = newValues;
		}
	},
});
</script>

<style scoped lang="scss">
.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);
}

.select {
	margin-bottom: 32px;
}

.panel-type-label {
	margin-bottom: 16px;
}

.v-divider {
	margin: 68px 0 48px;
}

.group h2 {
	margin-bottom: 40px;
	padding-bottom: 2px;
	font-weight: 700;
	border-bottom: var(--border-width) solid var(--border-subdued);
}

.group + .group {
	margin-top: 80px;
}

.grid {
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

.panel {
	min-height: 100px;
	overflow: hidden;
	text-align: left;
}

.preview {
	--v-icon-color: var(--background-page);

	display: flex;
	align-items: center;
	justify-content: center;
	width: 160px;
	height: 100px;
	margin-bottom: 8px;
	border: var(--border-width) solid var(--border-subdued);
	border-radius: var(--border-radius);
	transition: var(--fast) var(--transition);
	transition-property: background-color, border-color;
}

.preview img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.preview span {
	display: contents;
}

.preview :deep(svg) {
	width: 100%;
	height: 100%;
}

.preview :deep(svg) .glow {
	filter: drop-shadow(0 0 4px var(--primary-50));
}

.preview .fallback {
	--v-icon-color: var(--primary-75);

	display: block;
	padding: 8px 16px;
	background-color: var(--background-page);
	border: 2px solid var(--primary);
	border-radius: var(--border-radius);
	box-shadow: 0 0 8px var(--primary-75);
}

.panel:hover .preview {
	border-color: var(--border-normal);
}

.panel.active .preview {
	background-color: var(--primary-alt);
	border-color: var(--primary);
}

.panel.gray .preview {
	--primary: var(--foreground-subdued);
	--primary-50: var(--foreground-subdued);

	background-color: var(--background-subdued);
}

.panel.gray .preview .fallback {
	--v-icon-color: var(--foreground-subdued);

	box-shadow: 0 0 8px var(--foreground-subdued);
}
</style>
