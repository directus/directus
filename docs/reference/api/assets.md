# Assets

> The `/assets` endpoint can be used to stream or retrieve the actual file contents from assets managed within Directus.

## Accessing an Original File

The location of your actual file originals is based on the project's configuration, but you can consistently access them
via the API using the following URL.

```
example.com/assets/<file-id>
example.com/assets/1ac73658-8b62-4dea-b6da-529fbc9d01a4
```

![Original File](../../assets/original.jpg) _Original File Used — 602KB and 1800x1200_

::: warning Direct File Access

While you may _technically_ be able to expose your storage adapters root filesystem and access your raw files through
there, it is recommended that you always use the Directus API. This is the only way that you can take advantage of file
permissions and other built-in features.

:::

## Requesting a Thumbnail

Fetching thumbnails is as easy as adding query parameters to the original file's URL. If a requested thumbnail doesn't
yet exist, it is dynamically generated and immediately returned. When requesting a thumbnail, the following parameters
are all required.

- **`fit`** — The **fit** of the thumbnail while always preserving the aspect ratio, can be any of the following
  options:
  - `cover` — Covers both width/height by cropping/clipping to fit
  - `contain` — Contain within both width/height using "letterboxing" as needed
  - `inside` — Resize to be as large as possible, ensuring dimensions are less than or equal to the requested width and
    height
  - `outside` — Resize to be as small as possible, ensuring dimensions are greater than or equal to the requested width
    and height
- **`width`** — The **width** of the thumbnail in pixels
- **`height`** — The **height** of the thumbnail in pixels
- **`quality`** — The **quality** of the thumbnail (`0` to `100`)
- **`withoutEnlargement`** — Disable image up-scaling
- **`download`** — Add `Content-Disposition` header and force browser to download file

```
example.com/assets/<file-id>?fit=<fit>&width=<width>&height=<height>&quality=<quality>
example.com/assets/1ac73658-8b62-4dea-b6da-529fbc9d01a4?fit=cover&width=200&height=200&quality=80
```

Alternatively, you can reference a specific thumbnail by its preset key.

- **`key`** — This **key** of the [Storage Asset Preset](/guides/files#creating-thumbnail-presets), a shortcut for the
  above parameters

```
example.com/assets/<file-id>?key=<preset-key>
example.com/assets/1ac73658-8b62-4dea-b6da-529fbc9d01a4?key=card
```

### Cover vs Contain

For easier comparison, both of the examples below were requested at `200` width, `200` height, and `75` quality. The
`cover` thumbnail forces the dimensions, trimming the outside edges as needed. The `contain` thumbnail always maintains
its aspect ratio, shrinking the image to fit _within_ the dimensions and adding "letterboxing" as needed.

| Cover                                                          | Contain                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------ |
| ![Cover](../../assets/200-200-cover-75.jpg)<br>_8KB • 200x200_ | ![Contain](../../assets/200-200-contain-75.jpg)<br>_6KB • 200x133_ |

::: tip Aspect Ratio

Images are never stretched or distorted even when changing the aspect ratio.

:::

### Quality vs Filesize

The quality parameter can be any integer from `0-100`. Qualities closer to `0` have lower filesizes, but also poor image
quality due to compression artifacts. Values closer to `100` have larger filesizes, but better image quality. Below are
four possible qualities (200x200 cover) to visually compare the balance between compression and filesize.

| 25%                                                | 50%                                                | 75%                                                | 100%                                                  |
| -------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| ![25%](../../assets/200-200-cover-25.jpg)<br>_4KB_ | ![50%](../../assets/200-200-cover-50.jpg)<br>_6KB_ | ![75%](../../assets/200-200-cover-75.jpg)<br>_8KB_ | ![100%](../../assets/200-200-cover-100.jpg)<br>_38KB_ |

## Downloading a File

To download an asset with the correct filename, you need to add the `?download` query parameter to the request and the
`download` attribute to your anchor tag. This will ensure the appropriate
[Content-Disposition](https://www.w3.org/Protocols/rfc2616/rfc2616-sec19.html) headers are added. Without this, the
download will work on the _same_ domain, however it will have the file's "id" as the filename for cross-origin requests.

Example:

```html
<a href="https://your-directus.com/assets/<file-id>?download" target="_blank" download="Your File.pdf">Download</a>
```
