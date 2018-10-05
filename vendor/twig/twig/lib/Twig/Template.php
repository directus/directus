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
abstract class Twig_Template
{
    const ANY_CALL = 'any';
    const ARRAY_CALL = 'array';
    const METHOD_CALL = 'method';

    protected $parent;
    protected $parents = array();
    protected $env;
    protected $blocks = array();
    protected $traits = array();

    /**
     * @internal
     */
    protected $extensions = array();

    public function __construct(Twig_Environment $env)
    {
        $this->env = $env;
        $this->extensions = $env->getExtensions();
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
    abstract public function getDebugInfo();

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
     * Returns the parent template.
     *
     * This method is for internal use only and should never be called
     * directly.
     *
     * @param array $context
     *
     * @return Twig_Template|false The parent template or false if there is no parent
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
        } elseif (isset($blocks[$name])) {
            throw new Twig_Error_Runtime(sprintf('Block "%s" should not call parent() in "%s" as the block does not exist in the parent template "%s".', $name, $blocks[$name][0]->getTemplateName(), $this->getTemplateName()), -1, $blocks[$name][0]->getTemplateName());
        } else {
            throw new Twig_Error_Runtime(sprintf('Block "%s" on template "%s" does not exist.', $name, $this->getTemplateName()), -1, $this->getTemplateName());
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
    public function hasBlock($name, array $context, array $blocks = array())
    {
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
    public function getBlockNames(array $context, array $blocks = array())
    {
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
}

class_alias('Twig_Template', 'Twig\Template', false);
