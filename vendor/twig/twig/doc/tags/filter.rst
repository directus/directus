``filter``
==========

Filter sections allow you to apply regular Twig filters on a block of template
data. Just wrap the code in the special ``filter`` section:

.. code-block:: jinja

    {% filter upper %}
        This text becomes uppercase
    {% endfilter %}

You can also chain filters:

.. code-block:: jinja

    {% filter lower|escape %}
        <strong>SOME TEXT</strong>
    {% endfilter %}

    {# outputs "&lt;strong&gt;some text&lt;/strong&gt;" #}
