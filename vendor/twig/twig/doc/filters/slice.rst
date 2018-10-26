``slice``
===========

The ``slice`` filter extracts a slice of a sequence, a mapping, or a string:

.. code-block:: jinja

    {% for i in [1, 2, 3, 4, 5]|slice(1, 2) %}
        {# will iterate over 2 and 3 #}
    {% endfor %}

    {{ '12345'|slice(1, 2) }}

    {# outputs 23 #}

You can use any valid expression for both the start and the length:

.. code-block:: jinja

    {% for i in [1, 2, 3, 4, 5]|slice(start, length) %}
        {# ... #}
    {% endfor %}

As syntactic sugar, you can also use the ``[]`` notation:

.. code-block:: jinja

    {% for i in [1, 2, 3, 4, 5][start:length] %}
        {# ... #}
    {% endfor %}

    {{ '12345'[1:2] }} {# will display "23" #}

    {# you can omit the first argument -- which is the same as 0 #}
    {{ '12345'[:2] }} {# will display "12" #}

    {# you can omit the last argument -- which will select everything till the end #}
    {{ '12345'[2:] }} {# will display "345" #}

The ``slice`` filter works as the `array_slice`_ PHP function for arrays and
`mb_substr`_ for strings with a fallback to `substr`_.

If the start is non-negative, the sequence will start at that start in the
variable. If start is negative, the sequence will start that far from the end
of the variable.

If length is given and is positive, then the sequence will have up to that
many elements in it. If the variable is shorter than the length, then only the
available variable elements will be present. If length is given and is
negative then the sequence will stop that many elements from the end of the
variable. If it is omitted, then the sequence will have everything from offset
up until the end of the variable.

.. note::

    It also works with objects implementing the `Traversable`_ interface.

Arguments
---------

* ``start``:         The start of the slice
* ``length``:        The size of the slice
* ``preserve_keys``: Whether to preserve key or not (when the input is an array)

.. _`Traversable`: https://secure.php.net/manual/en/class.traversable.php
.. _`array_slice`: https://secure.php.net/array_slice
.. _`mb_substr` :  https://secure.php.net/mb-substr
.. _`substr`:      https://secure.php.net/substr
