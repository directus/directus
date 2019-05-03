``source``
==========

The ``source`` function returns the content of a template without rendering it:

.. code-block:: twig

    {{ source('template.html') }}
    {{ source(some_var) }}

When you set the ``ignore_missing`` flag, Twig will return an empty string if
the template does not exist:

.. code-block:: twig

    {{ source('template.html', ignore_missing = true) }}

The function uses the same template loaders as the ones used to include
templates. So, if you are using the filesystem loader, the templates are looked
for in the paths defined by it.

Arguments
---------

* ``name``: The name of the template to read
* ``ignore_missing``: Whether to ignore missing templates or not
