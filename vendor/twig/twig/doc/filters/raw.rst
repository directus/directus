``raw``
=======

The ``raw`` filter marks the value as being "safe", which means that in an
environment with automatic escaping enabled this variable will not be escaped
if ``raw`` is the last filter applied to it:

.. code-block:: twig

    {% autoescape %}
        {{ var|raw }} {# var won't be escaped #}
    {% endautoescape %}
