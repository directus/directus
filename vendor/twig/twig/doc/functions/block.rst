``block``
=========

When a template uses inheritance and if you want to print a block multiple
times, use the ``block`` function:

.. code-block:: jinja

    <title>{% block title %}{% endblock %}</title>

    <h1>{{ block('title') }}</h1>

    {% block body %}{% endblock %}

The ``block`` function can also be used to display one block from another
template:

.. code-block:: jinja

    {{ block("title", "common_blocks.twig") }}

Use the ``defined`` test to check if a block exists in the context of the
current template:

.. code-block:: jinja

    {% if block("footer") is defined %}
        ...
    {% endif %}

    {% if block("footer", "common_blocks.twig") is defined %}
        ...
    {% endif %}

.. seealso:: :doc:`extends<../tags/extends>`, :doc:`parent<../functions/parent>`
