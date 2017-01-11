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
 * Represents a node in the AST.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Node implements Twig_NodeInterface
{
    protected $nodes;
    protected $attributes;
    protected $lineno;
    protected $tag;

    private $name;

    /**
     * Constructor.
     *
     * The nodes are automatically made available as properties ($this->node).
     * The attributes are automatically made available as array items ($this['name']).
     *
     * @param array  $nodes      An array of named nodes
     * @param array  $attributes An array of attributes (should not be nodes)
     * @param int    $lineno     The line number
     * @param string $tag        The tag name associated with the Node
     */
    public function __construct(array $nodes = array(), array $attributes = array(), $lineno = 0, $tag = null)
    {
        foreach ($nodes as $name => $node) {
            if (!$node instanceof Twig_NodeInterface) {
                @trigger_error(sprintf('Using "%s" for the value of node "%s" of "%s" is deprecated since version 1.25 and will be removed in 2.0.', is_object($node) ? get_class($node) : null === $node ? 'null' : gettype($node), $name, get_class($this)), E_USER_DEPRECATED);
            }
        }
        $this->nodes = $nodes;
        $this->attributes = $attributes;
        $this->lineno = $lineno;
        $this->tag = $tag;
    }

    public function __toString()
    {
        $attributes = array();
        foreach ($this->attributes as $name => $value) {
            $attributes[] = sprintf('%s: %s', $name, str_replace("\n", '', var_export($value, true)));
        }

        $repr = array(get_class($this).'('.implode(', ', $attributes));

        if (count($this->nodes)) {
            foreach ($this->nodes as $name => $node) {
                $len = strlen($name) + 4;
                $noderepr = array();
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

    /**
     * @deprecated since 1.16.1 (to be removed in 2.0)
     */
    public function toXml($asDom = false)
    {
        @trigger_error(sprintf('%s is deprecated since version 1.16.1 and will be removed in 2.0.', __METHOD__), E_USER_DEPRECATED);

        $dom = new DOMDocument('1.0', 'UTF-8');
        $dom->formatOutput = true;
        $dom->appendChild($xml = $dom->createElement('twig'));

        $xml->appendChild($node = $dom->createElement('node'));
        $node->setAttribute('class', get_class($this));

        foreach ($this->attributes as $name => $value) {
            $node->appendChild($attribute = $dom->createElement('attribute'));
            $attribute->setAttribute('name', $name);
            $attribute->appendChild($dom->createTextNode($value));
        }

        foreach ($this->nodes as $name => $n) {
            if (null === $n) {
                continue;
            }

            $child = $n->toXml(true)->getElementsByTagName('node')->item(0);
            $child = $dom->importNode($child, true);
            $child->setAttribute('name', $name);

            $node->appendChild($child);
        }

        return $asDom ? $dom : $dom->saveXML();
    }

    public function compile(Twig_Compiler $compiler)
    {
        foreach ($this->nodes as $node) {
            $node->compile($compiler);
        }
    }

    public function getTemplateLine()
    {
        return $this->lineno;
    }

    /**
     * @deprecated since 1.27 (to be removed in 2.0)
     */
    public function getLine()
    {
        @trigger_error('The '.__METHOD__.' method is deprecated since version 1.27 and will be removed in 2.0. Use getTemplateLine() instead.', E_USER_DEPRECATED);

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
        return array_key_exists($name, $this->attributes);
    }

    /**
     * @return mixed
     */
    public function getAttribute($name)
    {
        if (!array_key_exists($name, $this->attributes)) {
            throw new LogicException(sprintf('Attribute "%s" does not exist for Node "%s".', $name, get_class($this)));
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
        return array_key_exists($name, $this->nodes);
    }

    /**
     * @return Twig_Node
     */
    public function getNode($name)
    {
        if (!array_key_exists($name, $this->nodes)) {
            throw new LogicException(sprintf('Node "%s" does not exist for Node "%s".', $name, get_class($this)));
        }

        return $this->nodes[$name];
    }

    public function setNode($name, $node = null)
    {
        if (!$node instanceof Twig_NodeInterface) {
            @trigger_error(sprintf('Using "%s" for the value of node "%s" of "%s" is deprecated since version 1.25 and will be removed in 2.0.', is_object($node) ? get_class($node) : null === $node ? 'null' : gettype($node), $name, get_class($this)), E_USER_DEPRECATED);
        }

        $this->nodes[$name] = $node;
    }

    public function removeNode($name)
    {
        unset($this->nodes[$name]);
    }

    public function count()
    {
        return count($this->nodes);
    }

    public function getIterator()
    {
        return new ArrayIterator($this->nodes);
    }

    public function setTemplateName($name)
    {
        $this->name = $name;
        foreach ($this->nodes as $node) {
            if (null !== $node) {
                $node->setTemplateName($name);
            }
        }
    }

    public function getTemplateName()
    {
        return $this->name;
    }

    /**
     * @deprecated since 1.27 (to be removed in 2.0)
     */
    public function setFilename($name)
    {
        @trigger_error('The '.__METHOD__.' method is deprecated since version 1.27 and will be removed in 2.0. Use setTemplateName() instead.', E_USER_DEPRECATED);

        $this->setTemplateName($name);
    }

    /**
     * @deprecated since 1.27 (to be removed in 2.0)
     */
    public function getFilename()
    {
        @trigger_error('The '.__METHOD__.' method is deprecated since version 1.27 and will be removed in 2.0. Use getTemplateName() instead.', E_USER_DEPRECATED);

        return $this->name;
    }
}
