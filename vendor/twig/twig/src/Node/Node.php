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

namespace Twig\Node;

use Twig\Compiler;
use Twig\Source;

/**
 * Represents a node in the AST.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Node implements \Countable, \IteratorAggregate
{
    protected $nodes;
    protected $attributes;
    protected $lineno;
    protected $tag;

    private $name;
    private $sourceContext;

    /**
     * @param array  $nodes      An array of named nodes
     * @param array  $attributes An array of attributes (should not be nodes)
     * @param int    $lineno     The line number
     * @param string $tag        The tag name associated with the Node
     */
    public function __construct(array $nodes = [], array $attributes = [], int $lineno = 0, string $tag = null)
    {
        foreach ($nodes as $name => $node) {
            if (!$node instanceof self) {
                throw new \InvalidArgumentException(sprintf('Using "%s" for the value of node "%s" of "%s" is not supported. You must pass a \Twig\Node\Node instance.', \is_object($node) ? \get_class($node) : null === $node ? 'null' : \gettype($node), $name, \get_class($this)));
            }
        }
        $this->nodes = $nodes;
        $this->attributes = $attributes;
        $this->lineno = $lineno;
        $this->tag = $tag;
    }

    public function __toString()
    {
        $attributes = [];
        foreach ($this->attributes as $name => $value) {
            $attributes[] = sprintf('%s: %s', $name, str_replace("\n", '', var_export($value, true)));
        }

        $repr = [\get_class($this).'('.implode(', ', $attributes)];

        if (\count($this->nodes)) {
            foreach ($this->nodes as $name => $node) {
                $len = \strlen($name) + 4;
                $noderepr = [];
                foreach (explode("\n", (string) $node) as $line) {
                    $noderepr[] = str_repeat(' ', $len).$line;
                }

                $repr[] = sprintf('  %s: %s', $name, ltrim(implode("\n", $noderepr)));
            }

            $repr[] = ')';
        } else {
            $repr[0] .= ')';
        }

        return implode("\n", $repr);
    }

    public function compile(Compiler $compiler)
    {
        foreach ($this->nodes as $node) {
            $node->compile($compiler);
        }
    }

    public function getTemplateLine()
    {
        return $this->lineno;
    }

    public function getNodeTag()
    {
        return $this->tag;
    }

    /**
     * @return bool
     */
    public function hasAttribute($name)
    {
        return \array_key_exists($name, $this->attributes);
    }

    /**
     * @return mixed
     */
    public function getAttribute($name)
    {
        if (!\array_key_exists($name, $this->attributes)) {
            throw new \LogicException(sprintf('Attribute "%s" does not exist for Node "%s".', $name, \get_class($this)));
        }

        return $this->attributes[$name];
    }

    /**
     * @param string $name
     * @param mixed  $value
     */
    public function setAttribute($name, $value)
    {
        $this->attributes[$name] = $value;
    }

    public function removeAttribute($name)
    {
        unset($this->attributes[$name]);
    }

    /**
     * @return bool
     */
    public function hasNode($name)
    {
        return isset($this->nodes[$name]);
    }

    /**
     * @return Node
     */
    public function getNode($name)
    {
        if (!isset($this->nodes[$name])) {
            throw new \LogicException(sprintf('Node "%s" does not exist for Node "%s".', $name, \get_class($this)));
        }

        return $this->nodes[$name];
    }

    public function setNode($name, self $node)
    {
        $this->nodes[$name] = $node;
    }

    public function removeNode($name)
    {
        unset($this->nodes[$name]);
    }

    public function count()
    {
        return \count($this->nodes);
    }

    public function getIterator()
    {
        return new \ArrayIterator($this->nodes);
    }

    /**
     * @deprecated since 2.8 (to be removed in 3.0)
     */
    public function setTemplateName($name/*, $triggerDeprecation = true */)
    {
        $triggerDeprecation = 2 > \func_num_args() || \func_get_arg(1);
        if ($triggerDeprecation) {
            @trigger_error('The '.__METHOD__.' method is deprecated since version 2.8 and will be removed in 3.0. Use setSourceContext() instead.', E_USER_DEPRECATED);
        }

        $this->name = $name;
        foreach ($this->nodes as $node) {
            $node->setTemplateName($name, $triggerDeprecation);
        }
    }

    public function getTemplateName()
    {
        return $this->sourceContext ? $this->sourceContext->getName() : null;
    }

    public function setSourceContext(Source $source)
    {
        $this->sourceContext = $source;
        foreach ($this->nodes as $node) {
            $node->setSourceContext($source);
        }

        $this->setTemplateName($source->getName(), false);
    }

    public function getSourceContext()
    {
        return $this->sourceContext;
    }
}

class_alias('Twig\Node\Node', 'Twig_Node');

// Ensure that the aliased name is loaded to keep BC for classes implementing the typehint with the old aliased name.
class_exists('Twig\Compiler');
