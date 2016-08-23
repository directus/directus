Twig for Developers
===================

This chapter describes the API to Twig and not the template language. It will
be most useful as reference to those implementing the template interface to
the application and not those who are creating Twig templates.

Basics
------

Twig uses a central object called the **environment** (of class
``Twig_Environment``). Instances of this class are used to store the
configuration and extensions, and are used to load templates from the file
system or other locations.

Most applications will create one ``Twig_Environment`` object on application
initialization and use that to load templates. In some cases it's however
useful to have multiple environments side by side, if different configurations
are in use.

The simplest way to configure Twig to load templates for your application
looks roughly like this::

    require_once '/path/to/lib/Twig/Autoloader.php';
    Twig_Autoloader::register();

    $loader = new Twig_Loader_Filesystem('/path/to/templates');
    $twig = new Twig_Environment($loader, array(
        'cache' => '/path/to/compilation_cache',
    ));

This will create a template environment with the default settings and a loader
that looks up the templates in the ``/path/to/templates/`` folder. Different
loaders are available and you can also write your own if you want to load
templates from a database or other resources.

.. note::

    Notice that the second argument of the environment is an array of options.
    The ``cache`` option is a compilation cache directory, where Twig caches
    the compiled templates to avoid the parsing phase for sub-sequent
    requests. It is very different from the cache you might want to add for
    the evaluated templates. For such a need, you can use any available PHP
    cache library.

To load a template from this environment you just have to call the
``loadTemplate()`` method which then returns a ``Twig_Template`` instance::

    $template = $twig->loadTemplate('index.html');

To render the template with some variables, call the ``render()`` method::

    echo $template->render(array('the' => 'variables', 'go' => 'here'));

.. note::

    The ``display()`` method is a shortcut to output the template directly.

You can also load and render the template in one fell swoop::

    echo $twig->render('index.html', array('the' => 'variables', 'go' => 'here'));

.. _environment_options:

Environment Options
-------------------

When creating a new ``Twig_Environment`` instance, you can pass an array of
options as the constructor second argument::

    $twig = new Twig_Environment($loader, array('debug' => true));

The following options are available:

* ``debug`` *boolean*

  When set to ``true``, the generated templates have a
  ``__toString()`` method that you can use to display the generated nodes
  (default to ``false``).

* ``charset`` *string (default to ``utf-8``)*

  The charset used by the templates.

* ``base_template_class`` *string (default to ``Twig_Template``)*

  The base template class to use for generated
  templates.

* ``cache`` *string|false*

  An absolute path where to store the compiled templates, or
  ``false`` to disable caching (which is the default).

* ``auto_reload`` *boolean*

  When developing with Twig, it's useful to recompile the
  template whenever the source code changes. If you don't provide a value for
  the ``auto_reload`` option, it will be determined automatically based on the
  ``debug`` value.

* ``strict_variables`` *boolean*

  If set to ``false``, Twig will silently ignore invalid
  variables (variables and or attributes/methods that do not exist) and
  replace them with a ``null`` value. When set to ``true``, Twig throws an
  exception instead (default to ``false``).

* ``autoescape`` *string|boolean*

  If set to ``true``, HTML auto-escaping will be enabled by
  default for all templates (default to ``true``).

  As of Twig 1.8, you can set the escaping strategy to use (``html``, ``js``,
  ``false`` to disable).

  As of Twig 1.9, you can set the escaping strategy to use (``css``, ``url``,
  ``html_attr``, or a PHP callback that takes the template "filename" and must
  return the escaping strategy to use -- the callback cannot be a function name
  to avoid collision with built-in escaping strategies).

  As of Twig 1.17, the ``filename`` escaping strategy determines the escaping
  strategy to use for a template based on the template filename extension (this
  strategy does not incur any overhead at runtime as auto-escaping is done at
  compilation time.)

* ``optimizations`` *integer*

  A flag that indicates which optimizations to apply
  (default to ``-1`` -- all optimizations are enabled; set it to ``0`` to
  disable).

Loaders
-------

Loaders are responsible for loading templates from a resource such as the file
system.

Compilation Cache
~~~~~~~~~~~~~~~~~

All template loaders can cache the compiled templates on the filesystem for
future reuse. It speeds up Twig a lot as templates are only compiled once; and
the performance boost is even larger if you use a PHP accelerator such as APC.
See the ``cache`` and ``auto_reload`` options of ``Twig_Environment`` above
for more information.

