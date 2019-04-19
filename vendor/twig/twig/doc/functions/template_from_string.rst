``template_from_string``
========================

.. versionadded:: 2.8
    The name argument was added in Twig 2.8.

The ``template_from_string`` function loads a template from a string:

.. code-block:: jinja

    {{ include(template_from_string("Hello {{ name }}")) }}
    {{ include(template_from_string(page.template)) }}

To ease debugging, you can also give the template a name that will be part of
any related error message:

.. code-block:: jinja

    {{ include(template_from_string(page.template, "template for page " ~ page.name)) }}

.. note::

    The ``template_from_string`` function is not available by default. You
    must add the ``\Twig\Extension\StringLoaderExtension`` extension explicitly when
    creating your Twig environment::

        $twig = new \Twig\Environment(...);
        $twig->addExtension(new \Twig\Extension\StringLoaderExtension());

.. note::

    Even if you will probably always use the ``template_from_string`` function
    with the ``include`` function, you can use it with any tag or function that
    takes a template as an argument (like the ``embed`` or ``extends`` tags).

Arguments
---------

* ``template``: The template
* ``name``: A name for the template
