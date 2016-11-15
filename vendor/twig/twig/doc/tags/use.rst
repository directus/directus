``use``
=======

.. versionadded:: 1.1
    Horizontal reuse was added in Twig 1.1.

.. note::

    Horizontal reuse is an advanced Twig feature that is hardly ever needed in
    regular templates. It is mainly used by projects that need to make
    template blocks reusable without using inheritance.

Template inheritance is one of the most powerful features of Twig but it is
limited to single inheritance; a template can only extend one other template.
This limitation makes template inheritance simple to understand and easy to
debug:

.. code-block:: jinja

    {% extends "base.html" %}

    {% block title %}{% endblock %}
    {% block content %}{% endblock %}

Horizontal reuse is a way to achieve the same goal as multiple inheritance,
but without the associated complexity:

.. code-block:: jinja

    {% extends "base.html" %}

    {% use "blocks.html" %}

    {% block title %}{% endblock %}
    {% block content %}{% endblock %}

The ``use`` statement tells Twig to import the blocks defined in
``blocks.html`` into the current template (it's like macros, but for blocks):

.. code-block:: jinja

    {# blocks.html #}
    
    {% block sidebar %}{% endblock %}

In this example, the ``use`` statement imports the ``sidebar`` block into the
main template. The code is mostly equivalent to the following one (the
imported blocks are not outputted automatically):

.. code-block:: jinja

    {% extends "base.html" %}

    {% block sidebar %}{% endblock %}
    {% block title %}{% endblock %}
    {% block content %}{% endblock %}

.. note::

    The ``use`` tag only imports a template if it does not extend another
    template, if it does not define macros, and if the body is empty. But it
    can *use* other templates.

.. note::

    Because ``use`` statements are resolved independently of the context
    passed to the template, the template reference cannot be an expression.

The main template can also override any imported block. If the template
already defines the ``sidebar`` block, then the one defined in ``blocks.html``
is ignored. To avoid name conflicts, you can rename imported blocks:

.. code-block:: jinja

    {% extends "base.html" %}

    {% use "blocks.html" with sidebar as base_sidebar, title as base_title %}

    {% block sidebar %}{% endblock %}
    {% block title %}{% endblock %}
    {% block content %}{% endblock %}

.. versionadded:: 1.3
    The ``parent()`` support was added in Twig 1.3.

The ``parent()`` function automatically determines the correct inheritance
tree, so it can be used when overriding a block defined in an imported
template:

.. code-block:: jinja

    {% extends "base.html" %}

    {% use "blocks.html" %}

    {% block sidebar %}
        {{ parent() }}
    {% endblock %}

    {% block title %}{% endblock %}
    {% block content %}{% endblock %}

In this example, ``parent()`` will correctly call the ``sidebar`` block from
the ``blocks.html`` template.

.. tip::

    In Twig 1.2, renaming allows you to simulate inheritance by calling the
    "parent" block:

    .. code-block:: jinja

        {% extends "base.html" %}

        {% use "blocks.html" with sidebar as parent_sidebar %}

        {% block sidebar %}
            {{ block('parent_sidebar') }}
        {% endblock %}

.. note::

    You can use as many ``use`` statements as you want in any given template.
    If two imported templates define the same block, the latest one wins.
