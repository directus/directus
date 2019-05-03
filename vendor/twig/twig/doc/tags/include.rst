``include``
===========

The ``include`` statement includes a template and returns the rendered content
of that file:

.. code-block:: twig

    {% include 'header.html' %}
        Body
    {% include 'footer.html' %}

.. note::

    As of Twig 1.12, it is recommended to use the
    :doc:`include<../functions/include>` function instead as it provides the
    same features with a bit more flexibility:

    * The ``include`` function is semantically more "correct" (including a
      template outputs its rendered contents in the current scope; a tag should
      not display anything);

    * The ``include`` function is more "composable":

      .. code-block:: twig

          {# Store a rendered template in a variable #}
          {% set content %}
              {% include 'template.html' %}
          {% endset %}
          {# vs #}
          {% set content = include('template.html') %}

          {# Filter a rendered template #}
          {% filter upper %}
              {% include 'template.html' %}
          {% endfilter %}
          {# vs #}
          {% include('template.html')|upper %}

    * The ``include`` function does not impose any specific order for
      arguments thanks to :ref:`named arguments <named-arguments>`.

Included templates have access to the variables of the active context.

If you are using the filesystem loader, the templates are looked for in the
paths defined by it.

You can add additional variables by passing them after the ``with`` keyword:

.. code-block:: twig

    {# template.html will have access to the variables from the current context and the additional ones provided #}
    {% include 'template.html' with {'foo': 'bar'} %}

    {% set vars = {'foo': 'bar'} %}
    {% include 'template.html' with vars %}

You can disable access to the context by appending the ``only`` keyword:

.. code-block:: twig

    {# only the foo variable will be accessible #}
    {% include 'template.html' with {'foo': 'bar'} only %}

.. code-block:: twig

    {# no variables will be accessible #}
    {% include 'template.html' only %}

.. tip::

    When including a template created by an end user, you should consider
    sandboxing it. More information in the :doc:`Twig for Developers<../api>`
    chapter and in the :doc:`sandbox<../tags/sandbox>` tag documentation.

The template name can be any valid Twig expression:

.. code-block:: twig

    {% include some_var %}
    {% include ajax ? 'ajax.html' : 'not_ajax.html' %}

And if the expression evaluates to a ``\Twig\Template`` or a
``\Twig\TemplateWrapper`` instance, Twig will use it directly::

    // {% include template %}

    $template = $twig->load('some_template.twig');

    $twig->display('template.twig', ['template' => $template]);

You can mark an include with ``ignore missing`` in which case Twig will ignore
the statement if the template to be included does not exist. It has to be
placed just after the template name. Here some valid examples:

.. code-block:: twig

    {% include 'sidebar.html' ignore missing %}
    {% include 'sidebar.html' ignore missing with {'foo': 'bar'} %}
    {% include 'sidebar.html' ignore missing only %}

You can also provide a list of templates that are checked for existence before
inclusion. The first template that exists will be included:

.. code-block:: twig

    {% include ['page_detailed.html', 'page.html'] %}

If ``ignore missing`` is given, it will fall back to rendering nothing if none
of the templates exist, otherwise it will throw an exception.
