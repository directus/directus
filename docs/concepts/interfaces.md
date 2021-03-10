# Interfaces <small></small>

> Interfaces determine how you view or interact with a field. In most cases, they offer some sort of input tailored to
> managing data of a specific type, but can also be used exclusively for presentation.

Interfaces provide different ways to view or interact with field data on the
[Item Detail](/concepts/application/#item-detail) page's form. Every interface supports a specific subset of field
[types](/concepts/types/) (eg: String), which determines how the data will be stored. For example, the _Text Input_
interface can manage most types of data, but might not be ideal for dates, where a _Calendar_ interface excels.

Directus includes many Interfaces out-of-the-box, below are the some key examples:

- **Checkboxes**
- **Code**
- **Color**
- **DateTime**
- **Divider**
- **Dropdown**
- **File**
- **Image**
- **Many-to-Many**
- **Many-to-One**
- **Markdown**
- **Notice**
- **Numeric**
- **One-to-Many**
- **Radio Buttons**
- **Repeater**
- **Slider**
- **Tags**
- **Text Input**
- **Textarea**
- **Toggle**
- **Translations**
- **WYSIWYG**

## Custom Interface Extensions

In addition to these core interfaces, custom interfaces allow for creating more tailored or proprietary ways to view or
manage field data, such as bespoke layout builders, skeuomorphic knobs, or relational views for third-party data (eg:
Stripe Credit Card UI).

#### Relevant Guides

- [Creating a Custom Interface](/guides/interfaces)
