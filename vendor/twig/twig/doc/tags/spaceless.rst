``spaceless``
=============

Use the ``spaceless`` tag to remove whitespace *between HTML tags*, not
whitespace within HTML tags or whitespace in plain text:

.. code-block:: jinja

    {% spaceless %}
        <div>
            <strong>foo</strong>
        </div>
    {% endspaceless %}

    {# output will be <div><strong>foo</strong></div> #}

This tag is not meant to "optimize" the size of the generated HTML content but
merely to avoid extra whitespace between HTML tags to avoid browser rendering
quirks under some circumstances.

.. tip::

    If you want to optimize the size of the generated HTML content, gzip
    compress the output instead.

.. tip::

    If you want to create a tag that actually removes all extra whitespace in
    an HTML string, be warned that this is not as easy as it seems to be
    (think of ``textarea`` or ``pre`` tags for instance). Using a third-party
    library like Tidy is probably a better idea.

.. tip::

    For more information on whitespace control, read the
    :ref:`dedicated section <templates-whitespace-control>` of the documentation and learn how
    you can also use the whitespace control modifier on your tags.
