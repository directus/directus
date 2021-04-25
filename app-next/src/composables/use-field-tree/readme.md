# `useFieldTree`

Generate out a field tree based on the given collection.

```ts
type FieldTree = {
	field: string;
	name: string | TranslateResult;
	children?: FieldTree[];
};

useFieldTree(collection: Ref<string>): { tree: FieldTree }
```

## Usage

```ts
const collection = ref('articles');

const { tree } = useFieldTree(collection);
```
