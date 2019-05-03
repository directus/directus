``filter``
==========

.. note::

    As of Twig 2.9, you should use the ``apply`` tag instead which does the
    same thing except that the wrapped template data is not scoped.

Filter sections allow you to apply regular Twig filters on a block of template
data. Just wrap the code in the special ``filter`` section:

.. code-block:: twig

    {% filter upper %}
        This text becomes uppercase
    {% endfilter %}

You can also chain filters and pass arguments to them:

.. code-block:: twig

    {% filter lower|escape('html') %}
        <strong>SOME TEXT</strong>
    {% endfilter %}

    {# outputs "&lt;strong&gt;some text&lt;/strong&gt;" #}
