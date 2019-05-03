Twig for Developers
===================

This chapter describes the API to Twig and not the template language. It will
be most useful as reference to those implementing the template interface to
the application and not those who are creating Twig templates.

Basics
------

Twig uses a central object called the **environment** (of class
``\Twig\Environment``). Instances of this class are used to store the
configuration and extensions, and are used to load templates.

Most applications create one ``\Twig\Environment`` object on application
initialization and use that to load templates. In some cases, it might be useful
to have multiple environments side by side, with different configurations.

The typical way to configure Twig to load templates for an application looks
roughly like this::

    require_once '/path/to/vendor/autoload.php';

    $loader = new \Twig\Loader\FilesystemLoader('/path/to/templates');
    $twig = new \Twig\Environment($loader, [
        'cache' => '/path/to/compilation_cache',
    ]);

This creates a template environment with a default configuration and a loader
that looks up templates in the ``/path/to/templates/`` directory. Different
loaders are available and you can also write your own if you want to load
templates from a database or other resources.

.. note::

    Notice that the second argument of the environment is an array of options.
    The ``cache`` option is a compilation cache directory, where Twig caches
    the compiled templates to avoid the parsing phase for sub-sequent
    requests. It is very different from the cache you might want to add for
    the evaluated templates. For such a need, you can use any available PHP
    cache library.

Rendering Templates
-------------------

To load a template from a Twig environment, call the ``load()`` method which
returns a ``\Twig\TemplateWrapper`` instance::

    $template = $twig->load('index.html');

To render the template with some variables, call the ``render()`` method::

    echo $template->render(['the' => 'variables', 'go' => 'here']);

.. note::

    The ``display()`` method is a shortcut to output the rendered template.

You can also load and render the template in one fell swoop::

    echo $twig->render('index.html', ['the' => 'variables', 'go' => 'here']);

If a template defines blocks, they can be rendered individually via the
``renderBlock()`` call::

    echo $template->renderBlock('block_name', ['the' => 'variables', 'go' => 'here']);

.. _environment_options:

Environment Options
-------------------

When creating a new ``\Twig\Environment`` instance, you can pass an array of
options as the constructor second argument::

    $twig = new \Twig\Environment($loader, ['debug' => true]);

The following options are available:

* ``debug`` *boolean*

  When set to ``true``, the generated templates have a
  ``__toString()`` method that you can use to display the generated nodes
  (default to ``false``).

* ``charset`` *string* (defaults to ``utf-8``)

  The charset used by the templates.

* ``base_template_class`` *string* (defaults to ``\Twig\Template``)

  The base template class to use for generated
  templates.

* ``cache`` *string* or ``false``

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

* ``autoescape`` *string*

  Sets the default auto-escaping strategy (``name``, ``html``, ``js``, ``css``,
  ``url``, ``html_attr``, or a PHP callback that takes the template "filename"
  and returns the escaping strategy to use -- the callback cannot be a function
  name to avoid collision with built-in escaping strategies); set it to
  ``false`` to disable auto-escaping. The ``name`` escaping strategy determines
  the escaping strategy to use for a template based on the template filename
  extension (this strategy does not incur any overhead at runtime as
  auto-escaping is done at compilation time.)

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
the performance boost is even larger if you use a PHP accelerator such as
OPCache. See the ``cache`` and ``auto_reload`` options of ``\Twig\Environment``
above for more information.

Built-in Loaders
~~~~~~~~~~~~~~~~

Here is a list of the built-in loaders:

``\Twig\Loader\FilesystemLoader``
.................................

``\Twig\Loader\FilesystemLoader`` loads templates from the file system. This loader
can find templates in folders on the file system and is the preferred way to
load them::

    $loader = new \Twig\Loader\FilesystemLoader($templateDir);

It can also look for templates in an array of directories::

    $loader = new \Twig\Loader\FilesystemLoader([$templateDir1, $templateDir2]);

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

    $twig->render('@admin/index.html', []);

``\Twig\Loader\FilesystemLoader`` support absolute and relative paths. Using relative
paths is preferred as it makes the cache keys independent of the project root
directory (for instance, it allows warming the cache from a build server where
the directory might be different from the one used on production servers)::

    $loader = new \Twig\Loader\FilesystemLoader('templates', getcwd().'/..');

.. note::

    When not passing the root path as a second argument, Twig uses ``getcwd()``
    for relative paths.

``\Twig\Loader\ArrayLoader``
............................

``\Twig\Loader\ArrayLoader`` loads a template from a PHP array. It is passed an
array of strings bound to template names::

    $loader = new \Twig\Loader\ArrayLoader([
        'index.html' => 'Hello {{ name }}!',
    ]);
    $twig = new \Twig\Environment($loader);

    echo $twig->render('index.html', ['name' => 'Fabien']);

This loader is very useful for unit testing. It can also be used for small
projects where storing all templates in a single PHP file might make sense.

