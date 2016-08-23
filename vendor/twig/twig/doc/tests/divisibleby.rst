``divisible by``
================

.. versionadded:: 1.14.2
    The ``divisible by`` test was added in Twig 1.14.2 as an alias for
    ``divisibleby``.

``divisible by`` checks if a variable is divisible by a number:

.. code-block:: jinja

    {% if loop.index is divisible by(3) %}
        ...
    {% endif %}
