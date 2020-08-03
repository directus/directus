``inline_css``
==============

The ``inline_css`` filter inline CSS styles in HTML documents:

.. code-block:: twig

    {% apply inline_css %}
        <html>
            <head>
                <style>
                    p { color: red; }
                </style>
            </head>
            <body>
                <p>Hello CSS!</p>
            </body>
        </html>
    {% endapply %}

You can also add some stylesheets by passing them as arguments to the filter:

.. code-block:: twig

    {% apply inline_css(source("some_styles.css"), source("another.css")) %}
        <html>
            <body>
                <p>Hello CSS!</p>
            </body>
        </html>
    {% endapply %}

Styles loaded via the filter override the styles defined in the ``<style>`` tag
of the HTML document.

You can also use the filter on an included file:

.. code-block:: twig

    {{ include('some_template.html.twig')|inline_css }}

    {{ include('some_template.html.twig')|inline_css(source("some_styles.css")) }}

Note that the CSS inliner works on an entire HTML document, not a fragment.

.. note::

    The ``inline_css`` filter is part of the ``CssInlinerExtension`` which is not
    installed by default. Install it first:

    .. code-block:: bash

        $ composer req twig/cssinliner-extra

    Then, use the ``twig/extra-bundle`` on Symfony projects or add the extension
    explicitly on the Twig environment::

        use Twig\Extra\CssInliner\CssInlinerExtension;

        $twig = new \Twig\Environment(...);
        $twig->addExtension(new CssInlinerExtension());
