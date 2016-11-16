``striptags``
=============

The ``striptags`` filter strips SGML/XML tags and replace adjacent whitespace
by one space:

.. code-block:: jinja

    {{ some_html|striptags }}

.. note::

    Internally, Twig uses the PHP `strip_tags`_ function.

.. _`strip_tags`: http://php.net/strip_tags
