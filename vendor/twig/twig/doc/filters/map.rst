``map``
=======

The ``map`` filter applies an arrow function to the elements of a sequence or a
mapping. The arrow function receives the value of the sequence or mapping:

.. code-block:: twig

    {% set people = [
        {first: "Bob", last: "Smith"},
        {first: "Alice", last: "Dupond"},
    ] %}

    {{ people|map(p => "#{p.first} #{p.last}")|join(', ') }}
    {# outputs Bob Smith, Alice Dupond #}

The arrow function also receives the key as a second argument:

.. code-block:: twig

    {% set people = {
        "Bob": "Smith",
        "Alice": "Dupond",
    } %}

    {{ people|map((last, first) => "#{first} #{last}")|join(', ') }}
    {# outputs Bob Smith, Alice Dupond #}

Note that the arrow function has access to the current context.

Arguments
---------

* ``arrow``: The arrow function
