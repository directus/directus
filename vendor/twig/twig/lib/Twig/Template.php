<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 * (c) Armin Ronacher
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Default base class for compiled templates.
 *
 * This class is an implementation detail of how template compilation currently
 * works, which might change. It should never be used directly. Use $twig->load()
 * instead, which returns an instance of Twig_TemplateWrapper.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 *
 * @internal
 */
abstract class Twig_Template implements Twig_TemplateInterface
{
    /**
     * @internal
     */
    protected static $cache = array();

    protected $parent;
    protected $parents = array();
    protected $env;
    protected $blocks = array();
    protected $traits = array();

    public function __construct(Twig_Environment $env)
    {
        $this->env = $env;
    }

    /**
     * @internal this method will be removed in 2.0 and is only used internally to provide an upgrade path from 1.x to 2.0
     */
    public function __toString()
    {
        return $this->getTemplateName();
    }

    /**
     * Returns the template name.
     *
     * @return string The template name
     */
    abstract public function getTemplateName();

    /**
     * Returns debug information about the template.
     *
     * @return array Debug information
     *
     * @internal
     */
    public function getDebugInfo()
    {
        return array();
    }

    /**
     * Returns the template source code.
     *
     * @return string The template source code
     *
     * @deprecated since 1.27 (to be removed in 2.0). Use getSourceContext() instead
     */
    public function getSource()
    {
        @trigger_error('The '.__METHOD__.' method is deprecated since version 1.27 and will be removed in 2.0. Use getSourceContext() instead.', E_USER_DEPRECATED);

        return '';
    }

    /**
     * Returns information about the original template source code.
     *
     * @return Twig_Source
     */
    public function getSourceContext()
    {
        return new Twig_Source('', $this->getTemplateName());
    }

    /**
     * @deprecated since 1.20 (to be removed in 2.0)
     */
    public function getEnvironment()
    {
        @trigger_error('The '.__METHOD__.' method is deprecated since version 1.20 and will be removed in 2.0.', E_USER_DEPRECATED);

        return $this->env;
    }

    /**
     * Returns the parent template.
     *
     * This method is for internal use only and should never be called
     * directly.
     *
     * @param array $context
     *
     * @return Twig_TemplateInterface|false The parent template or false if there is no parent
     *
     * @internal
     */
    public function getParent(array $context)
    {
        if (null !== $this->parent) {
            return $this->parent;
        }

        try {
            $parent = $this->doGetParent($context);

            if (false === $parent) {
                return false;
            }

            if ($parent instanceof self) {
                return $this->parents[$parent->getTemplateName()] = $parent;
            }

            if (!isset($this->parents[$parent])) {
                $this->parents[$parent] = $this->loadTemplate($parent);
            }
        } catch (Twig_Error_Loader $e) {
            $e->setSourceContext(null);
            $e->guess();

            throw $e;
        }

        return $this->parents[$parent];
    }

    protected function doGetParent(array $context)
    {
        return false;
    }

    public function isTraitable()
    {
        return true;
    }

    /**
     * Displays a parent block.
     *
     * This method is for internal use only and should never be called
     * directly.
     *
     * @param string $name    The block name to display from the parent
     * @param array  $context The context
     * @param array  $blocks  The current set of blocks
     *
     * @internal
     */
    public function displayParentBlock($name, array $context, array $blocks = array())
    {
        $name = (string) $name;

        if (isset($this->traits[$name])) {
            $this->traits[$name][0]->displayBlock($name, $context, $blocks, false);
        } elseif (false !== $parent = $this->getParent($context)) {
            $parent->displayBlock($name, $context, $blocks, false);
        } else {
            throw new Twig_Error_Runtime(sprintf('The template has no parent and no traits defining the "%s" block.', $name), -1, $this->getSourceContext());
        }
    }

