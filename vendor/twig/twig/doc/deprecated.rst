Deprecated Features
===================

This document lists deprecated features in Twig 2.x. Deprecated features are
kept for backward compatibility and removed in the next major release (a
feature that was deprecated in Twig 2.x is removed in Twig 3.0).

Inheritance
-----------

* Defining a "block" definition in a non-capturing block in a child template is
  deprecated since Twig 2.5.0. In Twig 3.0, it will throw a
  ``Twig_Error_Syntax`` exception. It does not work anyway, so most projects
  won't need to do anything to upgrade.

Errors
------

 * Passing a string as the ``$source`` argument on ``Twig_Error`` constructor is
   deprecated since Twig 2.6.1. Pass an instance of ``Twig_Source`` instead.

Tags
----

* Using the ``spaceless`` tag at the root level of a child template is
  deprecated in Twig 2.5.0. This does not work as one would expect it to work
  anyway. In Twig 3.0, it will throw a ``Twig_Error_Syntax`` exception.

Final Classes
-------------

The following classes are marked as ``@final`` in Twig 2 and will be final in
3.0:

* ``Twig_Node_Module``
* ``Twig_Filter``
* ``Twig_Function``
* ``Twig_Test``
* ``Twig_Profiler_Profile``
