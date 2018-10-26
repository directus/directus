``join``
========

The ``join`` filter returns a string which is the concatenation of the items
of a sequence:

.. code-block:: jinja

    {{ [1, 2, 3]|join }}
    {# returns 123 #}

The separator between elements is an empty string per default, but you can
define it with the optional first parameter:

.. code-block:: jinja

    {{ [1, 2, 3]|join('|') }}
    {# outputs 1|2|3 #}

Arguments
---------

* ``glue``: The separator
