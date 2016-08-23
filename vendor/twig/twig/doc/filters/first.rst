``first``
=========

.. versionadded:: 1.12.2
    The ``first`` filter was added in Twig 1.12.2.

The ``first`` filter returns the first "element" of a sequence, a mapping, or
a string:

.. code-block:: jinja

    {{ [1, 2, 3, 4]|first }}
    {# outputs 1 #}

    {{ { a: 1, b: 2, c: 3, d: 4 }|first }}
    {# outputs 1 #}

    {{ '1234'|first }}
    {# outputs 1 #}

.. note::

    It also works with objects implementing the `Traversable`_ interface.

.. _`Traversable`: http://php.net/manual/en/class.traversable.php
