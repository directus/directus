Deprecated Features
===================

This document lists deprecated features in Twig 2.x. Deprecated features are
kept for backward compatibility and removed in the next major release (a
feature that was deprecated in Twig 2.x is removed in Twig 3.0).

PSR-0
-----

* PSR-0 classes are deprecated in favor of namespaced ones since Twig 2.7.

Inheritance
-----------

* Defining a "block" definition in a non-capturing block in a child template is
  deprecated since Twig 2.5.0. In Twig 3.0, it will throw a
  ``Twig\Error\SyntaxError`` exception. It does not work anyway, so most
  projects won't need to do anything to upgrade.

Errors
------

 * Passing a string as the ``$source`` argument on ``\Twig\Error\Error`` /
   ``Twig\Error\Error`` constructor is deprecated since Twig 2.6.1. Pass an
   instance of ``Twig\Source`` instead.

Tags
----

* The ``spaceless`` tag is deprecated in Twig 2.7. Use the ``spaceless`` filter
  instead or ``{% apply spaceless %}`` (the ``Twig\Node\SpacelessNode`` and
  ``Twig\TokenParser\SpacelessTokenParser`` classes are also deprecated).

* Using the ``spaceless`` tag at the root level of a child template is
  deprecated in Twig 2.5.0. This does not work as one would expect it to work
  anyway. In Twig 3.0, it will throw a ``Twig\Error\SyntaxError`` exception.

* The ``filter`` tag is deprecated in Twig 2.9. Use the ``apply`` tag instead
  (the ``Twig\TokenParser\FilterTokenParser`` classes is also deprecated).

* Adding an ``if`` condition on a ``for`` tag is deprecated in Twig 2.10. Use a
  ``filter`` filter or an "if" condition inside the "for" body instead (if your condition
  depends on a variable updated inside the loop)

Final Classes
-------------

The following classes are marked as ``@final`` in Twig 2 and will be final in
3.0:

* ``Twig\Node\ModuleNode``
* ``Twig\TwigFilter``
* ``Twig\TwigFunction``
* ``Twig\TwigTest``
* ``Twig\Profiler\Profile``

Parser
------

* As of Twig 2.7, the ``\Twig\Parser::isReservedMacroName()`` / ``Twig\Parser``
  function is deprecated and will be removed in Twig 3.0. It always returns
  ``false`` anyway as Twig 2 does not have any reserved macro names.

Environment
-----------

* As of Twig 2.7, the ``base_template_class`` option on ``Twig\Environment`` is
  deprecated and will be removed in Twig 3.0.

* As of Twig 2.7, the ``Twig\Environment::getBaseTemplateClass()`` and
  ``Twig\Environment::setBaseTemplateClass()`` methods are deprecated and will
  be removed in Twig 3.0.

* As of Twig 2.7, the ``Twig\Environment::getTemplateClass()`` is marked as
  being internal and should not be used.

* As of Twig 2.7, passing a ``Twig\Template`` instance to the
  ``Twig\Environment::load()`` and ``Twig\Environment::resolveTemplate()`` is
  deprecated.

* Depending on the input, ``Twig\Environment::resolveTemplate()`` can return
  a ``Twig\Template`` or a ``Twig\TemplateWrapper`` instance. In Twig 3.0, this
  method will **always** return a ``Twig\TemplateWrapper`` instance. You should
  only rely on the methods of this class if you want to be forward-compatible.

Interfaces
----------

* As of Twig 2.7, the empty ``Twig\Loader\ExistsLoaderInterface`` interface is
  deprecated and will be removed in Twig 3.0.

* As of Twig 2.7, the ``Twig\Extension\InitRuntimeInterface`` interface is
  deprecated and will be removed in Twig 3.0.

Miscellaneous
-------------

* As of Twig 2.7, the ``Twig_SimpleFilter``, ``Twig_SimpleFunction``, and
  ``Twig_SimpleTest`` empty classes are deprecated and will be removed in Twig
  3.0. Use ``Twig\TwigFilter``, ``Twig\TwigFunction``, and ``Twig\TwigTest``
  respectively.

* As of Twig 2.8.2, all usage of
  ``Twig\Loader\FilesystemLoader::findTemplate()`` check for a ``null`` return
  value (same meaning as returning ``false``). If you are overidding
  ``Twig\Loader\FilesystemLoader::findTemplate()``, you must return ``null`` instead of ``false``
  to be compatible with Twig 3.0.
