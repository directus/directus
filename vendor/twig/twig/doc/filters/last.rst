``last``
========

The ``last`` filter returns the last "element" of a sequence, a mapping, or
a string:

.. code-block:: jinja

    {{ [1, 2, 3, 4]|last }}
    {# outputs 4 #}

    {{ { a: 1, b: 2, c: 3, d: 4 }|last }}
    {# outputs 4 #}

    {{ '1234'|last }}
    {# outputs 4 #}

.. note::

    It also works with objects implementing the `Traversable`_ interface.

.. _`Traversable`: https://secure.php.net/manual/en/class.traversable.php
