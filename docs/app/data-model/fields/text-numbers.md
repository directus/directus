# Text & Numbers

> Interfaces are how users interact with fields on the Item Detail page. These are the standard Text & Number
> interfaces.

## Input

![A standard form text input](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-input.webp)

A standard form input.

- **Types**: `String`, `Text`, `UUID`, `Integer`, `Big Integer`, `Float`, `Decimal`
- **Soft Limit**: Used to limit the number of characters within the Data Studio. There is no hard limit in the database.
- **Font**: Type of font used to display the input value.
- **Trim**: Trim the whitespace at start and end of the value.
- **Masked**: Hide the real value.
- **Cleared Value**: When a user clears the value, save as an empty string.
- **Slugify**: Make the entered value URL safe.

## Autocomplete Input (API)

![An autocomplete form text input that shows a dropdown list of options based on a search query](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-autocomplete.webp)

A search input that will populate dropdown choices by making a request to a given URL.

- **Types**: `String`, `Text`
- **URL**: The URL where the request will be sent to.
- **Results Path**: The path to the array containing the search results.
- **Text Path**: The label that shows for each search result in the dropdown.
- **Value Path**: The value that is stored when you select an option from the dropdown.
- **Trigger**: `Throttle`, `Debounce` - The method used to trigger the web request as you type a query.
- **Rate**: The delay in `milliseconds` used in the Trigger function.

## Block Editor

![Showcase of the block editor with example blocks](https://marketing.directus.app/assets/f631a2e1-cb27-434a-939b-eb15132ac46a.png)

Allows users to create and edit content using blocks. These blocks represent individual pieces of content, such as text,
images, videos, buttons, and more, that can be assembled and re-arranged within a flexible layout.

- **Types**: `JSON`
- **Toolbar**: Allows for customization of visible formatting options.
- **Folder**: Default folder to store uploaded files. Does not affect existing files.
- **Font**: Type of font used in Edit mode.

## Code

![A code editor input](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-code.webp)

Code editor for pre-formatted text.

- **Types**: `String`, `Text`, `JSON`, `Geometry (All)`
- **Language**: Select a language for syntax highlighting.
- **Line Number**: `Enabled` - Show the line number for each line of code in the editor.
- **Line Wrapping**: `Enabled` - Wrap text inside the code editor to prevent horizontal scrolling.
- **Template**: Preset value that the user can add to the field value by clicking "Fill with Template Value" with adding
  / editing an item.

## Textarea

![A standard form textarea input](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-textarea.webp)

Textarea input for longer plain text.

- **Types**: `Text`
- **Soft Limit**: Used to limit the number of characters within the Data Studio. There is no hard limit in the database.

## WYSIWYG

![A What You See Is What You Get (WYSIWYG) form input that has a toolbar for formatting](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-wysiwyg.webp)

The What You See Is What You Get (WYSIWYG) interface provides a text area with rich formatting options in the toolbar.

- **Types**: `Text`
- **Toolbar**: Allows for customization of visible formatting options
- **Folder**: Default folder to store uploaded files. Does not affect existing files.
- **Static Access Token**: Static access token appended to the assets' URL.
- **Soft Limit**: Used to limit the number of characters within the Data Studio. There is no hard limit in the database.
- **Custom Formats**: JSON array of formatting that is passed to the `style_formats` config option of the WYSIWYG editor
  instance (TinyMCE). [See TinyMCE documentation](https://www.tiny.cloud/docs/demo/format-custom/)
- **Options Override**: JSON object to override the default config option of the WYSIWYG editor instance (TinyMCE).
  [See TinyMCE documentation](https://www.tiny.cloud/docs/configure/)

## Markdown

![A markdown text editor with a toolbar with formatting options. Edit and preview tabs.](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-markdown.webp)

Markdown text editor with formatting options in the toolbar. You can switch between Edit and Preview modes.

- **Types**: `Text`
- **Toolbar**: Allows for customization of visible formatting options.
- **Folder**: Default folder to store uploaded files. Does not affect existing files.
- **Static Access Token**: Static access token appended to the assets' URL.
- **Soft Limit**: Used to limit the number of characters within the Data Studio. There is no hard limit in the database.
- **Editor Font**: Type of font used in Edit mode.
- **Preview Font**: Type of font used in Preview mode.
- **Custom Blocks**: Add custom markdown syntax types.

## Tags

![A standard form text input where user can select, add, and remove tags.](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-tags.webp)

A text input that allows users to apply any number of tags. When adding new tag, press Enter to save the tag.

- **Types**: `JSON`, `CSV`
- **Presets**: Preset tags that the user can select.
- **Alphabetize**: Force tags to display in alphabetical order.
- **Allow Other**: Allow users to add new tags not in the Presets.
- **Whitespace**: Setting to control the whitespace within a tag.
- **Capitalization**: Force tags to be stored as lowercase, uppercase, or title case.
