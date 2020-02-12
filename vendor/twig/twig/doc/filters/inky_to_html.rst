``inky_to_html``
================

The ``inky_to_html`` filter processes an `inky email template
<https://github.com/zurb/inky>`_:

.. code-block:: twig

    {% apply inky_to_html %}
        <row>
            <columns large="6"></columns>
            <columns large="6"></columns>
        </row>
    {% endapply %}

You can also use the filter on an included file:

.. code-block:: twig

    {{ include('some_template.inky.twig')|inky_to_html }}

.. note::

    The ``inky_to_html`` filter is part of the ``InkyExtension`` which is not
    installed by default. Install it first:

    .. code-block:: bash

        $ composer req twig/inky-extra

    Then, use the ``twig/extra-bundle`` on Symfony projects or add the extension
    explictly on the Twig environment::

        use Twig\Extra\Inky\InkyExtension;

        $twig = new \Twig\Environment(...);
        $twig->addExtension(new InkyExtension());
