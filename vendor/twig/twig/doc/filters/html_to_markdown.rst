``html_to_markdown``
====================

.. versionadded:: 2.12
    The ``html_to_markdown`` filter was added in Twig 2.12.

The ``html_to_markdown`` filter converts a block of HTML to Markdown:

.. code-block:: twig

    {% apply html_to_markdown %}
        <html>
            <h1>Hello!</h1>
        </html>
    {% endapply %}

You can also add some options by passing them as an argument to the filter:

.. code-block:: twig

    {% apply html_to_markdown({hard_break: false}) %}
        <html>
            <h1>Hello!</h1>
        </html>
    {% endapply %}

.. note::

    The options are the ones provided by the ``league/html-to-markdown`` package.

You can also use the filter on an included file:

.. code-block:: twig

    {{ include('some_template.html.twig')|html_to_markdown }}

.. note::

    The ``html_to_markdown`` filter is part of the ``MarkdownExtension`` which
    is not installed by default. Install it first:

    .. code-block:: bash

        $ composer req twig/markdown-extra

    Then, use the ``twig/extra-bundle`` on Symfony projects or add the extension
    explictly on the Twig environment::

        use Twig\Extra\Markdown\MarkdownMarkdownExtension;

        $twig = new \Twig\Environment(...);
        $twig->addExtension(new MarkdownExtension());

    If you are not using Symfony, you must also register the extension runtime::

        use Twig\Extra\Markdown\DefaultMarkdown;
        use Twig\Extra\Markdown\MarkdownRuntime;
        use Twig\RuntimeLoader\RuntimeLoaderInterface;

        $twig->addRuntimeLoader(new class implements RuntimeLoaderInterface {
            public function load($class) {
                if (MarkdownRuntime::class === $class) {
                    return new MarkdownRuntime(new DefaultMarkdown());
                }
            }
        });
