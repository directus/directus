``convert_encoding``
====================

The ``convert_encoding`` filter converts a string from one encoding to
another. The first argument is the expected output charset and the second one
is the input charset:

.. code-block:: jinja

    {{ data|convert_encoding('UTF-8', 'iso-2022-jp') }}

.. note::

    This filter relies on the `iconv`_ extension.

Arguments
---------

* ``to``:   The output charset
* ``from``: The input charset

.. _`iconv`: https://secure.php.net/iconv
