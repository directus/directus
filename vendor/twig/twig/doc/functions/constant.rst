``constant``
============

.. versionadded: 1.12.1
    constant now accepts object instances as the second argument.

.. versionadded: 1.28
    Using ``constant`` with the ``defined`` test was added in Twig 1.28.

``constant`` returns the constant value for a given string:

.. code-block:: jinja

    {{ some_date|date(constant('DATE_W3C')) }}
    {{ constant('Namespace\\Classname::CONSTANT_NAME') }}

As of 1.12.1 you can read constants from object instances as well:

.. code-block:: jinja

    {{ constant('RSS', date) }}

Use the ``defined`` test to check if a constant is defined:

.. code-block:: jinja

    {% if constant('SOME_CONST') is defined %}
        ...
    {% endif %}
