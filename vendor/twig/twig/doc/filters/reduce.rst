``reduce``
==========

The ``reduce`` filter iteratively reduces a sequence or a mapping to a single
value using an arrow function, so as to reduce it to a single value. The arrow
function receives the return value of the previous iteration and the current
value of the sequence or mapping:

.. code-block:: twig

    {% set numbers = [1, 2, 3] %}

    {{ numbers|reduce((carry, v) => carry + v) }}
    {# output 6 #}

The ``reduce`` filter takes an ``initial`` value as a second argument:

.. code-block:: twig

    {{ numbers|reduce((carry, v) => carry + v, 10) }}
    {# output 16 #}

Note that the arrow function has access to the current context.

Arguments
---------

* ``arrow``: The arrow function
* ``initial``: The initial value
