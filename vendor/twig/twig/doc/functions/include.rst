``include``
===========

The ``include`` function returns the rendered content of a template:

.. code-block:: jinja

    {{ include('template.html') }}
    {{ include(some_var) }}

Included templates have access to the variables of the active context.

If you are using the filesystem loader, the templates are looked for in the
paths defined by it.

The context is passed by default to the template but you can also pass
additional variables:

.. code-block:: jinja

    {# template.html will have access to the variables from the current context and the additional ones provided #}
    {{ include('template.html', {foo: 'bar'}) }}

You can disable access to the context by setting ``with_context`` to
``false``:

.. code-block:: jinja

    {# only the foo variable will be accessible #}
    {{ include('template.html', {foo: 'bar'}, with_context = false) }}

.. code-block:: jinja

    {# no variables will be accessible #}
    {{ include('template.html', with_context = false) }}

And if the expression evaluates to a ``Twig_Template`` or a
``Twig_TemplateWrapper`` instance, Twig will use it directly::

    // {{ include(template) }}

    $template = $twig->load('some_template.twig');

    $twig->display('template.twig', array('template' => $template));

When you set the ``ignore_missing`` flag, Twig will return an empty string if
the template does not exist:

.. code-block:: jinja

    {{ include('sidebar.html', ignore_missing = true) }}

You can also provide a list of templates that are checked for existence before
inclusion. The first template that exists will be rendered:

.. code-block:: jinja

    {{ include(['page_detailed.html', 'page.html']) }}

If ``ignore_missing`` is set, it will fall back to rendering nothing if none
of the templates exist, otherwise it will throw an exception.

When including a template created by an end user, you should consider
sandboxing it:

.. code-block:: jinja

    {{ include('page.html', sandboxed = true) }}

Arguments
---------

* ``template``:       The template to render
* ``variables``:      The variables to pass to the template
* ``with_context``:   Whether to pass the current context variables or not
* ``ignore_missing``: Whether to ignore missing templates or not
* ``sandboxed``:      Whether to sandbox the template or not
