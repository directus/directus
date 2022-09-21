import { Ref, computed, unref } from 'vue';
import { AppExtensionConfigs, AppExtensionType, HybridExtensionType, Plural } from '@directus/shared/types';
import { useExtensions } from '@/extensions';
import { pluralize } from '@directus/shared/utils';

export function useExtension<T extends AppExtensionType | HybridExtensionType>(
	type: T,
	name: string | Ref<string | null>
): Ref<AppExtensionConfigs[Plural<T>][number] | null> {
	const extensions = useExtensions();

	return computed(() => {
		const nameRaw = unref(name);

		if (nameRaw === null) return null;

		return (extensions[pluralize(type)].value as any[]).find(({ id }) => id === nameRaw) ?? null;
	});
}
