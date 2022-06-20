# Conditions

Conditions allow you to alter the current field's setup based on the values of other fields in the form. This allows you
to show/hide the field, make it readonly, or change the interface options.

Each field can have one or more _rules_. Each rule has the following configuration options:

- **Name**: The name of the rule. This is only used internally for convenience purposes
- **Rule**: The rule that controls whether or not these conditions are applied. Rule follows the
  [Filter Rules](/reference/filter-rules) spec
- **Readonly**: Whether or not the field is readonly when the condition is matched
- **Hidden**: Whether or not the field is hidden when the condition is matched
- **Required**: Whether or not the field is required when the condition is matched
- **Interface Options**: Any additional configuration for the selected interface

These changes to the field are merged onto the base configuration of the field. This means you can have the field hidden
by default, and then only toggle the hidden state of the field in the condition.

::: tip Order Matters

The conditions are matched in order. The **last** condition that matches is the one that's used to apply the changes.

:::
