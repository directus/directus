``block``
=========

When a template uses inheritance and if you want to print a block multiple
times, use the ``block`` function:

.. code-block:: jinja

    <title>{% block title %}{% endblock %}</title>

    <h1>{{ block('title') }}</h1>

    {% block body %}{% endblock %}

.. seealso:: :doc:`extends<../tags/extends>`, :doc:`parent<../functions/parent>`