Built-in Loaders
~~~~~~~~~~~~~~~~

Here is a list of the built-in loaders Twig provides:

``Twig_Loader_Filesystem``
..........................

.. versionadded:: 1.10
    The ``prependPath()`` and support for namespaces were added in Twig 1.10.

``Twig_Loader_Filesystem`` loads templates from the file system. This loader
can find templates in folders on the file system and is the preferred way to
load them::

    $loader = new Twig_Loader_Filesystem($templateDir);

It can also look for templates in an array of directories::

    $loader = new Twig_Loader_Filesystem(array($templateDir1, $templateDir2));

With such a configuration, Twig will first look for templates in
``$templateDir1`` and if they do not exist, it will fallback to look for them
in the ``$templateDir2``.

You can add or prepend paths via the ``addPath()`` and ``prependPath()``
methods::

    $loader->addPath($templateDir3);
    $loader->prependPath($templateDir4);

The filesystem loader also supports namespaced templates. This allows to group
your templates under different namespaces which have their own template paths.

When using the ``setPaths()``, ``addPath()``, and ``prependPath()`` methods,
specify the namespace as the second argument (when not specified, these
methods act on the "main" namespace)::

    $loader->addPath($templateDir, 'admin');

Namespaced templates can be accessed via the special
``@namespace_name/template_path`` notation::

    $twig->render('@admin/index.html', array());

``Twig_Loader_Array``
.....................

``Twig_Loader_Array`` loads a template from a PHP array. It's passed an array
of strings bound to template names::

    $loader = new Twig_Loader_Array(array(
        'index.html' => 'Hello {{ name }}!',
    ));
    $twig = new Twig_Environment($loader);

    echo $twig->render('index.html', array('name' => 'Fabien'));

This loader is very useful for unit testing. It can also be used for small
projects where storing all templates in a single PHP file might make sense.

.. tip::

    When using the ``Array`` or ``String`` loaders with a cache mechanism, you
    should know that a new cache key is generated each time a template content
    "changes" (the cache key being the source code of the template). If you
    don't want to see your cache grows out of control, you need to take care
    of clearing the old cache file by yourself.

``Twig_Loader_Chain``
.....................

``Twig_Loader_Chain`` delegates the loading of templates to other loaders::

    $loader1 = new Twig_Loader_Array(array(
        'base.html' => '{% block content %}{% endblock %}',
    ));
    $loader2 = new Twig_Loader_Array(array(
        'index.html' => '{% extends "base.html" %}{% block content %}Hello {{ name }}{% endblock %}',
        'base.html'  => 'Will never be loaded',
    ));

    $loader = new Twig_Loader_Chain(array($loader1, $loader2));

    $twig = new Twig_Environment($loader);

When looking for a template, Twig will try each loader in turn and it will
return as soon as the template is found. When rendering the ``index.html``
template from the above example, Twig will load it with ``$loader2`` but the
``base.html`` template will be loaded from ``$loader1``.

``Twig_Loader_Chain`` accepts any loader that implements
``Twig_LoaderInterface``.

.. note::

    You can also add loaders via the ``addLoader()`` method.

Create your own Loader
~~~~~~~~~~~~~~~~~~~~~~

All loaders implement the ``Twig_LoaderInterface``::

    interface Twig_LoaderInterface
    {
        /**
         * Gets the source code of a template, given its name.
         *
         * @param  string $name string The name of the template to load
         *
         * @return string The template source code
         */
        function getSource($name);

        /**
         * Gets the cache key to use for the cache for a given template name.
         *
         * @param  string $name string The name of the template to load
         *
         * @return string The cache key
         */
        function getCacheKey($name);

        /**
         * Returns true if the template is still fresh.
         *
         * @param string    $name The template name
         * @param timestamp $time The last modification time of the cached template
         */
        function isFresh($name, $time);
    }

The ``isFresh()`` method must return ``true`` if the current cached template
is still fresh, given the last modification time, or ``false`` otherwise.

.. tip::

    As of Twig 1.11.0, you can also implement ``Twig_ExistsLoaderInterface``
    to make your loader faster when used with the chain loader.

Using Extensions
----------------

Twig extensions are packages that add new features to Twig. Using an
extension is as simple as using the ``addExtension()`` method::

    $twig->addExtension(new Twig_Extension_Sandbox());

