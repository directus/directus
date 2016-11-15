``constant``
============

.. versionadded: 1.12.1
    constant now accepts object instances as the second argument.

``constant`` returns the constant value for a given string:

.. code-block:: jinja

    {{ some_date|date(constant('DATE_W3C')) }}
    {{ constant('Namespace\\Classname::CONSTANT_NAME') }}

As of 1.12.1 you can read constants from object instances as well:

.. code-block:: jinja

    {{ constant('RSS', date) }}
