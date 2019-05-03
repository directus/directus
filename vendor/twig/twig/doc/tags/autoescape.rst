``autoescape``
==============

Whether automatic escaping is enabled or not, you can mark a section of a
template to be escaped or not by using the ``autoescape`` tag:

.. code-block:: twig

    {% autoescape %}
        Everything will be automatically escaped in this block
        using the HTML strategy
    {% endautoescape %}

    {% autoescape 'html' %}
        Everything will be automatically escaped in this block
        using the HTML strategy
    {% endautoescape %}

    {% autoescape 'js' %}
        Everything will be automatically escaped in this block
        using the js escaping strategy
    {% endautoescape %}

    {% autoescape false %}
        Everything will be outputted as is in this block
    {% endautoescape %}

When automatic escaping is enabled everything is escaped by default except for
values explicitly marked as safe. Those can be marked in the template by using
the :doc:`raw<../filters/raw>` filter:

.. code-block:: twig

    {% autoescape %}
        {{ safe_value|raw }}
    {% endautoescape %}

Functions returning template data (like :doc:`macros<macro>` and
:doc:`parent<../functions/parent>`) always return safe markup.

.. note::

    Twig is smart enough to not escape an already escaped value by the
    :doc:`escape<../filters/escape>` filter.

.. note::

    Twig does not escape static expressions:

    .. code-block:: twig

        {% set hello = "<strong>Hello</strong>" %}
        {{ hello }}
        {{ "<strong>world</strong>" }}

    Will be rendered "<strong>Hello</strong> **world**".

.. note::

    The chapter :doc:`Twig for Developers<../api>` gives more information
    about when and how automatic escaping is applied.
