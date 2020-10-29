# Files & Thumbnails

> Directus offers a full-featured Digital Asset Management (DAM) system, multiple storage adapters, private file permissions, and on-demand image thumbnail generation.

## Accessing an Original File

The location of your actual file originals is based on the project's configuration, but you can consistently access them via the API using the following URL.

```
example.com/assets/<file-id>
example.com/assets/1ac73658-8b62-4dea-b6da-529fbc9d01a4
```

![Original File](../assets/original.jpg)
_Original File Used Below — 602KB and 1800x1200_

:::warning Direct File Access
While you may _technically_ be able to access your original files within their actual filesystem directory (eg: `/uploads/<filename_disk>` for the default local storage configuration), it is recommended that you always use the Directus API. This is the only way that you can take advantage of file permissions and other built-in features.
:::

## Creating Thumbnail Presets

1. Navigate to **Settings > Project Settings**
2. Scroll to the **Storage Asset Presets** field
3. Click **Add a New Item**
4. Enter a unique **Key** for the preset
5. Enter the **Fit**, **Width**, **Height**, and **Quality** for the preset
6. Click the **Save** action button in the header

::: Storage Asset Transform
The **Storage Asset Transform** can be used in conjunction with the presets to force an allow-list or completely disable the thumbnailing system. The options for this are:

* **All** — Any valid thumbnail request will be returned
* **None** — No thumbnails will be returned, not even presets
* **Presets Only** — Only valid Storage Asset Presets will be returned

:::

## Requesting a Thumbnail

Fetching thumbnails is as easy as adding query parameters to the original file's URL. If a requested thumbnail doesn't yet exist, it is dynamically generated and immediately returned. When requesting a thumbnail, the following parameters are all required.

* **`fit`** — The **fit** of the thumbnail, either `crop` or `contain`
* **`width`** — The **width** of the thumbnail in pixels
* **`height`** — The **height** of the thumbnail in pixels
* **`quality`** — The **quality** of the thumbnail (`0` to `100`)
* **`withoutEnlargement`** — Disable image up-scaling
* **`download`** — Add `Content-Disposition` header and force browser to download file

```
example.com/assets/<file-id>?fit=<fit>&width=<width>&height=<height>&quality=<quality>
example.com/assets/1ac73658-8b62-4dea-b6da-529fbc9d01a4?fit=crop&width=200&height=200&quality=80
```

Alternatively, you can reference a specific thumbnail by its preset key.

* **`key`** — This **key** of the [Storage Asset Preset](#), a shortcut for the above parameters

```
example.com/assets/<file-id>?key=<preset-key>
example.com/assets/1ac73658-8b62-4dea-b6da-529fbc9d01a4?key=card
```

### Crop vs Contain

For easier comparison, both of the examples below were requested at `200` width, `200` height, and `75` quality. The `crop` thumbnail forces the dimensions, trimming the outside edges as needed. The `contain` thumbnail always maintains its aspect ratio, shrinking the image to fit _within_ the dimensions.

| Crop | Contain |
|------|------|
| ![Crop](../assets/200-200-crop-75.jpg)<br>_8KB • 200x200_ | ![Contain](../assets/200-200-contain-75.jpg)<br>_6KB • 200x133_ |

::: Aspect Ratio
Images are never stretched or distorted even when changing the aspect ratio.
:::

### Quality vs Filesize

The quality parameter can be any integer from `0-100`. Qualities closer to `0` have lower filesizes, but also poor image quality due to compression artifacts. Values closer to `100` have larger filesizes, but better image quality. Below are four possible qualities (200x200 crop) to visually compare the balance between compression and filesize.

| 25% | 50% | 75% | 100% |
|------|------|--------|------|
| ![25%](../assets/200-200-crop-25.jpg)<br>_4KB_ | ![50%](../assets/200-200-crop-50.jpg)<br>_6KB_ | ![75%](../assets/200-200-crop-75.jpg)<br>_8KB_ | ![100%](../assets/200-200-crop-100.jpg)<br>_38KB_ |
