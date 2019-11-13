``macro``
=========

Macros are comparable with functions in regular programming languages. They
are useful to reuse template fragments to not repeat yourself.

Macros are defined in regular templates.

Imagine having a generic helper template that define how to render HTML forms
via macros (called ``forms.html``):

.. code-block:: twig

    {% macro input(name, value, type = "text", size = 20) %}
        <input type="{{ type }}" name="{{ name }}" value="{{ value|e }}" size="{{ size }}" />
    {% endmacro %}

    {% macro textarea(name, value, rows = 10, cols = 40) %}
        <textarea name="{{ name }}" rows="{{ rows }}" cols="{{ cols }}">{{ value|e }}</textarea>
    {% endmacro %}

Each macro argument can have a default value (here ``text`` is the default value
for ``type`` if not provided in the call).

Macros differ from native PHP functions in a few ways:

* Arguments of a macro are always optional.

* If extra positional arguments are passed to a macro, they end up in the
  special ``varargs`` variable as a list of values.

But as with PHP functions, macros don't have access to the current template
variables.

.. tip::

    You can pass the whole context as an argument by using the special
    ``_context`` variable.

Importing Macros
----------------

There are two ways to import macros. You can import the complete template
containing the macros into a local variable (via the ``import`` tag) or only
import specific macros from the template (via the ``from`` tag).

To import all macros from a template into a local variable, use the ``import``
tag:

.. code-block:: twig

    {% import "forms.html" as forms %}

The above ``import`` call imports the ``forms.html`` file (which can contain
only macros, or a template and some macros), and import the macros as items of
the ``forms`` local variable.

The macros can then be called at will in the *current* template:

.. code-block:: twig

    <p>{{ forms.input('username') }}</p>
    <p>{{ forms.input('password', null, 'password') }}</p>

Alternatively you can import names from the template into the current namespace
via the ``from`` tag:

.. code-block:: twig

    {% from 'forms.html' import input as input_field, textarea %}

    <p>{{ input_field('password', '', 'password') }}</p>
    <p>{{ textarea('comment') }}</p>

.. tip::

    When macro usages and definitions are in the same template, you don't need to
    import the macros as they are automatically available under the special
    ``_self`` variable:

    .. code-block:: twig

        <p>{{ _self.input('password', '', 'password') }}</p>

        {% macro input(name, value, type = "text", size = 20) %}
            <input type="{{ type }}" name="{{ name }}" value="{{ value|e }}" size="{{ size }}" />
        {% endmacro %}

    Auto-import is only available as of Twig 2.11. For older versions, import
    macros using the special ``_self`` variable for the template name:

    .. code-block:: twig

        {% import _self as forms %}

        <p>{{ forms.input('username') }}</p>

.. note::

    Before Twig 2.11, when you want to use a macro in another macro from the
    same file, you need to import it locally:

    .. code-block:: twig

        {% macro input(name, value, type, size) %}
            <input type="{{ type|default('text') }}" name="{{ name }}" value="{{ value|e }}" size="{{ size|default(20) }}" />
        {% endmacro %}

        {% macro wrapped_input(name, value, type, size) %}
            {% import _self as forms %}

            <div class="field">
                {{ forms.input(name, value, type, size) }}
            </div>
        {% endmacro %}

Macros Scoping
--------------

.. versionadded:: 2.11

    The scoping rules described in this paragraph are implemented as of Twig
    2.11.

The scoping rules are the same whether you imported macros via ``import`` or
``from``.

Imported macros are always **local** to the current template. It means that
macros are available in all blocks and other macros defined in the current
template, but they are not available in included templates or child templates;
you need to explicitely re-import macros in each template.

When calling ``import`` or ``from`` from a ``block`` tag, the imported macros
are only defined in the current block and they override macros defined at the
template level with the same names.

When calling ``import`` or ``from`` from a ``macro`` tag, the imported macros
are only defined in the current macro and they override macros defined at the
template level with the same names.

.. note::

    Before Twig 2.11, it was possible to use macros imported in a block in a
    "sub-block". When upgrading to 2.11, you need to either move the import in
    the global scope or reimport the macros explicitly in the "sub-blocks".

Checking if a Macro is defined
------------------------------

.. versionadded:: 2.11

    Support for the ``defined`` test on macros was added in Twig 2.11.

You can check if a macro is defined via the ``defined`` test:

.. code-block:: twig

    {% import "macros.twig" as macros %}

    {% from "macros.twig" import hello %}

    {% if macros.hello is defined -%}
        OK
    {% endif %}

    {% if hello is defined -%}
        OK
    {% endif %}

Named Macro End-Tags
--------------------

Twig allows you to put the name of the macro after the end tag for better
readability (the name after the ``endmacro`` word must match the macro name):

.. code-block:: twig

    {% macro input() %}
        ...
    {% endmacro input %}
