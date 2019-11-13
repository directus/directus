``html_classes``
================

.. versionadded:: 2.12
    The ``html_classes`` function was added in Twig 2.12.

The ``html_classes`` function returns a string by conditionally joining class
names together:

.. code-block:: jinja

    <p class="{{ html_classes('a-class', 'another-class', {
        'errored': object.errored,
        'finished': object.finished,
        'pending': object.pending,
    }) }}">How are you doing?</p>

.. note::

    The ``html_classes`` function is part of the ``HtmlExtension`` which is not
    installed by default. Install it first:

    .. code-block:: bash

        $ composer req twig/html-extra

    Then, use the ``twig/extra-bundle`` on Symfony projects or add the extension
    explictly on the Twig environment::

        use Twig\Extra\Html\HtmlExtension;

        $twig = new \Twig\Environment(...);
        $twig->addExtension(new HtmlExtension());