Twig comes bundled with the following extensions:

* *Twig_Extension_Core*: Defines all the core features of Twig.

* *Twig_Extension_Escaper*: Adds automatic output-escaping and the possibility
  to escape/unescape blocks of code.

* *Twig_Extension_Sandbox*: Adds a sandbox mode to the default Twig
  environment, making it safe to evaluate untrusted code.

* *Twig_Extension_Profiler*: Enabled the built-in Twig profiler (as of Twig
  1.18).

* *Twig_Extension_Optimizer*: Optimizes the node tree before compilation.

The core, escaper, and optimizer extensions do not need to be added to the
Twig environment, as they are registered by default.

Built-in Extensions
-------------------

This section describes the features added by the built-in extensions.

.. tip::

    Read the chapter about extending Twig to learn how to create your own
    extensions.

Core Extension
~~~~~~~~~~~~~~

The ``core`` extension defines all the core features of Twig:

* :doc:`Tags <tags/index>`;
* :doc:`Filters <filters/index>`;
* :doc:`Functions <functions/index>`;
* :doc:`Tests <tests/index>`.

Escaper Extension
~~~~~~~~~~~~~~~~~

The ``escaper`` extension adds automatic output escaping to Twig. It defines a
tag, ``autoescape``, and a filter, ``raw``.

When creating the escaper extension, you can switch on or off the global
output escaping strategy::

    $escaper = new Twig_Extension_Escaper('html');
    $twig->addExtension($escaper);

If set to ``html``, all variables in templates are escaped (using the ``html``
escaping strategy), except those using the ``raw`` filter:

.. code-block:: jinja

    {{ article.to_html|raw }}

You can also change the escaping mode locally by using the ``autoescape`` tag
(see the :doc:`autoescape<tags/autoescape>` doc for the syntax used before
Twig 1.8):

