<template>
	<div v-if="extension" class="extension">
		<div v-if="!app" class="title">{{ formatTitle(extension.id) }}</div>
		<div v-if="extension.author || maintainers.length > 0" class="users">
			<RouterLink
				v-if="extension.author"
				class="author"
				:to="(app ? '/settings/market/users/' : '/users/') + extension.author.email"
			>
				<div class="avatar">
					<img v-if="extension.author.avatar" :src="extension.author.avatar" />
					<svg v-else width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M31.9857 15.422C31.8 15.3756 31.6453 15.3292 31.5061 15.2673C31.4032 15.2215 31.3172 15.1673 31.2418 15.1047C31.1917 15.0631 31.1702 14.9975 31.1765 14.9327C31.2511 14.1555 31.169 13.4699 31.2431 12.6992C31.5525 9.57422 33.5172 10.5643 35.2808 10.0538C36.2936 9.76852 37.3063 9.20706 37.6764 8.10265C37.7369 7.92185 37.6836 7.72529 37.5577 7.58211C36.4024 6.26855 35.1234 5.1079 33.7338 4.11321C29.075 0.796237 23.0202 -0.581126 17.4598 0.224572C17.2492 0.255094 17.1388 0.488447 17.2538 0.667506C17.9581 1.76337 18.8871 2.66019 19.9526 3.32029C20.1462 3.44025 20.0684 3.69938 19.8462 3.64954C19.3236 3.53239 18.6523 3.30391 18.0208 2.85834C17.96 2.81539 17.8816 2.80458 17.8124 2.83217C17.5302 2.94473 17.1225 3.10705 16.7857 3.25246C16.5918 3.33617 16.5523 3.58624 16.7119 3.72458C19.5047 6.14542 23.5676 6.51344 26.749 4.57616C26.9428 4.45815 27.2531 4.70066 27.1907 4.91881C27.0907 5.26826 26.9739 5.74862 26.8495 6.40281C26.0606 10.3941 23.7864 10.0847 20.9708 9.07917C15.3448 7.0401 12.153 8.78136 9.31532 5.33442C9.11815 5.09491 8.77153 5.01188 8.53699 5.21494C7.95121 5.72211 7.60451 6.4624 7.60451 7.25368C7.60451 8.1909 8.08831 8.99374 8.80539 9.4743C8.89509 9.53441 9.01428 9.50901 9.08122 9.42429C9.25596 9.20313 9.3989 9.05653 9.5769 8.96381C9.77172 8.86234 9.86673 9.14102 9.70226 9.28664C9.09957 9.82027 8.92658 10.456 8.53273 11.7091C7.91392 13.6738 8.17691 15.685 5.28397 16.211C3.75241 16.2883 3.78335 17.3248 3.22642 18.8719C2.58007 20.7391 1.73369 21.5661 0.167263 23.1978C-0.0469743 23.421 -0.0653456 23.7778 0.170099 23.9785C0.795807 24.5118 1.4411 24.5411 2.09709 24.271C3.72147 23.5903 4.97456 21.4863 6.1503 20.125C7.46528 18.6089 10.6212 19.2586 13.0036 17.7735C14.2885 16.9856 15.0605 15.9792 14.8136 14.4717C14.7739 14.2289 15.0517 14.0829 15.1525 14.3074C15.3438 14.7336 15.4692 15.1881 15.5213 15.6578C15.535 15.781 15.645 15.8721 15.7687 15.8651C18.3463 15.7202 21.6795 18.5632 24.7946 19.3324C24.984 19.3792 25.1187 19.1604 25.0116 18.9973C24.8145 18.6971 24.647 18.3857 24.5135 18.0674C24.3758 17.7368 24.2714 17.416 24.1975 17.1063C24.1398 16.8642 24.4936 16.7991 24.6144 17.0168C25.4133 18.4568 27.0099 19.8091 29.232 19.9702C29.99 20.0321 30.8254 19.9393 31.6917 19.6763C32.7282 19.3669 33.6874 18.9647 34.8322 19.1813C35.6831 19.336 36.472 19.7691 36.9671 20.4962C37.6618 21.5093 39.1281 21.7777 39.9097 20.7189C40.0161 20.5749 40.025 20.3822 39.9547 20.2175C38.2338 16.1838 33.8639 15.9067 31.9857 15.422Z"
							fill="white"
						/>
					</svg>
				</div>
				Created By {{ extension.author.name }}
				<div class="spacer" />
				<v-icon name="arrow_forward" />
			</RouterLink>
			<div v-if="maintainers.length > 0" :style="{ '--count': maintainers.length }" class="maintainers">
				<RouterLink
					v-for="maintainer in maintainers"
					:key="maintainer.email"
					v-tooltip="`Maintained By ${maintainer.name}`"
					class="maintainer avatar"
					:to="(app ? '/settings/market/users/' : '/users/') + maintainer.email"
				>
					<img v-if="maintainer.avatar" :src="maintainer.avatar" />
					<svg v-else width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M31.9857 15.422C31.8 15.3756 31.6453 15.3292 31.5061 15.2673C31.4032 15.2215 31.3172 15.1673 31.2418 15.1047C31.1917 15.0631 31.1702 14.9975 31.1765 14.9327C31.2511 14.1555 31.169 13.4699 31.2431 12.6992C31.5525 9.57422 33.5172 10.5643 35.2808 10.0538C36.2936 9.76852 37.3063 9.20706 37.6764 8.10265C37.7369 7.92185 37.6836 7.72529 37.5577 7.58211C36.4024 6.26855 35.1234 5.1079 33.7338 4.11321C29.075 0.796237 23.0202 -0.581126 17.4598 0.224572C17.2492 0.255094 17.1388 0.488447 17.2538 0.667506C17.9581 1.76337 18.8871 2.66019 19.9526 3.32029C20.1462 3.44025 20.0684 3.69938 19.8462 3.64954C19.3236 3.53239 18.6523 3.30391 18.0208 2.85834C17.96 2.81539 17.8816 2.80458 17.8124 2.83217C17.5302 2.94473 17.1225 3.10705 16.7857 3.25246C16.5918 3.33617 16.5523 3.58624 16.7119 3.72458C19.5047 6.14542 23.5676 6.51344 26.749 4.57616C26.9428 4.45815 27.2531 4.70066 27.1907 4.91881C27.0907 5.26826 26.9739 5.74862 26.8495 6.40281C26.0606 10.3941 23.7864 10.0847 20.9708 9.07917C15.3448 7.0401 12.153 8.78136 9.31532 5.33442C9.11815 5.09491 8.77153 5.01188 8.53699 5.21494C7.95121 5.72211 7.60451 6.4624 7.60451 7.25368C7.60451 8.1909 8.08831 8.99374 8.80539 9.4743C8.89509 9.53441 9.01428 9.50901 9.08122 9.42429C9.25596 9.20313 9.3989 9.05653 9.5769 8.96381C9.77172 8.86234 9.86673 9.14102 9.70226 9.28664C9.09957 9.82027 8.92658 10.456 8.53273 11.7091C7.91392 13.6738 8.17691 15.685 5.28397 16.211C3.75241 16.2883 3.78335 17.3248 3.22642 18.8719C2.58007 20.7391 1.73369 21.5661 0.167263 23.1978C-0.0469743 23.421 -0.0653456 23.7778 0.170099 23.9785C0.795807 24.5118 1.4411 24.5411 2.09709 24.271C3.72147 23.5903 4.97456 21.4863 6.1503 20.125C7.46528 18.6089 10.6212 19.2586 13.0036 17.7735C14.2885 16.9856 15.0605 15.9792 14.8136 14.4717C14.7739 14.2289 15.0517 14.0829 15.1525 14.3074C15.3438 14.7336 15.4692 15.1881 15.5213 15.6578C15.535 15.781 15.645 15.8721 15.7687 15.8651C18.3463 15.7202 21.6795 18.5632 24.7946 19.3324C24.984 19.3792 25.1187 19.1604 25.0116 18.9973C24.8145 18.6971 24.647 18.3857 24.5135 18.0674C24.3758 17.7368 24.2714 17.416 24.1975 17.1063C24.1398 16.8642 24.4936 16.7991 24.6144 17.0168C25.4133 18.4568 27.0099 19.8091 29.232 19.9702C29.99 20.0321 30.8254 19.9393 31.6917 19.6763C32.7282 19.3669 33.6874 18.9647 34.8322 19.1813C35.6831 19.336 36.472 19.7691 36.9671 20.4962C37.6618 21.5093 39.1281 21.7777 39.9097 20.7189C40.0161 20.5749 40.025 20.3822 39.9547 20.2175C38.2338 16.1838 33.8639 15.9067 31.9857 15.422Z"
							fill="white"
						/>
					</svg>
				</RouterLink>
				Maintainers
			</div>
		</div>
		<div class="banners">
			<div v-if="svgPath" ref="downloadsRef" class="downloads">
				<svg :viewBox="`0 0 ${width} ${height}`" xmlns="http://www.w3.org/2000/svg">
					<path :d="svgPath" />
				</svg>
			</div>
			<div v-if="extension.stars" class="stars">
				<v-icon name="star" />
				{{ formatNumber(extension.stars) }} GitHub Stars
			</div>
			<div class="info">
				<v-icon :name="app ? 'info' : 'info_outline'" />
				<v-select :model-value="version" :items="versionOptions" inline @update:model-value="selectVersion" />
				<template v-if="versionInfo?.license">({{ versionInfo.license }})</template>
			</div>
			<div v-if="updateAvailable" class="update">
				<v-icon name="update" />
				New Version Available
			</div>
			<div v-if="app" class="compatibility" :class="{ compatible }">
				<v-icon :name="compatible ? 'check' : 'close'" />
				{{ compatible ? 'Compatible with Directus' : 'Incompatible with Directus' }}
			</div>
			<div v-if="extension.homepage" class="homepage">
				<v-icon name="language" />
				<a :href="extension.homepage" target="_blank" class="homepage">{{ extension.homepage }}</a>
			</div>
			<div v-if="extension.downloads_last_month" class="downloads-last-month">
				<v-icon name="save_alt" />
				{{ formatNumber(extension.downloads_last_month) }}
				Downloads last Month
			</div>
			<div v-if="extension.downloads_last_year" class="downloads-last-year">
				<v-icon name="save_alt" />
				{{ formatNumber(extension.downloads_last_year) }}
				Downloads last Year
			</div>

			<div v-if="extension.created" class="created">
				<v-icon name="cake" />
				Created {{ formatDate(extension.created) }} ago
			</div>
			<div v-if="extension.updated" class="updated">
				<v-icon name="update" />
				Updated {{ formatDate(extension.updated) }} ago
			</div>
			<div v-if="versionInfo?.size" class="size">
				<v-icon name="folder_open" />
				{{ formatSize(versionInfo.size) }} Size
			</div>
		</div>
		<div class="markdown" v-html="markdown"></div>
		<div class="tags">
			<div v-for="(tag, i) in extension.tags" :key="i" class="tag">{{ tag.tags_tag.tag }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { AxiosInstance } from 'axios';
import { parse } from 'marked';
import dompurify from 'dompurify';
import { formatDate, formatNumber, formatSize, formatTitle, useSize } from '@directus/utils/browser';
import { inject, ref, watch, computed } from 'vue';
import type { ExtensionInfo } from '@directus/types';
// import { compareSemver } from '@directus/shared/utils';

type Props = {
	name: string;
	app?: boolean;
	existingExtension?: ExtensionInfo;
	directusVersion?: string;
};

interface Extension {
	id: string;
	icon?: string;
	description?: string;
	latest_version?: string;
	versions?: {
		version: string;
		directus_version?: string | undefined;
		size?: number;
		readme?: string;
		license?: string;
	}[];
	author?: {
		name: string;
		email: string;
		avatar?: string;
	};
	maintainers?: {
		users_email: {
			name: string;
			email: string;
			avatar?: string;
		};
	}[];
	created?: string;
	updated?: string;
	homepage?: string;
	tags?: {
		tags_tag: {
			tag: string;
		};
	}[];
	stars?: number;
	downloads_last_month?: number;
	downloads_last_year?: number;
	downloads?: {
		date: string;
		downloads: number;
	}[];
	license?: string;
	size?: number;
}

const props = withDefaults(defineProps<Props>(), {
	app: false,
});

const emit = defineEmits(['select-version']);

const extension = ref<Extension | null>(null);
const local = computed(() => Boolean(props.app && props.existingExtension && !props.existingExtension?.registry));
const api = inject('api') as AxiosInstance;

const version = ref<string | undefined>();

const versionOptions = computed(() =>
	(extension.value?.versions ?? []).map((value: any) => {
		const version = value.version.split('#')[1];
		return {
			text: version + (version === props.existingExtension?.version ? ' (Installed)' : ''),
			value: version,
		};
	})
);

watch(
	() => props.existingExtension,
	(extension, oldExtension) => {
		if (!oldExtension && extension) {
			version.value = extension.version;
			emit('select-version', extension.version);
		}
	},
	{ immediate: true }
);

const versionInfo = computed(() => {
	return extension.value?.versions?.find((v: any) => v.version.split('#')[1] === version.value);
});

const updateAvailable = computed(() => {
	return props.existingExtension && extension.value?.latest_version?.split('#')[1] !== props.existingExtension?.version;
});

const markdown = computed(() => {
	if (!versionInfo.value?.readme) return '';
	return dompurify.sanitize(parse(versionInfo.value.readme));
});

function selectVersion(newVersion: string) {
	version.value = newVersion;
	emit('select-version', newVersion);
}

watch(
	() => props.name,
	() => {
		loadExtension();
	},
	{ immediate: true }
);

const compatible = computed(
	() => compareSemver(props.directusVersion, versionInfo.value?.directus_version?.replace('^', '')) >= 0
);

function compareSemver(ver1: string | undefined, ver2: string | undefined): number {
	const current = (ver1 || '0.0.0').split('.').map(Number);
	const required = (ver2 || '0.0.0').split('.').map(Number);

	for (let i = 0; i < 3; i++) {
		if (current[i]! > required[i]!) {
			return 1;
		} else if (current[i]! < required[i]!) {
			return -1;
		}
	}

	return 0;
}

async function loadExtension() {
	if (local.value && props.existingExtension) {
		extension.value = {
			...props.existingExtension,
			id: props.existingExtension.name,
			versions: [
				{
					version: props.existingExtension.name + '#' + props.existingExtension.version,
					directus_version: props.existingExtension.host,
				},
			],
			latest_version: props.existingExtension.name + '#' + props.existingExtension.version,
		} as Extension;

		version.value = props.existingExtension.version;
		emit('select-version', props.existingExtension.version);
		return;
	}

	const now = new Date();
	const lastYear = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 365);

	const versionFields = ['version', 'readme', 'license', 'size', 'directus_version']
		.map((f) => `versions.${f}`)
		.join(',');

	try {
		const response = await api.get(`/items/extensions/${encodeURIComponent(props.name)}`, {
			params: {
				fields:
					'*,author.email,author.name,author.avatar,maintainers.users_email.email,maintainers.users_email.name,maintainers.users_email.avatar,downloads.date,downloads.downloads,latest_version,tags.tags_tag.tag,' +
					versionFields,
				deep: {
					downloads: {
						_filter: {
							date: {
								_gte: lastYear.toISOString().substring(0, 10),
							},
						},
						_limit: 365,
					},
				},
			},
		});

		extension.value = response.data.data;
	} catch (error) {
		// Ignore non existing extensions
	}

	if (!props.existingExtension && !version.value) {
		version.value = extension.value?.latest_version?.split('#')[1];
	}
}

