``default``
===========

The ``default`` filter returns the passed default value if the value is
undefined or empty, otherwise the value of the variable:

.. code-block:: twig

    {{ var|default('var is not defined') }}

    {{ var.foo|default('foo item on var is not defined') }}

    {{ var['foo']|default('foo item on var is not defined') }}

    {{ ''|default('passed var is empty')  }}

When using the ``default`` filter on an expression that uses variables in some
method calls, be sure to use the ``default`` filter whenever a variable can be
undefined:

.. code-block:: twig

    {{ var.method(foo|default('foo'))|default('foo') }}
    
Using the ``default`` filter on a boolean variable might trigger unexpected behaviour, as
``false`` is treated as an empty value. Consider using ``??`` instead:

.. code-block:: twig

    {% set foo = false %}
    {{ foo|default(true) }} {# true #}
    {{ foo ?? true }} {# false #}

.. note::

    Read the documentation for the :doc:`defined<../tests/defined>` and
    :doc:`empty<../tests/empty>` tests to learn more about their semantics.

Arguments
---------

* ``default``: The default value