.. code-block:: jinja

    {% autoescape 'html' %}
        {{ var }}
        {{ var|raw }}      {# var won't be escaped #}
        {{ var|escape }}   {# var won't be double-escaped #}
    {% endautoescape %}

.. warning::

    The ``autoescape`` tag has no effect on included files.

The escaping rules are implemented as follows:

* Literals (integers, booleans, arrays, ...) used in the template directly as
  variables or filter arguments are never automatically escaped:

  .. code-block:: jinja

        {{ "Twig<br />" }} {# won't be escaped #}

        {% set text = "Twig<br />" %}
        {{ text }} {# will be escaped #}

* Expressions which the result is always a literal or a variable marked safe
  are never automatically escaped:

  .. code-block:: jinja

        {{ foo ? "Twig<br />" : "<br />Twig" }} {# won't be escaped #}

        {% set text = "Twig<br />" %}
        {{ foo ? text : "<br />Twig" }} {# will be escaped #}

        {% set text = "Twig<br />" %}
        {{ foo ? text|raw : "<br />Twig" }} {# won't be escaped #}

        {% set text = "Twig<br />" %}
        {{ foo ? text|escape : "<br />Twig" }} {# the result of the expression won't be escaped #}

* Escaping is applied before printing, after any other filter is applied:

  .. code-block:: jinja

        {{ var|upper }} {# is equivalent to {{ var|upper|escape }} #}

* The `raw` filter should only be used at the end of the filter chain:

  .. code-block:: jinja

        {{ var|raw|upper }} {# will be escaped #}

        {{ var|upper|raw }} {# won't be escaped #}

* Automatic escaping is not applied if the last filter in the chain is marked
  safe for the current context (e.g. ``html`` or ``js``). ``escape`` and
  ``escape('html')`` are marked safe for HTML, ``escape('js')`` is marked
  safe for JavaScript, ``raw`` is marked safe for everything.

  .. code-block:: jinja

        {% autoescape 'js' %}
            {{ var|escape('html') }} {# will be escaped for HTML and JavaScript #}
            {{ var }} {# will be escaped for JavaScript #}
            {{ var|escape('js') }} {# won't be double-escaped #}
        {% endautoescape %}

.. note::

    Note that autoescaping has some limitations as escaping is applied on
    expressions after evaluation. For instance, when working with
    concatenation, ``{{ foo|raw ~ bar }}`` won't give the expected result as
    escaping is applied on the result of the concatenation, not on the
    individual variables (so, the ``raw`` filter won't have any effect here).

Sandbox Extension
~~~~~~~~~~~~~~~~~

The ``sandbox`` extension can be used to evaluate untrusted code. Access to
unsafe attributes and methods is prohibited. The sandbox security is managed
by a policy instance. By default, Twig comes with one policy class:
``Twig_Sandbox_SecurityPolicy``. This class allows you to white-list some
tags, filters, properties, and methods::

    $tags = array('if');
    $filters = array('upper');
    $methods = array(
        'Article' => array('getTitle', 'getBody'),
    );
    $properties = array(
        'Article' => array('title', 'body'),
    );
    $functions = array('range');
    $policy = new Twig_Sandbox_SecurityPolicy($tags, $filters, $methods, $properties, $functions);

With the previous configuration, the security policy will only allow usage of
the ``if`` tag, and the ``upper`` filter. Moreover, the templates will only be
able to call the ``getTitle()`` and ``getBody()`` methods on ``Article``
objects, and the ``title`` and ``body`` public properties. Everything else
won't be allowed and will generate a ``Twig_Sandbox_SecurityError`` exception.

The policy object is the first argument of the sandbox constructor::

    $sandbox = new Twig_Extension_Sandbox($policy);
    $twig->addExtension($sandbox);

By default, the sandbox mode is disabled and should be enabled when including
untrusted template code by using the ``sandbox`` tag:

.. code-block:: jinja

    {% sandbox %}
        {% include 'user.html' %}
    {% endsandbox %}

You can sandbox all templates by passing ``true`` as the second argument of
the extension constructor::

    $sandbox = new Twig_Extension_Sandbox($policy, true);

Profiler Extension
~~~~~~~~~~~~~~~~~~

.. versionadded:: 1.18
    The Profile extension was added in Twig 1.18.

The ``profiler`` extension enables a profiler for Twig templates; it should
only be used on your development machines as it adds some overhead::

    $profile = new Twig_Profiler_Profile();
    $twig->addExtension(new Twig_Extension_Profiler($profile));

    $dumper = new Twig_Profiler_Dumper_Text();
    echo $dumper->dump($profile);

A profile contains information about time and memory consumption for template,
block, and macro executions.

You can also dump the data in a `Blackfire.io <https://blackfire.io/>`_
compatible format::

    $dumper = new Twig_Profiler_Dumper_Blackfire();
    file_put_contents('/path/to/profile.prof', $dumper->dump($profile));

Upload the profile to visualize it (create a `free account
<https://blackfire.io/signup>`_ first):

.. code-block:: sh

    blackfire --slot=7 upload /path/to/profile.prof

Optimizer Extension
~~~~~~~~~~~~~~~~~~~

The ``optimizer`` extension optimizes the node tree before compilation::

    $twig->addExtension(new Twig_Extension_Optimizer());

By default, all optimizations are turned on. You can select the ones you want
to enable by passing them to the constructor::

    $optimizer = new Twig_Extension_Optimizer(Twig_NodeVisitor_Optimizer::OPTIMIZE_FOR);

    $twig->addExtension($optimizer);

Twig supports the following optimizations:

* ``Twig_NodeVisitor_Optimizer::OPTIMIZE_ALL``, enables all optimizations
  (this is the default value).
* ``Twig_NodeVisitor_Optimizer::OPTIMIZE_NONE``, disables all optimizations.
  This reduces the compilation time, but it can increase the execution time
  and the consumed memory.
* ``Twig_NodeVisitor_Optimizer::OPTIMIZE_FOR``, optimizes the ``for`` tag by
  removing the ``loop`` variable creation whenever possible.
* ``Twig_NodeVisitor_Optimizer::OPTIMIZE_RAW_FILTER``, removes the ``raw``
  filter whenever possible.
* ``Twig_NodeVisitor_Optimizer::OPTIMIZE_VAR_ACCESS``, simplifies the creation
  and access of variables in the compiled templates whenever possible.

Exceptions
----------

Twig can throw exceptions:

* ``Twig_Error``: The base exception for all errors.

* ``Twig_Error_Syntax``: Thrown to tell the user that there is a problem with
  the template syntax.

* ``Twig_Error_Runtime``: Thrown when an error occurs at runtime (when a filter
  does not exist for instance).

* ``Twig_Error_Loader``: Thrown when an error occurs during template loading.

* ``Twig_Sandbox_SecurityError``: Thrown when an unallowed tag, filter, or
  method is called in a sandboxed template.
