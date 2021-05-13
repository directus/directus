export function generateNormalized(
	items: Record<string, any>[],
	idField: string,
	parentField: string,
	childrenField: string
) {
	const tree: Record<string, any>[] = [];
	const list: Record<string, any> = {};

	const recursive = (item: Record<string, any>) => {
		if (item[childrenField] == null) return item;

		if (item.npath == null) item.npath = [item[idField]];

		list[item[idField]] = item.npath;

		const children = item[childrenField].map((id: string) => {
			const child = items.find((i) => i[idField] === id);
			const npath = [...item.npath, child![idField]];

			list[child![idField]] = npath;

			return recursive({
				...child,
				npath,
			});
		});

		return {
			...item,
			children,
		};
	};

	items.map((item) => {
		if (item[parentField] == null) tree.push(recursive(item));
	});

	return {
		tree,
		list,
	};
}
