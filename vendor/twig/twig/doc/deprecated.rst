Deprecated Features
===================

This document lists all deprecated features in Twig. Deprecated features are
kept for backward compatibility and removed in the next major release (a
feature that was deprecated in Twig 1.x is removed in Twig 2.0).

Deprecation Notices
-------------------

As of Twig 1.21, Twig generates deprecation notices when a template uses
deprecated features. See :ref:`deprecation-notices` for more information.

Token Parsers
-------------

* As of Twig 1.x, the token parser broker sub-system is deprecated. The
  following class and interface will be removed in 2.0:

  * ``Twig_TokenParserBrokerInterface``
  * ``Twig_TokenParserBroker``

Extensions
----------

* As of Twig 1.x, the ability to remove an extension is deprecated and the
  ``Twig_Environment::removeExtension()`` method will be removed in 2.0.

* As of Twig 1.23, the ``Twig_ExtensionInterface::initRuntime()`` method is
  deprecated. You have two options to avoid the deprecation notice: if you
  implement this method to store the environment for your custom filters,
  functions, or tests, use the ``needs_environment`` option instead; if you
  have more complex needs, explicitly implement
  ``Twig_Extension_InitRuntimeInterface`` (not recommended).

* As of Twig 1.23, the ``Twig_ExtensionInterface::getGlobals()`` method is
  deprecated. Implement ``Twig_Extension_GlobalsInterface`` to avoid
  deprecation notices.

PEAR
----

PEAR support has been discontinued in Twig 1.15.1, and no PEAR packages are
provided anymore. Use Composer instead.

Filters
-------

* As of Twig 1.x, use ``Twig_SimpleFilter`` to add a filter. The following
  classes and interfaces will be removed in 2.0:

  * ``Twig_FilterInterface``
  * ``Twig_FilterCallableInterface``
  * ``Twig_Filter``
  * ``Twig_Filter_Function``
  * ``Twig_Filter_Method``
  * ``Twig_Filter_Node``

* As of Twig 2.x, the ``Twig_SimpleFilter`` class is deprecated and will be
  removed in Twig 3.x (use ``Twig_Filter`` instead). In Twig 2.x,
  ``Twig_SimpleFilter`` is just an alias for ``Twig_Filter``.

Functions
---------

* As of Twig 1.x, use ``Twig_SimpleFunction`` to add a function. The following
  classes and interfaces will be removed in 2.0:

  * ``Twig_FunctionInterface``
  * ``Twig_FunctionCallableInterface``
  * ``Twig_Function``
  * ``Twig_Function_Function``
  * ``Twig_Function_Method``
  * ``Twig_Function_Node``

* As of Twig 2.x, the ``Twig_SimpleFunction`` class is deprecated and will be
  removed in Twig 3.x (use ``Twig_Function`` instead). In Twig 2.x,
  ``Twig_SimpleFunction`` is just an alias for ``Twig_Function``.

Tests
-----

* As of Twig 1.x, use ``Twig_SimpleTest`` to add a test. The following classes
  and interfaces will be removed in 2.0:

  * ``Twig_TestInterface``
  * ``Twig_TestCallableInterface``
  * ``Twig_Test``
  * ``Twig_Test_Function``
  * ``Twig_Test_Method``
  * ``Twig_Test_Node``

* As of Twig 2.x, the ``Twig_SimpleTest`` class is deprecated and will be
  removed in Twig 3.x (use ``Twig_Test`` instead). In Twig 2.x,
  ``Twig_SimpleTest`` is just an alias for ``Twig_Test``.

* The ``sameas`` and ``divisibleby`` tests are deprecated in favor of ``same
  as`` and ``divisible by`` respectively.

Tags
----

* As of Twig 1.x, the ``raw`` tag is deprecated. You should use ``verbatim``
  instead.

Nodes
-----

* As of Twig 1.x, ``Node::toXml()`` is deprecated and will be removed in Twig
  2.0.

Interfaces
----------

* As of Twig 2.x, the following interfaces are deprecated and empty (they will
  be removed in Twig 3.0):

* ``Twig_CompilerInterface``     (use ``Twig_Compiler`` instead)
* ``Twig_LexerInterface``        (use ``Twig_Lexer`` instead)
* ``Twig_NodeInterface``         (use ``Twig_Node`` instead)
* ``Twig_ParserInterface``       (use ``Twig_Parser`` instead)
* ``Twig_ExistsLoaderInterface`` (merged with ``Twig_LoaderInterface``)
* ``Twig_TemplateInterface``     (use ``Twig_Template`` instead, and use
  those constants Twig_Template::ANY_CALL, Twig_Template::ARRAY_CALL,
  Twig_Template::METHOD_CALL)

Loaders
-------

* As of Twig 1.x, ``Twig_Loader_String`` is deprecated and will be removed in
  2.0. You can render a string via ``Twig_Environment::createTemplate()``.

Node Visitors
-------------

* Because of the removal of ``Twig_NodeInterface`` in 2.0, you need to extend
  ``Twig_BaseNodeVisitor`` instead of implementing ``Twig_NodeVisitorInterface``
  directly to make your node visitors compatible with both Twig 1.x and 2.x.

Globals
-------

* As of Twig 2.x, the ability to register a global variable after the runtime
  or the extensions have been initialized is not possible anymore (but
  changing the value of an already registered global is possible).

* As of Twig 1.x, using the ``_self`` global variable to get access to the
  current ``Twig_Template`` instance is deprecated; most usages only need the
  current template name, which will continue to work in Twig 2.0. In Twig 2.0,
  ``_self`` returns the current template name instead of the current
  ``Twig_Template`` instance.

Miscellaneous
-------------

* As of Twig 1.x, ``Twig_Environment::clearTemplateCache()``, ``Twig_Environment::writeCacheFile()``,
  ``Twig_Environment::clearCacheFiles()``, ``Twig_Environment::getCacheFilename()``, and
  ``Twig_Environment::getTemplateClassPrefix()`` are deprecated and will be removed in 2.0.

* As of Twig 1.x, ``Twig_Template::getEnvironment()`` and
  ``Twig_TemplateInterface::getEnvironment()`` are deprecated and will be
  removed in 2.0.
