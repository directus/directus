``do``
======

.. versionadded:: 1.5
    The ``do`` tag was added in Twig 1.5.

The ``do`` tag works exactly like the regular variable expression (``{{ ...
}}``) just that it doesn't print anything:

.. code-block:: jinja

    {% do 1 + 2 %}
