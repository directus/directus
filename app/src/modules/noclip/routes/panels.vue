<template>
	<private-view :title="title">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="people_alt" />
			</v-button>
		</template>

		<template #navigation>
			<navigation />
		</template>

		<div class="main">
			<div class="component">
				<v-workspace
					:edit-mode="editMode"
					:tiles="tiles"
					:zoom-to-fit="zoomToFit"
					@duplicate="() => {}"
					@edit="() => {}"
					@update="updatePanel"
					@delete="() => {}"
					@move="() => {}"
				>
					<template #default="{ tile }">
						<div class="panel-container">
							<component
								:is="`panel-${id}`"
								v-bind="bindings"
								:id="tile.id"
								:height="tile.height"
								:width="tile.width"
								:now="now"
								:data="tiles[0].data"
							/>
						</div>
					</template>
				</v-workspace>
			</div>

			<v-divider>{{ t('dx.props') }}</v-divider>

			<div class="props">
				<v-form v-model="bindings" :fields="fields" />
			</div>

			<v-divider>{{ t('dx.panel') }}</v-divider>

			<div class="props">
				<v-form v-model="tiles[0]" :fields="panelFields" />
			</div>

			<v-divider>{{ t('dx.workspace') }}</v-divider>

			<div class="props">
				<v-form v-model="workspaceOptions" :fields="workspaceFields" />
			</div>
		</div>
	</private-view>
</template>

<script lang="ts" setup>
import Navigation from '../components/navigation.vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { DeepPartial, Field, PanelConfig } from '@directus/shared/types';
import { getFieldDefaults } from '../utils/getFieldDefaults';
import { getPanel } from '@/panels';
import VWorkspace from '@/components/v-workspace.vue';
import { AppTile } from '@/components/v-workspace-tile.vue';
import { getOptions } from '../utils/getOptions';

interface Props {
	id: string;
}

const props = defineProps<Props>();

const { t } = useI18n();
const now = new Date();

const panelInfo = computed(() => getPanel(props.id));
const zoomToFit = ref(false);
const editMode = ref(false);
const bindings = ref<Record<string, any>>({});
const loaded = ref(false);

const fields = ref<Partial<Field>[]>([]);

const workspaceOptions = computed({
	get() {
		return {
			editMode: editMode.value,
			zoomToFit: zoomToFit.value,
		};
	},
	set({ editMode: newEditMode, zoomToFit: newZoomToFit }) {
		editMode.value = newEditMode;
		zoomToFit.value = newZoomToFit;
	},
});

const tiles = ref<AppTile[]>([]);

watch(
	panelInfo,
	async (value) => {
		loaded.value = false;
		updateTile();
		await updateDefaults(value);
		await updateField(value);
		if (value) loaded.value = true;
	},
	{ immediate: true }
);

function updateTile() {
	tiles.value[0] = {
		height: 20,
		width: 20,
		x: 10,
		y: 2,
		id: 'my-id',
		name: 'My Panel',
		data: getFieldDefaults('panel', props.id)?.data?.default ?? [],
	};
}

async function updateDefaults(value?: PanelConfig) {
	bindings.value = {};
	if (!value) return;

	const fieldDefaults = getFieldDefaults('panel', props.id);
	const options = getOptions(value.options, bindings.value);

	for (const key of Object.keys(options)) {
		bindings.value[key] = fieldDefaults[key]?.default;
	}
}

async function updateField(value?: PanelConfig) {
	fields.value = [];
	if (!value) return;

	const options = getOptions(value.options, bindings.value);

	fields.value = Object.values(options);
}

const title = computed(() => {
	return `Panels / ${panelInfo.value?.name}`;
});

function updatePanel({
	edits,
}: {
	edits: { width?: number; height?: number; position_x?: number; position_y?: number };
}) {
	if (edits.position_x) tiles.value[0].x = edits.position_x;
	if (edits.position_y) tiles.value[0].y = edits.position_y;
	if (edits.width) tiles.value[0].width = edits.width;
	if (edits.height) tiles.value[0].height = edits.height;
}

const panelFields = computed(() => {
	const fields: DeepPartial<Field>[] = [
		{
			field: 'data',
			type: 'json',
		},
		{
			field: 'width',
			type: 'integer',
			meta: {
				width: 'half',
			},
		},
		{
			field: 'height',
			type: 'integer',
			meta: {
				width: 'half',
			},
		},
		{
			field: 'x',
			type: 'integer',
			meta: {
				width: 'half',
			},
		},
		{
			field: 'y',
			type: 'integer',
			meta: {
				width: 'half',
			},
		},
		{
			field: 'id',
			type: 'string',
			meta: {
				width: 'half',
			},
		},
		{
			field: 'name',
			type: 'string',
			meta: {
				width: 'half',
			},
		},
		{
			field: 'icon',
			type: 'string',
			meta: {
				width: 'half',
			},
		},
		{
			field: 'color',
			type: 'string',
			meta: {
				width: 'half',
			},
		},
		{
			field: 'note',
			type: 'string',
			meta: {
				width: 'half',
			},
		},
		{
			field: 'showHeader',
			type: 'boolean',
			meta: {
				width: 'half',
			},
		},
		{
			field: 'minWidth',
			type: 'integer',
			meta: {
				width: 'half',
			},
		},
		{
			field: 'minHeight',
			type: 'integer',
			meta: {
				width: 'half',
			},
		},
		{
			field: 'draggable',
			type: 'boolean',
			meta: {
				width: 'half',
			},
		},
		{
			field: 'borderRadius',
			type: 'json',
			meta: {
				width: 'half',
			},
		},
	];

	return fields.map((panel) => ({ ...panel, name: t(`dx.${panel.field}`) }));
});

const workspaceFields = computed(() => [
	{
		field: 'editMode',
		type: 'boolean',
		name: t('dx.edit_mode'),
		meta: {
			width: 'half',
		},
	},
	{
		field: 'zoomToFit',
		type: 'boolean',
		name: t('dx.zoom_to_fit'),
		meta: {
			width: 'half',
		},
	},
]);
</script>

<style lang="scss" scoped>
.main {
	padding: var(--content-padding);

	.v-divider {
		margin: 40px 0;
	}
}

.event {
	width: 100%;
	margin: 5px 0;
	cursor: pointer;

	&:hover::before {
		z-index: -1;
		position: absolute;
		content: '';
		top: -5px;
		bottom: -5px;
		left: -5px;
		right: -5px;
		background-color: var(--background-normal-alt);
		border-radius: var(--border-radius);
	}

	.title {
		display: flex;
		justify-content: space-between;

		.date {
			color: var(--foreground-subdued);
		}
	}

	.value {
		color: var(--primary);
	}
}
</style>
