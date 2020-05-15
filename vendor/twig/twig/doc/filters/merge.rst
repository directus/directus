``merge``
=========

The ``merge`` filter merges an array with another array:

.. code-block:: twig

    {% set values = [1, 2] %}

    {% set values = values|merge(['apple', 'orange']) %}

    {# values now contains [1, 2, 'apple', 'orange'] #}

New values are added at the end of the existing ones.

The ``merge`` filter also works on hashes:

.. code-block:: twig

    {% set items = { 'apple': 'fruit', 'orange': 'fruit', 'peugeot': 'unknown' } %}

    {% set items = items|merge({ 'peugeot': 'car', 'renault': 'car' }) %}

    {# items now contains { 'apple': 'fruit', 'orange': 'fruit', 'peugeot': 'car', 'renault': 'car' } #}

For hashes, the merging process occurs on the keys: if the key does not
already exist, it is added but if the key already exists, its value is
overridden.

.. tip::

    If you want to ensure that some values are defined in an array (by given
    default values), reverse the two elements in the call:

    .. code-block:: twig

        {% set items = { 'apple': 'fruit', 'orange': 'fruit' } %}

        {% set items = { 'apple': 'unknown' }|merge(items) %}

        {# items now contains { 'apple': 'fruit', 'orange': 'fruit' } #}
        
.. note::

    Internally, Twig uses the PHP `array_merge`_ function. It supports
    Traversable objects by transforming those to arrays.

.. _`array_merge`: https://secure.php.net/array_merge
