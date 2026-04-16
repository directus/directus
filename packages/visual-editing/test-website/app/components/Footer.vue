<script setup lang="ts">
import { apply, setAttr } from '@directus/visual-editing';
import { computed } from 'vue';

export interface SocialLink {
	service: string;
	url: string;
}

export interface NavigationItem {
	id: string;
	title: string;
	url?: string | null;
	page?: {
		permalink?: string | null;
	};
}

export interface FooterProps {
	navigation: {
		items: NavigationItem[];
	};
	globals: {
		id: 'string';
		logo?: string | null;
		logo_dark_mode?: string | null;
		description?: string | null;
		social_links?: SocialLink[];
	};
}

const props = defineProps<FooterProps>();
const runtimeConfig = useRuntimeConfig();

const lightLogoUrl = computed(() =>
	props.globals.logo ? `${runtimeConfig.public.directusUrl}/assets/${props.globals.logo}` : '/images/logo.svg',
);

const darkLogoUrl = computed(() =>
	props.globals.logo_dark_mode ? `${runtimeConfig.public.directusUrl}/assets/${props.globals.logo_dark_mode}` : '',
);

const refresh = inject<() => void>('refreshSiteData');
const descriptionEl = useTemplateRef('description');

(function useVisualEditingTest() {
	if (!import.meta.client) return;

	const {
		public: { visualEditingTestEnv, testCase, directusUrl },
	} = useRuntimeConfig();

	if (!visualEditingTestEnv) return;

	if (testCase === 'refresh') {
		useRuntimeHook('page:finish', () => {
			apply({ directusUrl, elements: descriptionEl.value, onSaved: refresh });
		});
	}

	if (testCase === 'refresh-customized') {
		useRuntimeHook('page:finish', () => {
			apply({ directusUrl, elements: descriptionEl.value, onSaved: refresh, customClass: 'my-custom-description' });
		});
	}
})();
</script>

<template>
	<footer v-if="globals" class="bg-gray dark:bg-[var(--background-variant-color)] py-16">
		<Container class="text-foreground dark:text-white">
			<div class="flex flex-col md:flex-row justify-between items-start gap-8 pt-8">
				<div class="flex-1">
					<NuxtLink to="/" class="inline-block transition-opacity hover:opacity-70">
						<img
							v-if="lightLogoUrl"
							:src="lightLogoUrl"
							alt="Logo"
							:class="['w-[120px] h-auto', darkLogoUrl ? 'dark:hidden' : '']"
						/>
						<img
							v-if="darkLogoUrl"
							:src="darkLogoUrl"
							alt="Logo (Dark Mode)"
							class="w-[120px] h-auto hidden dark:block"
						/>
					</NuxtLink>

					<p
						v-if="props.globals.description"
						ref="description"
						class="text-description mt-2"
						:data-directus="
							setAttr({
								collection: 'globals',
								item: globals.id,
								fields: 'description',
							})
						"
					>
						{{ props.globals.description }}
					</p>

					<!-- Social Links -->
					<div v-if="props.globals.social_links?.length" class="mt-4 flex space-x-4">
						<a
							v-for="social in props.globals.social_links"
							:key="social.service"
							:href="social.url"
							target="_blank"
							rel="noopener noreferrer"
							class="size-8 rounded bg-transparent inline-flex items-center justify-center transition-colors hover:opacity-70"
						>
							<img
								:src="`/icons/social/${social.service}.svg`"
								:alt="`${social.service} icon`"
								class="size-6 dark:invert"
							/>
						</a>
					</div>
				</div>

				<div class="flex flex-col items-start md:items-end flex-1">
					<nav v-if="props.navigation.items?.length" class="w-full md:w-auto text-left">
						<ul class="space-y-4">
							<li v-for="item in props.navigation.items" :key="item.id">
								<NuxtLink
									v-if="item.page?.permalink"
									:to="item.page.permalink"
									class="text-nav font-medium hover:underline"
								>
									{{ item.title }}
								</NuxtLink>
								<a v-else :href="item.url || '#'" class="text-nav font-medium hover:underline">
									{{ item.title }}
								</a>
							</li>
						</ul>
						<ThemeToggle class="dark:text-white mt-4" />
					</nav>
				</div>
			</div>
		</Container>
	</footer>
</template>

<style>
.my-custom-description {
	--directus-visual-editing--rect--border-color: orange;
	--directus-visual-editing--edit-btn--bg-color: orange;
}
</style>