    /**
     * Displays a block.
     *
     * This method is for internal use only and should never be called
     * directly.
     *
     * @param string $name      The block name to display
     * @param array  $context   The context
     * @param array  $blocks    The current set of blocks
     * @param bool   $useBlocks Whether to use the current set of blocks
     *
     * @internal
     */
    public function displayBlock($name, array $context, array $blocks = array(), $useBlocks = true)
    {
        $name = (string) $name;

        if ($useBlocks && isset($blocks[$name])) {
            $template = $blocks[$name][0];
            $block = $blocks[$name][1];
        } elseif (isset($this->blocks[$name])) {
            $template = $this->blocks[$name][0];
            $block = $this->blocks[$name][1];
        } else {
            $template = null;
            $block = null;
        }

        // avoid RCEs when sandbox is enabled
        if (null !== $template && !$template instanceof self) {
            throw new LogicException('A block must be a method on a Twig_Template instance.');
        }

        if (null !== $template) {
            try {
                $template->$block($context, $blocks);
            } catch (Twig_Error $e) {
                if (!$e->getSourceContext()) {
                    $e->setSourceContext($template->getSourceContext());
                }

                // this is mostly useful for Twig_Error_Loader exceptions
                // see Twig_Error_Loader
                if (false === $e->getTemplateLine()) {
                    $e->setTemplateLine(-1);
                    $e->guess();
                }

                throw $e;
            } catch (Exception $e) {
                throw new Twig_Error_Runtime(sprintf('An exception has been thrown during the rendering of a template ("%s").', $e->getMessage()), -1, $template->getSourceContext(), $e);
            }
        } elseif (false !== $parent = $this->getParent($context)) {
            $parent->displayBlock($name, $context, array_merge($this->blocks, $blocks), false);
        } else {
            @trigger_error(sprintf('Silent display of undefined block "%s" in template "%s" is deprecated since version 1.29 and will throw an exception in 2.0. Use the "block(\'%s\') is defined" expression to test for block existence.', $name, $this->getTemplateName(), $name), E_USER_DEPRECATED);
        }
    }

    /**
     * Renders a parent block.
     *
     * This method is for internal use only and should never be called
     * directly.
     *
     * @param string $name    The block name to render from the parent
     * @param array  $context The context
     * @param array  $blocks  The current set of blocks
     *
     * @return string The rendered block
     *
     * @internal
     */
    public function renderParentBlock($name, array $context, array $blocks = array())
    {
        ob_start();
        $this->displayParentBlock($name, $context, $blocks);

        return ob_get_clean();
    }

    /**
     * Renders a block.
     *
     * This method is for internal use only and should never be called
     * directly.
     *
     * @param string $name      The block name to render
     * @param array  $context   The context
     * @param array  $blocks    The current set of blocks
     * @param bool   $useBlocks Whether to use the current set of blocks
     *
     * @return string The rendered block
     *
     * @internal
     */
    public function renderBlock($name, array $context, array $blocks = array(), $useBlocks = true)
    {
        ob_start();
        $this->displayBlock($name, $context, $blocks, $useBlocks);

        return ob_get_clean();
    }

    /**
     * Returns whether a block exists or not in the current context of the template.
     *
     * This method checks blocks defined in the current template
     * or defined in "used" traits or defined in parent templates.
     *
     * @param string $name    The block name
     * @param array  $context The context
     * @param array  $blocks  The current set of blocks
     *
     * @return bool true if the block exists, false otherwise
     *
     * @internal
     */
    public function hasBlock($name, array $context = null, array $blocks = array())
    {
        if (null === $context) {
            @trigger_error('The '.__METHOD__.' method is internal and should never be called; calling it directly is deprecated since version 1.28 and won\'t be possible anymore in 2.0.', E_USER_DEPRECATED);

            return isset($this->blocks[(string) $name]);
        }

        if (isset($blocks[$name])) {
            return $blocks[$name][0] instanceof self;
        }

        if (isset($this->blocks[$name])) {
            return true;
        }

        if (false !== $parent = $this->getParent($context)) {
            return $parent->hasBlock($name, $context);
        }

        return false;
    }

