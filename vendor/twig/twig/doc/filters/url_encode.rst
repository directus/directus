``url_encode``
==============

The ``url_encode`` filter percent encodes a given string as URL segment
or an array as query string:

.. code-block:: jinja

    {{ "path-seg*ment"|url_encode }}
    {# outputs "path-seg%2Ament" #}

    {{ "string with spaces"|url_encode }}
    {# outputs "string%20with%20spaces" #}

    {{ {'param': 'value', 'foo': 'bar'}|url_encode }}
    {# outputs "param=value&foo=bar" #}

.. note::

    Internally, Twig uses the PHP ``rawurlencode``.

.. _`rawurlencode`: https://secure.php.net/rawurlencode
