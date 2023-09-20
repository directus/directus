# Selection

> Interfaces are how users interact with fields on the Item Detail page. These are the standard Selection interfaces.

## Toggle

![A toggle form input with label named "Enabled"](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-toggle.webp)

A checkbox input that allows user to toggle value between on and off / true and false.

- **Types**: `Boolean`
- **Default Value**: `true`, `false`, `null`
- **Icon On**: Icon that shows whenever the toggle is enabled.
- **Icon Off**: Icon that shows whenever the toggle is disabled.
- **Color On**: Color of the icon whenever the toggle is enabled.
- **Color Off**: Color of the icon whenever the toggle is disabled.
- **Label**: The text displayed to the user beside the toggle.

## Datetime

![A date picker input. User can select a calendar date and input a time. ](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-datetime.webp)

Date picker input that allows user to select a date and time.

- **Types**: `DateTime`, `Date`, `Time`, `Timestamp`
- **Include Seconds**: Show seconds in the interface
- **Use 24-Hour Format**: Use 24 hour time system instead of 12 hour

## Repeater

![A standard form text input](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-repeater.webp)

![A standard form text input](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-repeater-open.webp)

Interface for repeating groups of fields.

You can use any [Text & Number](/app/data-model/fields/text-numbers), [Selection](/app/data-model/fields/selection), or
[Other](/app/data-model/fields/other) fields within a Repeater. [Relational](/app/data-model/fields/relational),
[Presentation](/app/data-model/fields/presentation), or [Group](/app/data-model/fields/groups) fields are not allowed.

Value is stored as a JSON array of objects.

- **Types**: `JSON`
- **Template**: Add a JSON template that users that add to the field with a button click.
- **"Create New" Label**: Label for the Create New button below the field on Item Detail page.
- **Sort**: Method of sorting the items groups within the repeater.
- **Edit Fields**: The configuration for fields within the Repeater.
  - **Field**: Name of the field.
  - **Field Width**: Width of field on the Item Detail page.
  - **Type**: Type of value.
  - **Note**: A helpful note for the user.
  - **Interface**: The interface to use for the fields.
  - **Interface Options**: Option configuration for the selected Interface.
  - **Display**: The display to use for the preview template.
  - **Display Options**: Option configuration for the selected Display.

## Map

![An interactive map interface that shows a single point on the east coast of the United States. Map has buttons for zoom, search, and full screen.](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-map.webp)

Interface that shows geospatial data on an interactive map.

- **Types**: `Point`, `LineString`, `Polygon`, `Multipoint`, `MultiLineString`, `MultiPolygon`, `Geometry (All)`, `JSON`
- **Default View**: The default location and zoom settings on the map to show by default

## Color

![A text input for color hex codes that allows user to select color modes ](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-color.webp)

A color picker interface that allows users to input color codes and convert between different color modes.

- **Types**: `String`
- **Opacity**: Enable opacity values to be adjusted by the user.
- **Preset Colors**: Preset colors that users can select.

## Dropdown

![A select input with a dropdown of options.](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-dropdown.webp)

Input that allows user to select a value from a list of options.

- **Types**: `String`, `Integer`, `Big Integer`, `Float`
- **Choices**: Options for the dropdown.
  - **Text**: Label the user sees.
  - **Value**: Raw value that gets stored.
- **Allow Other**: Allow user to enter custom values other than preset values.
- **Allow None**: Allow user to deselect an option.
- **Icon**: Icon displayed beside the dropdown.
- **Placeholder**: Placeholder text for the dropdown.

## Icon

![A select input with a dropdown grid of icon choices.](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-icon.webp)

Search input that allows user to select from a list of icons.

- **Types**: `String`

## Checkboxes

![A form input with multiple checkboxes.](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-checkboxes.webp)

Input that allows user to select multiple checkboxes.

- **Types**: `JSON`, `CSV`
- **Choices**: Options for the checkboxes.
  - **Text**: Label the user sees.
  - **Value**: Raw value that gets stored.
- **Allow Other**: Allow user to enter custom values other than preset Choices.
- **Color**: Color of the checkboxes.
- **Icon On**: Icon that shows whenever a checkbox is checked.
- **Icon Off**: Icon that shows whenever a checkbox is unchecked.
- **Items Shown**: Number of checkboxes shown.

## Checkboxes (Tree)

![A form input with a nested tree of multiple parent and child checkboxes.](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-checkboxes-tree.webp)

Nested tree of checkboxes that can be expanded or collapsed.

- **Types**: `JSON`, `CSV`
- **Choices**: Options for the checkbox tree.
  - **Text**: Label the user sees.
  - **Value**: Raw value that gets stored.
  - **Children**: Child checkboxes nested below the current choice.
- **Value Combining**: Controls what value is stored when nested selections are made.

## Dropdown (Multiple)

![A select input where user can select multiple options from a dropdown.](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-dropdown-multiple.webp)

Input that allows user to select multiple values from a list of options.

- **Types**: `JSON`, `CSV`
- **Choices**: Options for the dropdown.
  - **Text**: Label the user sees.
  - **Value**: Raw value that gets stored.
- **Allow Other**: Allow user to enter custom values other than preset choices.
- **Allow None**: Allow user to deselect an option.
- **Icon**: Icon displayed beside the dropdown.
- **Placeholder**: Placeholder text for the dropdown.

## Radio Buttons

![A radio button form input with different options to select](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-radio-buttons.webp)

Radio button input that allows users to select a single value from multiple choices.

- **Types**: `String`, `Integer`, `Big Integer`, `Float`
- **Choices**: Options for the radio buttons.
  - **Text**: Label the user sees.
  - **Value**: Raw value that gets stored.
- **Allow Other**: Allow user to enter custom values other than preset choices.
- **Color**: Color of the radio buttons.
- **Icon On**: Icon that shows whenever a radio buttons is checked.
- **Icon Off**: Icon that shows whenever a radio buttons is unchecked.
