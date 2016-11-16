``set``
=======

Inside code blocks you can also assign values to variables. Assignments use
the ``set`` tag and can have multiple targets.

Here is how you can assign the ``bar`` value to the ``foo`` variable:

.. code-block:: jinja

    {% set foo = 'bar' %}

After the ``set`` call, the ``foo`` variable is available in the template like
any other ones:

.. code-block:: jinja

    {# displays bar #}
    {{ foo }}

The assigned value can be any valid :ref:`Twig expressions
<twig-expressions>`:

.. code-block:: jinja

    {% set foo = [1, 2] %}
    {% set foo = {'foo': 'bar'} %}
    {% set foo = 'foo' ~ 'bar' %}

Several variables can be assigned in one block:

.. code-block:: jinja

    {% set foo, bar = 'foo', 'bar' %}

    {# is equivalent to #}

    {% set foo = 'foo' %}
    {% set bar = 'bar' %}

The ``set`` tag can also be used to 'capture' chunks of text:

.. code-block:: jinja

    {% set foo %}
        <div id="pagination">
            ...
        </div>
    {% endset %}

.. caution::

    If you enable automatic output escaping, Twig will only consider the
    content to be safe when capturing chunks of text.

.. note::

    Note that loops are scoped in Twig; therefore a variable declared inside a
    ``for`` loop is not accessible outside the loop itself:

    .. code-block:: jinja

        {% for item in list %}
            {% set foo = item %}
        {% endfor %}

        {# foo is NOT available #}

    If you want to access the variable, just declare it before the loop:

    .. code-block:: jinja

        {% set foo = "" %}
        {% for item in list %}
            {% set foo = item %}
        {% endfor %}

        {# foo is available #}
