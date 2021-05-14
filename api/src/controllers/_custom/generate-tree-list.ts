export function generateTreeList(items: Record<string, any>[], parentField: string, childrenField: string) {
	const tree: Record<string, any>[] = [];
	const list: Record<string, any> = {};

	const recursive = (item: Record<string, any>) => {
		if (item[childrenField] == null) return item;

		if (item.npath == null) item.npath = [item.id];

		list[item.id] = item.npath;

		const children = item[childrenField].map((id: string) => {
			const child = items.find((i) => i.id === id);
			const npath = [...item.npath, child!.id];

			list[child!.id] = npath;

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
