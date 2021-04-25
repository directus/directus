# Displays

Displays are functions / components that are used in the system to display data. They are small
wrappers that help display values in a matter that makes sense for the saved value, for example
rendering a color swatch for a saved color value.

## Functions vs Components

A _Display_ can either be a function, or a component. The function gets the value, and returns a
string of how to display this value. A Vue component similarly gets the value through the `value`
prop, and can render whatever makes sense for the value.
