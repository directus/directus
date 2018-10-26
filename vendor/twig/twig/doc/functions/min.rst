``min``
=======

``min`` returns the lowest value of a sequence or a set of values:

.. code-block:: jinja

    {{ min(1, 3, 2) }}
    {{ min([1, 3, 2]) }}

When called with a mapping, min ignores keys and only compares values:

.. code-block:: jinja

    {{ min({2: "e", 3: "a", 1: "b", 5: "d", 4: "c"}) }}
    {# returns "a" #}

