# Other

> Interfaces are how users interact with fields on the Item Detail page. These are the standard Other interfaces.

## Hash

![Form text input. Value is "value to hash on save"](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-hash.webp)

![Form text input that shows the value is securely hashed.](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-hash-secure.webp)

Text input that allows users to hash the value on save. Both the API and SDK provide methods to
[verify the hash](https://docs.directus.io/reference/system/utilities.html#verify-a-hash).

- **Types**: `Hash`
- **Placeholder**: Placeholder to display.
- **Masked**: Hide the true values on input before save.

## Slider

![A standard form text input](https://cdn.directus.io/docs/v9/configuration/data-model/fields/interfaces-20230308/interface-slider.webp)

Range input that allows users to select a number with an interactive slider.

- **Types**: `Integer`, `Decimal`, `Big Integer`, `Float`
- **Minimum Value**: Minimum value that can be set by the user.
- **Maximum Value**: Maximum value that can be set by the user.
- **Step Interval**: Specify the size of each increment (or step) of the slider control.
- **Always show value**: Always display the numeric value to the user.
