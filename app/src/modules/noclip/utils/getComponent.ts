export async function getComponent(
	component: any
): Promise<{ props?: Record<string, any>; emits?: string[]; options?: any }> {
	if ('__asyncLoader' in component) {
		return await component.__asyncLoader();
	}

	if (typeof component === 'function') {
		return {
			props: {
				value: {},
			},
		};
	}

	return component;
}
