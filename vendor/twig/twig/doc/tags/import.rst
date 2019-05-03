``import``
==========

Twig supports putting often used code into :doc:`macros<../tags/macro>`. These
macros are defined in regular templates.

Imagine having a generic helper template that define how to render forms via
macros (called ``forms.html``):

.. code-block:: twig

    {% macro input(name, value, type, size) %}
        <input type="{{ type|default('text') }}" name="{{ name }}" value="{{ value|e }}" size="{{ size|default(20) }}" />
    {% endmacro %}

    {% macro textarea(name, value, rows, cols) %}
        <textarea name="{{ name }}" rows="{{ rows|default(10) }}" cols="{{ cols|default(40) }}">{{ value|e }}</textarea>
    {% endmacro %}

There are two ways to import macros. You can import the complete template
containing the macros into a local variable or only import specific macros from
the template.

The easiest and most flexible is importing the whole module into a local
variable:

.. code-block:: twig

    {% import 'forms.html' as forms %}

    <dl>
        <dt>Username</dt>
        <dd>{{ forms.input('username') }}</dd>
        <dt>Password</dt>
        <dd>{{ forms.input('password', null, 'password') }}</dd>
    </dl>
    <p>{{ forms.textarea('comment') }}</p>

Alternatively you can import names from the template into the current
namespace:

.. code-block:: twig

    {% from 'forms.html' import input as input_field, textarea %}

    <dl>
        <dt>Username</dt>
        <dd>{{ input_field('username') }}</dd>
        <dt>Password</dt>
        <dd>{{ input_field('password', '', 'password') }}</dd>
    </dl>
    <p>{{ textarea('comment') }}</p>

.. note::

    Importing macros using ``import`` or ``from`` is **local** to the current
    file. The imported macros are not available in included templates or child
    templates; you need to explicitely re-import macros in each file.

.. tip::

    To import macros from the current file, use the special ``_self`` variable
    for the source.

.. seealso:: :doc:`macro<../tags/macro>`, :doc:`from<../tags/from>`