.. tip::

    When using the ``Array`` loader with a cache mechanism, you should know that
    a new cache key is generated each time a template content "changes" (the
    cache key being the source code of the template). If you don't want to see
    your cache grows out of control, you need to take care of clearing the old
    cache file by yourself.

``\Twig\Loader\ChainLoader``
............................

``\Twig\Loader\ChainLoader`` delegates the loading of templates to other loaders::

    $loader1 = new \Twig\Loader\ArrayLoader([
        'base.html' => '{% block content %}{% endblock %}',
    ]);
    $loader2 = new \Twig\Loader\ArrayLoader([
        'index.html' => '{% extends "base.html" %}{% block content %}Hello {{ name }}{% endblock %}',
        'base.html'  => 'Will never be loaded',
    ]);

    $loader = new \Twig\Loader\ChainLoader([$loader1, $loader2]);

    $twig = new \Twig\Environment($loader);

When looking for a template, Twig tries each loader in turn and returns as soon
as the template is found. When rendering the ``index.html`` template from the
above example, Twig will load it with ``$loader2`` but the ``base.html``
template will be loaded from ``$loader1``.

.. note::

    You can also add loaders via the ``addLoader()`` method.

Create your own Loader
~~~~~~~~~~~~~~~~~~~~~~

All loaders implement the ``\Twig\Loader\LoaderInterface``::

    interface \Twig\Loader\LoaderInterface
    {
        /**
         * Returns the source context for a given template logical name.
         *
         * @param string $name The template logical name
         *
         * @return \Twig\Source
         *
         * @throws \Twig\Error\LoaderError When $name is not found
         */
        public function getSourceContext($name);

        /**
         * Gets the cache key to use for the cache for a given template name.
         *
         * @param string $name The name of the template to load
         *
         * @return string The cache key
         *
         * @throws \Twig\Error\LoaderError When $name is not found
         */
        public function getCacheKey($name);

        /**
         * Returns true if the template is still fresh.
         *
         * @param string    $name The template name
         * @param timestamp $time The last modification time of the cached template
         *
         * @return bool    true if the template is fresh, false otherwise
         *
         * @throws \Twig\Error\LoaderError When $name is not found
         */
        public function isFresh($name, $time);

        /**
         * Check if we have the source code of a template, given its name.
         *
         * @param string $name The name of the template to check if we can load
         *
         * @return bool    If the template source code is handled by this loader or not
         */
        public function exists($name);
    }

The ``isFresh()`` method must return ``true`` if the current cached template
is still fresh, given the last modification time, or ``false`` otherwise.

The ``getSourceContext()`` method must return an instance of ``\Twig\Source``.

Using Extensions
----------------

Twig extensions are packages that add new features to Twig. Register an
extension via the ``addExtension()`` method::

    $twig->addExtension(new \Twig\Extension\SandboxExtension());

Twig comes bundled with the following extensions:

* *Twig\Extension\CoreExtension*: Defines all the core features of Twig.

* *Twig\Extension\DebugExtension*: Defines the ``dump`` function to help debug
  template variables.

* *Twig\Extension\EscaperExtension*: Adds automatic output-escaping and the
  possibility to escape/unescape blocks of code.

* *Twig\Extension\SandboxExtension*: Adds a sandbox mode to the default Twig
  environment, making it safe to evaluate untrusted code.

* *Twig\Extension\ProfilerExtension*: Enabled the built-in Twig profiler.

* *Twig\Extension\OptimizerExtension*: Optimizes the node tree before
  compilation.

* *Twig\Extension\StringLoaderExtension*: Defined the ``template_from_string``
   function to allow loading templates from string in a template.

The Core, Escaper, and Optimizer extensions are registered by default.

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

    $escaper = new \Twig\Extension\EscaperExtension('html');
    $twig->addExtension($escaper);

If set to ``html``, all variables in templates are escaped (using the ``html``
escaping strategy), except those using the ``raw`` filter:

.. code-block:: twig

    {{ article.to_html|raw }}

You can also change the escaping mode locally by using the ``autoescape`` tag:

.. code-block:: twig

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

  .. code-block:: twig

        {{ "Twig<br />" }} {# won't be escaped #}

        {% set text = "Twig<br />" %}
        {{ text }} {# will be escaped #}

* Expressions which the result is always a literal or a variable marked safe
  are never automatically escaped:

  .. code-block:: twig

        {{ foo ? "Twig<br />" : "<br />Twig" }} {# won't be escaped #}

        {% set text = "Twig<br />" %}
        {{ foo ? text : "<br />Twig" }} {# will be escaped #}

        {% set text = "Twig<br />" %}
        {{ foo ? text|raw : "<br />Twig" }} {# won't be escaped #}

        {% set text = "Twig<br />" %}
        {{ foo ? text|escape : "<br />Twig" }} {# the result of the expression won't be escaped #}

* Escaping is applied before printing, after any other filter is applied:

  .. code-block:: twig

        {{ var|upper }} {# is equivalent to {{ var|upper|escape }} #}

* The `raw` filter should only be used at the end of the filter chain:

  .. code-block:: twig

        {{ var|raw|upper }} {# will be escaped #}

        {{ var|upper|raw }} {# won't be escaped #}

* Automatic escaping is not applied if the last filter in the chain is marked
  safe for the current context (e.g. ``html`` or ``js``). ``escape`` and
  ``escape('html')`` are marked safe for HTML, ``escape('js')`` is marked
  safe for JavaScript, ``raw`` is marked safe for everything.

  .. code-block:: twig

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
``\Twig\Sandbox\SecurityPolicy``. This class allows you to white-list some
tags, filters, properties, and methods::

    $tags = ['if'];
    $filters = ['upper'];
    $methods = [
        'Article' => ['getTitle', 'getBody'],
    ];
    $properties = [
        'Article' => ['title', 'body'],
    ];
    $functions = ['range'];
    $policy = new \Twig\Sandbox\SecurityPolicy($tags, $filters, $methods, $properties, $functions);

With the previous configuration, the security policy will only allow usage of
the ``if`` tag, and the ``upper`` filter. Moreover, the templates will only be
able to call the ``getTitle()`` and ``getBody()`` methods on ``Article``
objects, and the ``title`` and ``body`` public properties. Everything else
won't be allowed and will generate a ``\Twig\Sandbox\SecurityError`` exception.

The policy object is the first argument of the sandbox constructor::

    $sandbox = new \Twig\Extension\SandboxExtension($policy);
    $twig->addExtension($sandbox);

By default, the sandbox mode is disabled and should be enabled when including
untrusted template code by using the ``sandbox`` tag:

.. code-block:: twig

    {% sandbox %}
        {% include 'user.html' %}
    {% endsandbox %}

You can sandbox all templates by passing ``true`` as the second argument of
the extension constructor::

    $sandbox = new \Twig\Extension\SandboxExtension($policy, true);

Profiler Extension
~~~~~~~~~~~~~~~~~~

The ``profiler`` extension enables a profiler for Twig templates; it should
only be used on your development machines as it adds some overhead::

    $profile = new \Twig\Profiler\Profile();
    $twig->addExtension(new \Twig\Extension\ProfilerExtension($profile));

    $dumper = new \Twig\Profiler\Dumper\TextDumper();
    echo $dumper->dump($profile);

A profile contains information about time and memory consumption for template,
block, and macro executions.

You can also dump the data in a `Blackfire.io <https://blackfire.io/>`_
compatible format::

    $dumper = new \Twig\Profiler\Dumper\BlackfireDumper();
    file_put_contents('/path/to/profile.prof', $dumper->dump($profile));

Upload the profile to visualize it (create a `free account
<https://blackfire.io/signup?utm_source=twig&utm_medium=doc&utm_campaign=profiler>`_
first):

.. code-block:: sh

    blackfire --slot=7 upload /path/to/profile.prof

Optimizer Extension
~~~~~~~~~~~~~~~~~~~

The ``optimizer`` extension optimizes the node tree before compilation::

    $twig->addExtension(new \Twig\Extension\OptimizerExtension());

By default, all optimizations are turned on. You can select the ones you want
to enable by passing them to the constructor::

    $optimizer = new \Twig\Extension\OptimizerExtension(\Twig\NodeVisitor\OptimizerNodeVisitor::OPTIMIZE_FOR);

    $twig->addExtension($optimizer);

Twig supports the following optimizations:

* ``\Twig\NodeVisitor\OptimizerNodeVisitor::OPTIMIZE_ALL``, enables all optimizations
  (this is the default value).

* ``\Twig\NodeVisitor\OptimizerNodeVisitor::OPTIMIZE_NONE``, disables all optimizations.
  This reduces the compilation time, but it can increase the execution time
  and the consumed memory.

* ``\Twig\NodeVisitor\OptimizerNodeVisitor::OPTIMIZE_FOR``, optimizes the ``for`` tag by
  removing the ``loop`` variable creation whenever possible.

* ``\Twig\NodeVisitor\OptimizerNodeVisitor::OPTIMIZE_RAW_FILTER``, removes the ``raw``
  filter whenever possible.

* ``\Twig\NodeVisitor\OptimizerNodeVisitor::OPTIMIZE_VAR_ACCESS``, simplifies the creation
  and access of variables in the compiled templates whenever possible.

Exceptions
----------

Twig can throw exceptions:

* ``\Twig\Error\Error``: The base exception for all errors.

* ``\Twig\Error\SyntaxError``: Thrown to tell the user that there is a problem with
  the template syntax.

* ``\Twig\Error\RuntimeError``: Thrown when an error occurs at runtime (when a filter
  does not exist for instance).

* ``\Twig\Error\LoaderError``: Thrown when an error occurs during template loading.

* ``\Twig\Sandbox\SecurityError``: Thrown when an unallowed tag, filter, or
  method is called in a sandboxed template.