const maintainers = computed(() => {
	const maintainers = extension.value?.maintainers;
	if (!maintainers) return [];

	return maintainers.map((m: any) => m.users_email).filter((m: any) => m.email !== extension.value?.author?.email);
});

const downloadsRef = ref<HTMLElement | null>(null);
const { width, height } = useSize(downloadsRef);

const offset = 6;

const svgPath = computed(() => {
	const data = extension.value?.downloads;

	if (!data || data.length === 0) return null;

	const max = Math.max(...data.map((d: any) => d.downloads)) + offset;

	const startDate = new Date(data[0]!.date).getTime();
	const endDate = new Date(data.at(-1)!.date).getTime();

	const points = data.map((d: any) => {
		const x = ((new Date(d.date).getTime() - startDate) / (endDate - startDate)) * width.value;
		const y = (1 - d.downloads / max) * height.value - offset;
		return `${x},${y}`;
	});

	return `M -20,${height.value + 10} L${points.join(' ')} L${width.value + 20},${height.value + 10} Z`;
});
</script>

<style lang="scss" scoped>
.extension {
	display: grid;
	grid-template-columns: 1fr 250px;
	gap: 16px;

	@media (max-width: 800px) {
		grid-template-columns: 1fr;
	}
}

.title {
	font-size: 18px;
	font-weight: 600;
	margin-bottom: 8px;
	grid-column: span 2;
}

