# v-image

Image display component with loading states and error handling.

## Basic Usage

```json
{
	"type": "v-image",
	"props": { "src": "state.imageUrl" }
}
```

## Props

| Prop  | Type   | Default  | Description                |
| ----- | ------ | -------- | -------------------------- |
| `src` | string | required | Image source URL           |
| `alt` | string | ""       | Alt text for accessibility |

## With Directus Assets

For images stored in Directus, construct the URL using the file ID:

```json
{
	"type": "v-image",
	"props": {
		"src": "state.assetUrl",
		"alt": "{{ state.imageAlt }}"
	}
}
```

```javascript
state.fileId = null;
state.assetUrl = '';
state.imageAlt = '';

actions.init = async () => {
	const item = await readItem('products', state.productId);
	state.fileId = item.image;
	state.assetUrl = `/assets/${item.image}`;
	state.imageAlt = item.name;
};
```

## With Thumbnail Transform

```javascript
// Get a 300x200 thumbnail
state.thumbnailUrl = `/assets/${state.fileId}?width=300&height=200&fit=cover`;
```

## In a Card

```json
{
	"type": "v-card",
	"children": [
		{
			"type": "div",
			"props": { "style": "height: 200px; overflow: hidden;" },
			"children": [
				{
					"type": "v-image",
					"props": {
						"src": "state.coverUrl",
						"alt": "Cover image",
						"style": "width: 100%; height: 100%; object-fit: cover;"
					}
				}
			]
		},
		{ "type": "v-card-title", "children": ["{{ state.title }}"] },
		{ "type": "v-card-text", "children": ["{{ state.description }}"] }
	]
}
```

## Image Gallery

```json
{
	"type": "div",
	"props": { "style": "display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;" },
	"children": [
		{
			"type": "template",
			"iterate": "state.images",
			"as": "image",
			"template": {
				"type": "div",
				"props": {
					"style": "aspect-ratio: 1; overflow: hidden; border-radius: 8px; cursor: pointer;",
					"onClick": "() => actions.selectImage(image)"
				},
				"children": [
					{
						"type": "v-image",
						"props": {
							"src": "image.url",
							"alt": "{{ image.title }}",
							"style": "width: 100%; height: 100%; object-fit: cover;"
						}
					}
				]
			}
		}
	]
}
```

```javascript
state.images = [];
state.selectedImage = null;

actions.init = async () => {
	const files = await readItems('directus_files', {
		filter: { folder: { _eq: state.galleryFolderId } },
	});

	state.images = files.map((f) => ({
		id: f.id,
		url: `/assets/${f.id}?width=400&height=400&fit=cover`,
		fullUrl: `/assets/${f.id}`,
		title: f.title || f.filename_download,
	}));
};

actions.selectImage = (image) => {
	state.selectedImage = image;
};
```

## v-image vs img

| Feature        | v-image         | img                         |
| -------------- | --------------- | --------------------------- |
| Loading state  | Built-in        | Manual                      |
| Error handling | Built-in        | Manual                      |
| Best for       | Directus assets | External URLs, simple cases |

For simple images or external URLs, standard `img` element works fine:

```json
{
	"type": "img",
	"props": {
		"src": "https://example.com/image.jpg",
		"alt": "Description",
		"style": "max-width: 100%;"
	}
}
```

## Complete Example: Product Image Viewer

```json
{
	"type": "v-card",
	"children": [
		{
			"type": "div",
			"props": { "style": "aspect-ratio: 16/9; overflow: hidden;" },
			"children": [
				{
					"type": "v-image",
					"props": {
						"src": "state.mainImageUrl",
						"alt": "{{ state.product.name }}",
						"style": "width: 100%; height: 100%; object-fit: contain; background: var(--theme--background-subdued);"
					}
				}
			]
		},
		{
			"type": "div",
			"props": { "style": "display: flex; gap: 8px; padding: 16px; overflow-x: auto;" },
			"children": [
				{
					"type": "template",
					"iterate": "state.productImages",
					"as": "img",
					"template": {
						"type": "div",
						"props": {
							"style": "width: 60px; height: 60px; flex-shrink: 0; border-radius: 4px; overflow: hidden; cursor: pointer; border: 2px solid transparent;",
							"onClick": "() => actions.setMainImage(img)"
						},
						"children": [
							{
								"type": "v-image",
								"props": {
									"src": "img.thumbnail",
									"style": "width: 100%; height: 100%; object-fit: cover;"
								}
							}
						]
					}
				}
			]
		}
	]
}
```

```javascript
state.product = null;
state.productImages = [];
state.mainImageUrl = '';

actions.init = async () => {
	state.product = await readItem('products', state.productId, {
		fields: ['*', 'images.directus_files_id'],
	});

	state.productImages = state.product.images.map((i) => ({
		id: i.directus_files_id,
		thumbnail: `/assets/${i.directus_files_id}?width=120&height=120&fit=cover`,
		full: `/assets/${i.directus_files_id}`,
	}));

	if (state.productImages.length > 0) {
		state.mainImageUrl = state.productImages[0].full;
	}
};

actions.setMainImage = (img) => {
	state.mainImageUrl = img.full;
};
```

## Handling Nullable/Async Sources

When the image source is loaded asynchronously or may be null, **always use `condition`** to prevent rendering with an
invalid `src`:

```json
{
	"type": "v-image",
	"condition": "state.imageUrl",
	"props": { "src": "state.imageUrl" }
}
```

**Why this matters:** `v-image` requires a valid `src` prop. Rendering with `null` or `undefined` causes Vue warnings
and broken display.

### Pattern: With Loading Placeholder

```json
{
	"type": "div",
	"props": { "style": "height: 200px;" },
	"children": [
		{
			"type": "v-skeleton-loader",
			"condition": "!state.imageUrl",
			"props": { "type": "image" }
		},
		{
			"type": "v-image",
			"condition": "state.imageUrl",
			"props": { "src": "state.imageUrl" }
		}
	]
}
```

### Pattern: Fallback for Missing Images

```javascript
state.imageUrl = '';
state.hasImage = false;

actions.init = async () => {
	const item = await readItem('products', state.productId);
	if (item.image) {
		state.imageUrl = `/assets/${item.image}`;
		state.hasImage = true;
	}
};
```

```json
{
	"type": "div",
	"children": [
		{
			"type": "v-image",
			"condition": "state.hasImage",
			"props": { "src": "state.imageUrl" }
		},
		{
			"type": "v-icon",
			"condition": "!state.hasImage",
			"props": { "name": "image", "xLarge": true }
		}
	]
}
```

## Notes

- Always include `alt` text for accessibility
- Use Directus asset transforms for optimized thumbnails
- For galleries, create thumbnail URLs to improve load times
- Use `object-fit` CSS property to control image scaling
- **Always use `condition` when `src` may be null/undefined**
