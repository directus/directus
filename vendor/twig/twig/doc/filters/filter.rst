``filter``
==========

.. versionadded:: 1.41
    The ``filter`` filter was added in Twig 1.41 and 2.10.

The ``filter`` filter filters elements of a sequence or a mapping using an arrow
function. The arrow function receives the value of the sequence or mapping:

.. code-block:: twig

    {% set sizes = [34, 36, 38, 40, 42] %}

    {{ sizes|filter(v => v > 38)|join(', ') }}
    {# output 40, 42 #}

Combined with the ``for`` tag, it allows to filter the items to iterate over:

.. code-block:: twig

    {% for v in sizes|filter(v => v > 38) -%}
        {{ v }}
    {% endfor %}
    {# output 40 42 #}

It also works with mappings:

.. code-block:: twig

    {% set sizes = {
        xs: 34,
        s:  36,
        m:  38,
        l:  40,
        xl: 42,
    } %}

    {% for k, v in sizes|filter(v => v > 38) -%}
        {{ k }} = {{ v }}
    {% endfor %}
    {# output l = 40 xl = 42 #}

The arrow function also receives the key as a second argument:

.. code-block:: twig

    {% for k, v in sizes|filter((v, k) => v > 38 and k != "xl") -%}
        {{ k }} = {{ v }}
    {% endfor %}
    {# output l = 40 #}

Note that the arrow function has access to the current context.

Arguments
---------

* ``array``: The sequence or mapping
* ``arrow``: The arrow function
