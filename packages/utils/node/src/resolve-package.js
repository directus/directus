import path from 'path';
export function resolvePackage(name, root) {
    return path.dirname(require.resolve(`${name}/package.json`, root !== undefined ? { paths: [root] } : undefined));
}