.users {
	max-width: min(800px, 100%);

	.author {
		margin-bottom: 8px;
	}

	.author,
	.maintainers {
		text-decoration: none;
		color: var(--foreground-normal);
		height: 60px;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 16px;
		font-weight: 600;
		border: 2px solid var(--border-subdued);
		border-radius: var(--border-radius);
		padding: 0 10px;

		.spacer {
			flex: 1;
		}

		i {
			color: var(--foreground-subdued);
		}
	}

	.maintainer {
		&:not(:first-child) {
			margin-left: -18px;
		}

		&:hover {
			z-index: 10;
		}
	}

	.avatar {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background-color: var(--primary);

		display: grid;
		place-items: center;
		overflow: hidden;

		img {
			width: 100%;
		}

		svg {
			width: 34px;
		}
	}
}

.markdown {
	max-width: min(800px, 100%);
	grid-row: span 3;
	overflow: hidden;

	::v-deep(img) {
		max-width: 100%;
	}

	::v-deep(code) {
		background-color: var(--background-normal);
		padding: 4px 8px;
		line-height: 2;
		border-radius: var(--border-radius);
		font-family: var(--family-monospace);
	}

	::v-deep(pre) {
		overflow-x: auto;
		background-color: var(--background-normal);
		padding: 8px;
		border-radius: var(--border-radius);

		code {
			line-height: 1;
		}
	}

	::v-deep(a) {
		color: var(--primary);
		text-decoration: none;
	}
}

