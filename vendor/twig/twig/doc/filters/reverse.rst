``reverse``
===========

.. versionadded:: 1.6
    Support for strings has been added in Twig 1.6.

The ``reverse`` filter reverses a sequence, a mapping, or a string:

.. code-block:: jinja

    {% for user in users|reverse %}
        ...
    {% endfor %}

    {{ '1234'|reverse }}

    {# outputs 4321 #}

.. tip::

    For sequences and mappings, numeric keys are not preserved. To reverse
    them as well, pass ``true`` as an argument to the ``reverse`` filter:

    .. code-block:: jinja

        {% for key, value in {1: "a", 2: "b", 3: "c"}|reverse %}
            {{ key }}: {{ value }}
        {%- endfor %}

        {# output: 0: c    1: b    2: a #}

        {% for key, value in {1: "a", 2: "b", 3: "c"}|reverse(true) %}
            {{ key }}: {{ value }}
        {%- endfor %}

        {# output: 3: c    2: b    1: a #}

.. note::

    It also works with objects implementing the `Traversable`_ interface.

Arguments
---------

* ``preserve_keys``: Preserve keys when reversing a mapping or a sequence.

.. _`Traversable`: http://php.net/Traversable