    /**
     * Returns all block names in the current context of the template.
     *
     * This method checks blocks defined in the current template
     * or defined in "used" traits or defined in parent templates.
     *
     * @param array $context The context
     * @param array $blocks  The current set of blocks
     *
     * @return array An array of block names
     *
     * @internal
     */
    public function getBlockNames(array $context = null, array $blocks = array())
    {
        if (null === $context) {
            @trigger_error('The '.__METHOD__.' method is internal and should never be called; calling it directly is deprecated since version 1.28 and won\'t be possible anymore in 2.0.', E_USER_DEPRECATED);

            return array_keys($this->blocks);
        }

        $names = array_merge(array_keys($blocks), array_keys($this->blocks));

        if (false !== $parent = $this->getParent($context)) {
            $names = array_merge($names, $parent->getBlockNames($context));
        }

        return array_unique($names);
    }

    protected function loadTemplate($template, $templateName = null, $line = null, $index = null)
    {
        try {
            if (is_array($template)) {
                return $this->env->resolveTemplate($template);
            }

            if ($template instanceof self) {
                return $template;
            }

            if ($template instanceof Twig_TemplateWrapper) {
                return $template;
            }

            return $this->env->loadTemplate($template, $index);
        } catch (Twig_Error $e) {
            if (!$e->getSourceContext()) {
                $e->setSourceContext($templateName ? new Twig_Source('', $templateName) : $this->getSourceContext());
            }

            if ($e->getTemplateLine()) {
                throw $e;
            }

            if (!$line) {
                $e->guess();
            } else {
                $e->setTemplateLine($line);
            }

            throw $e;
        }
    }

    /**
     * Returns all blocks.
     *
     * This method is for internal use only and should never be called
     * directly.
     *
     * @return array An array of blocks
     *
     * @internal
     */
    public function getBlocks()
    {
        return $this->blocks;
    }

    public function display(array $context, array $blocks = array())
    {
        $this->displayWithErrorHandling($this->env->mergeGlobals($context), array_merge($this->blocks, $blocks));
    }

    public function render(array $context)
    {
        $level = ob_get_level();
        ob_start();
        try {
            $this->display($context);
        } catch (Exception $e) {
            while (ob_get_level() > $level) {
                ob_end_clean();
            }

            throw $e;
        } catch (Throwable $e) {
            while (ob_get_level() > $level) {
                ob_end_clean();
            }

            throw $e;
        }

        return ob_get_clean();
    }

    protected function displayWithErrorHandling(array $context, array $blocks = array())
    {
        try {
            $this->doDisplay($context, $blocks);
        } catch (Twig_Error $e) {
            if (!$e->getSourceContext()) {
                $e->setSourceContext($this->getSourceContext());
            }

            // this is mostly useful for Twig_Error_Loader exceptions
            // see Twig_Error_Loader
            if (false === $e->getTemplateLine()) {
                $e->setTemplateLine(-1);
                $e->guess();
            }

            throw $e;
        } catch (Exception $e) {
            throw new Twig_Error_Runtime(sprintf('An exception has been thrown during the rendering of a template ("%s").', $e->getMessage()), -1, $this->getSourceContext(), $e);
        }
    }

    /**
     * Auto-generated method to display the template with the given context.
     *
     * @param array $context An array of parameters to pass to the template
     * @param array $blocks  An array of blocks to pass to the template
     */
    abstract protected function doDisplay(array $context, array $blocks = array());

    /**
     * Returns a variable from the context.
     *
     * This method is for internal use only and should never be called
     * directly.
     *
     * This method should not be overridden in a sub-class as this is an
     * implementation detail that has been introduced to optimize variable
     * access for versions of PHP before 5.4. This is not a way to override
     * the way to get a variable value.
     *
     * @param array  $context           The context
     * @param string $item              The variable to return from the context
     * @param bool   $ignoreStrictCheck Whether to ignore the strict variable check or not
     *
     * @return mixed The content of the context variable
     *
     * @throws Twig_Error_Runtime if the variable does not exist and Twig is running in strict mode
     *
     * @internal
     */
    final protected function getContext($context, $item, $ignoreStrictCheck = false)
    {
        if (!array_key_exists($item, $context)) {
            if ($ignoreStrictCheck || !$this->env->isStrictVariables()) {
                return;
            }

            throw new Twig_Error_Runtime(sprintf('Variable "%s" does not exist.', $item), -1, $this->getSourceContext());
        }

        return $context[$item];
    }

