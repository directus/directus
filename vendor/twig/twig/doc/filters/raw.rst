``raw``
=======

The ``raw`` filter marks the value as being "safe", which means that in an
environment with automatic escaping enabled this variable will not be escaped
if ``raw`` is the last filter applied to it:

.. code-block:: jinja

    {% autoescape %}
        {{ var|raw }} {# var won't be escaped #}
    {% endautoescape %}

.. note::

    **This note only applies to Twig before versions 1.39 and 2.8**.

    Be careful when using the ``raw`` filter inside expressions:

    .. code-block:: jinja

        {% autoescape %}
            {% set hello = '<strong>Hello</strong>' %}
            {% set hola = '<strong>Hola</strong>' %}

            {{ false ? '<strong>Hola</strong>' : hello|raw }}
            does not render the same as
            {{ false ? hola : hello|raw }}
            but renders the same as
            {{ (false ? hola : hello)|raw }}
        {% endautoescape %}

    The first ternary statement is not escaped: ``hello`` is marked as being
    safe and Twig does not escape static values (see
    :doc:`escape<../tags/autoescape>`). In the second ternary statement, even
    if ``hello`` is marked as safe, ``hola`` remains unsafe and so is the whole
    expression. The third ternary statement is marked as safe and the result is
    not escaped.
