``max``
=======

.. versionadded:: 1.15
    The ``max`` function was added in Twig 1.15.

``max`` returns the biggest value of a sequence or a set of values:

.. code-block:: jinja

    {{ max(1, 3, 2) }}
    {{ max([1, 3, 2]) }}

When called with a mapping, max ignores keys and only compares values:

.. code-block:: jinja

    {{ max({2: "e", 1: "a", 3: "b", 5: "d", 4: "c"}) }}
    {# returns "e" #}