    /**
     * Returns the attribute value for a given array/object.
     *
     * @param mixed  $object            The object or array from where to get the item
     * @param mixed  $item              The item to get from the array or object
     * @param array  $arguments         An array of arguments to pass if the item is an object method
     * @param string $type              The type of attribute (@see Twig_Template constants)
     * @param bool   $isDefinedTest     Whether this is only a defined check
     * @param bool   $ignoreStrictCheck Whether to ignore the strict attribute check or not
     *
     * @return mixed The attribute value, or a Boolean when $isDefinedTest is true, or null when the attribute is not set and $ignoreStrictCheck is true
     *
     * @throws Twig_Error_Runtime if the attribute does not exist and Twig is running in strict mode and $isDefinedTest is false
     *
     * @internal
     */
    protected function getAttribute($object, $item, array $arguments = array(), $type = self::ANY_CALL, $isDefinedTest = false, $ignoreStrictCheck = false)
    {
        // array
        if (self::METHOD_CALL !== $type) {
            $arrayItem = is_bool($item) || is_float($item) ? (int) $item : $item;

            if ((is_array($object) && (isset($object[$arrayItem]) || array_key_exists($arrayItem, $object)))
                || ($object instanceof ArrayAccess && isset($object[$arrayItem]))
            ) {
                if ($isDefinedTest) {
                    return true;
                }

                return $object[$arrayItem];
            }

            if (self::ARRAY_CALL === $type || !is_object($object)) {
                if ($isDefinedTest) {
                    return false;
                }

                if ($ignoreStrictCheck || !$this->env->isStrictVariables()) {
                    return;
                }

                if ($object instanceof ArrayAccess) {
                    $message = sprintf('Key "%s" in object with ArrayAccess of class "%s" does not exist.', $arrayItem, get_class($object));
                } elseif (is_object($object)) {
                    $message = sprintf('Impossible to access a key "%s" on an object of class "%s" that does not implement ArrayAccess interface.', $item, get_class($object));
                } elseif (is_array($object)) {
                    if (empty($object)) {
                        $message = sprintf('Key "%s" does not exist as the array is empty.', $arrayItem);
                    } else {
                        $message = sprintf('Key "%s" for array with keys "%s" does not exist.', $arrayItem, implode(', ', array_keys($object)));
                    }
                } elseif (self::ARRAY_CALL === $type) {
                    if (null === $object) {
                        $message = sprintf('Impossible to access a key ("%s") on a null variable.', $item);
                    } else {
                        $message = sprintf('Impossible to access a key ("%s") on a %s variable ("%s").', $item, gettype($object), $object);
                    }
                } elseif (null === $object) {
                    $message = sprintf('Impossible to access an attribute ("%s") on a null variable.', $item);
                } else {
                    $message = sprintf('Impossible to access an attribute ("%s") on a %s variable ("%s").', $item, gettype($object), $object);
                }

                throw new Twig_Error_Runtime($message, -1, $this->getSourceContext());
            }
        }

        if (!is_object($object)) {
            if ($isDefinedTest) {
                return false;
            }

            if ($ignoreStrictCheck || !$this->env->isStrictVariables()) {
                return;
            }

            if (null === $object) {
                $message = sprintf('Impossible to invoke a method ("%s") on a null variable.', $item);
            } else {
                $message = sprintf('Impossible to invoke a method ("%s") on a %s variable ("%s").', $item, gettype($object), $object);
            }

            throw new Twig_Error_Runtime($message, -1, $this->getSourceContext());
        }

        // object property
        if (self::METHOD_CALL !== $type && !$object instanceof self) { // Twig_Template does not have public properties, and we don't want to allow access to internal ones
            if (isset($object->$item) || array_key_exists((string) $item, $object)) {
                if ($isDefinedTest) {
                    return true;
                }

                if ($this->env->hasExtension('Twig_Extension_Sandbox')) {
                    $this->env->getExtension('Twig_Extension_Sandbox')->checkPropertyAllowed($object, $item);
                }

                return $object->$item;
            }
        }

        $class = get_class($object);

        // object method
        if (!isset(self::$cache[$class])) {
            // get_class_methods returns all methods accessible in the scope, but we only want public ones to be accessible in templates
            if ($object instanceof self) {
                $ref = new ReflectionClass($class);
                $methods = array();

                foreach ($ref->getMethods(ReflectionMethod::IS_PUBLIC) as $refMethod) {
                    // Accessing the environment from templates is forbidden to prevent untrusted changes to the environment
                    if ('getenvironment' !== strtolower($refMethod->name)) {
                        $methods[] = $refMethod->name;
                    }
                }
            } else {
                $methods = get_class_methods($object);
            }
            // sort values to have consistent behavior, so that "get" methods win precedence over "is" methods
            sort($methods);

            $cache = array();

            foreach ($methods as $method) {
                $cache[$method] = $method;
                $cache[$lcName = strtolower($method)] = $method;

                if ('g' === $lcName[0] && 0 === strpos($lcName, 'get')) {
                    $name = substr($method, 3);
                    $lcName = substr($lcName, 3);
                } elseif ('i' === $lcName[0] && 0 === strpos($lcName, 'is')) {
                    $name = substr($method, 2);
                    $lcName = substr($lcName, 2);
                } else {
                    continue;
                }

                // skip get() and is() methods (in which case, $name is empty)
                if ($name) {
                    if (!isset($cache[$name])) {
                        $cache[$name] = $method;
                    }
                    if (!isset($cache[$lcName])) {
                        $cache[$lcName] = $method;
                    }
                }
            }
            self::$cache[$class] = $cache;
        }

        $call = false;
        if (isset(self::$cache[$class][$item])) {
            $method = self::$cache[$class][$item];
        } elseif (isset(self::$cache[$class][$lcItem = strtolower($item)])) {
            $method = self::$cache[$class][$lcItem];
        } elseif (isset(self::$cache[$class]['__call'])) {
            $method = $item;
            $call = true;
        } else {
            if ($isDefinedTest) {
                return false;
            }

            if ($ignoreStrictCheck || !$this->env->isStrictVariables()) {
                return;
            }

            throw new Twig_Error_Runtime(sprintf('Neither the property "%1$s" nor one of the methods "%1$s()", "get%1$s()"/"is%1$s()" or "__call()" exist and have public access in class "%2$s".', $item, $class), -1, $this->getSourceContext());
        }

        if ($isDefinedTest) {
            return true;
        }

        if ($this->env->hasExtension('Twig_Extension_Sandbox')) {
            $this->env->getExtension('Twig_Extension_Sandbox')->checkMethodAllowed($object, $method);
        }

        // Some objects throw exceptions when they have __call, and the method we try
        // to call is not supported. If ignoreStrictCheck is true, we should return null.
        try {
            if (!$arguments) {
                $ret = $object->$method();
            } else {
                $ret = call_user_func_array(array($object, $method), $arguments);
            }
        } catch (BadMethodCallException $e) {
            if ($call && ($ignoreStrictCheck || !$this->env->isStrictVariables())) {
                return;
            }
            throw $e;
        }

        // @deprecated in 1.28
        if ($object instanceof Twig_TemplateInterface) {
            $self = $object->getTemplateName() === $this->getTemplateName();
            $message = sprintf('Calling "%s" on template "%s" from template "%s" is deprecated since version 1.28 and won\'t be supported anymore in 2.0.', $item, $object->getTemplateName(), $this->getTemplateName());
            if ('renderBlock' === $method || 'displayBlock' === $method) {
                $message .= sprintf(' Use block("%s"%s) instead).', $arguments[0], $self ? '' : ', template');
            } elseif ('hasBlock' === $method) {
                $message .= sprintf(' Use "block("%s"%s) is defined" instead).', $arguments[0], $self ? '' : ', template');
            } elseif ('render' === $method || 'display' === $method) {
                $message .= sprintf(' Use include("%s") instead).', $object->getTemplateName());
            }
            @trigger_error($message, E_USER_DEPRECATED);

            return $ret === '' ? '' : new Twig_Markup($ret, $this->env->getCharset());
        }

        return $ret;
    }
}

class_alias('Twig_Template', 'Twig\Template', false);