.banners {
	display: flex;
	flex-direction: column;
	gap: 8px;
	grid-row: span 2;
	grid-column: 2;
	overflow: hidden;

	@media (max-width: 800px) {
		grid-column: 1;
	}

	> div {
		height: 60px;
		padding: 0 16px;
		border-radius: var(--border-radius);
		background-color: var(--background-normal);
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.downloads {
		background-color: var(--primary-10);
		padding: 0;
		height: 60px;
		overflow: hidden;
		position: relative;

		svg {
			position: absolute;
			width: 100%;
			height: 100%;
			bottom: 0;

			path {
				stroke: var(--primary-90);
				stroke-width: 2px;
				stroke-linejoin: round;
				fill: var(--primary-25);
			}
		}
	}

	.compatibility {
		color: var(--red);
		background-color: var(--red-10);

		&.compatible {
			color: var(--green);
			background-color: var(--green-10);
		}
	}

	.homepage {
		background-color: var(--primary-10);
		color: var(--primary);

		a {
			text-decoration: none;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	.downloads-last-month,
	.downloads-last-year {
		gap: 4px;
	}

	.stars {
		background-color: var(--yellow-10);
		color: var(--yellow);
	}

	.update {
		background-color: var(--warning-10);
		color: var(--warning);
	}
}

.tags {
	display: flex;
	gap: 4px;
	flex-wrap: wrap;

	.tag {
		background-color: var(--background-normal);
		color: var(--foreground-normal);
		padding: 2px 6px;
		border-radius: var(--border-radius);
		margin: 4px;
	}
}
</style>
