``template_from_string``
========================

The ``template_from_string`` function loads a template from a string:

.. code-block:: jinja

    {{ include(template_from_string("Hello {{ name }}")) }}
    {{ include(template_from_string(page.template)) }}

.. note::

    The ``template_from_string`` function is not available by default. You
    must add the ``Twig_Extension_StringLoader`` extension explicitly when
    creating your Twig environment::

        $twig = new Twig_Environment(...);
        $twig->addExtension(new Twig_Extension_StringLoader());

.. note::

    Even if you will probably always use the ``template_from_string`` function
    with the ``include`` function, you can use it with any tag or function that
    takes a template as an argument (like the ``embed`` or ``extends`` tags).

Arguments
---------

* ``template``: The template
