``column``
==========

.. versionadded:: 2.8
    The ``column`` filter was added in Twig 2.8.

The ``column`` filter returns the values from a single column in the input
array.

.. code-block:: jinja

    {% set items = [{ 'fruit' : 'apple'}, {'fruit' : 'orange' }] %}

    {% set fruits = items|column('fruit') %}

    {# fruits now contains ['apple', 'orange'] #}

.. note::

    Internally, Twig uses the PHP `array_column`_ function.

Arguments
---------

* ``name``: The column name to extract

.. _`array_column`: https://secure.php.net/array_column
