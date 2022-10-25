// https://stackoverflow.com/a/61962964/7185314
// This falls under the license CC BY-SA 4.0
// Read the license: https://creativecommons.org/licenses/by-sa/4.0/

export const JSONstringifyWithCircularRefs = (() => {
	const refs = new Map();
	const parents: any[] = [];
	const path = ['this'];

	function clear() {
		refs.clear();
		parents.length = 0;
		path.length = 1;
	}

	function updateParents(key: string, value: any) {
		let idx = parents.length - 1;
		let prev = parents[idx];
		if (prev[key] === value || idx === 0) {
			path.push(key);
			parents.push(value);
		} else {
			while (idx-- >= 0) {
				prev = parents[idx];
				if (prev[key] === value) {
					idx += 2;
					parents.length = idx;
					path.length = idx;
					--idx;
					parents[idx] = value;
					path[idx] = key;
					break;
				}
			}
		}
	}

	function checkCircular(key: string, value: any) {
		if (value != null) {
			if (typeof value === 'object') {
				if (key) {
					updateParents(key, value);
				}

				const other = refs.get(value);
				if (other) {
					return '[Circular Reference]' + other;
				} else {
					refs.set(value, path.join('.'));
				}
			}
		}
		return value;
	}

	return function stringifyWithCircularRefs(obj: any, space?: string | number) {
		try {
			parents.push(obj);
			return JSON.stringify(obj, checkCircular, space);
		} finally {
			clear();
		}
	};
})();
