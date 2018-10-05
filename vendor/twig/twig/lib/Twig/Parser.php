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
 * Default parser implementation.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Parser
{
    private $stack = array();
    private $stream;
    private $parent;
    private $handlers;
    private $visitors;
    private $expressionParser;
    private $blocks;
    private $blockStack;
    private $macros;
    private $env;
    private $importedSymbols;
    private $traits;
    private $embeddedTemplates = array();
    private $varNameSalt = 0;

    public function __construct(Twig_Environment $env)
    {
        $this->env = $env;
    }

    public function getVarName()
    {
        return sprintf('__internal_%s', hash('sha256', __METHOD__.$this->stream->getSourceContext()->getCode().$this->varNameSalt++));
    }

    public function parse(Twig_TokenStream $stream, $test = null, $dropNeedle = false)
    {
        $vars = get_object_vars($this);
        unset($vars['stack'], $vars['env'], $vars['handlers'], $vars['visitors'], $vars['expressionParser'], $vars['reservedMacroNames']);
        $this->stack[] = $vars;

        // tag handlers
        if (null === $this->handlers) {
            $this->handlers = array();
            foreach ($this->env->getTokenParsers() as $handler) {
                $handler->setParser($this);

                $this->handlers[$handler->getTag()] = $handler;
            }
        }

        // node visitors
        if (null === $this->visitors) {
            $this->visitors = $this->env->getNodeVisitors();
        }

        if (null === $this->expressionParser) {
            $this->expressionParser = new Twig_ExpressionParser($this, $this->env);
        }

        $this->stream = $stream;
        $this->parent = null;
        $this->blocks = array();
        $this->macros = array();
        $this->traits = array();
        $this->blockStack = array();
        $this->importedSymbols = array(array());
        $this->embeddedTemplates = array();
        $this->varNameSalt = 0;

        try {
            $body = $this->subparse($test, $dropNeedle);

            if (null !== $this->parent && null === $body = $this->filterBodyNodes($body)) {
                $body = new Twig_Node();
            }
        } catch (Twig_Error_Syntax $e) {
            if (!$e->getSourceContext()) {
                $e->setSourceContext($this->stream->getSourceContext());
            }

            if (!$e->getTemplateLine()) {
                $e->setTemplateLine($this->stream->getCurrent()->getLine());
            }

            throw $e;
        }

        $node = new Twig_Node_Module(new Twig_Node_Body(array($body)), $this->parent, new Twig_Node($this->blocks), new Twig_Node($this->macros), new Twig_Node($this->traits), $this->embeddedTemplates, $stream->getSourceContext());

        $traverser = new Twig_NodeTraverser($this->env, $this->visitors);

        $node = $traverser->traverse($node);

        // restore previous stack so previous parse() call can resume working
        foreach (array_pop($this->stack) as $key => $val) {
            $this->$key = $val;
        }

        return $node;
    }

    public function subparse($test, $dropNeedle = false)
    {
        $lineno = $this->getCurrentToken()->getLine();
        $rv = array();
        while (!$this->stream->isEOF()) {
            switch ($this->getCurrentToken()->getType()) {
                case /* Twig_Token::TEXT_TYPE */ 0:
                    $token = $this->stream->next();
                    $rv[] = new Twig_Node_Text($token->getValue(), $token->getLine());
                    break;

                case /* Twig_Token::VAR_START_TYPE */ 2:
                    $token = $this->stream->next();
                    $expr = $this->expressionParser->parseExpression();
                    $this->stream->expect(/* Twig_Token::VAR_END_TYPE */ 4);
                    $rv[] = new Twig_Node_Print($expr, $token->getLine());
                    break;

                case /* Twig_Token::BLOCK_START_TYPE */ 1:
                    $this->stream->next();
                    $token = $this->getCurrentToken();

                    if (/* Twig_Token::NAME_TYPE */ 5 !== $token->getType()) {
                        throw new Twig_Error_Syntax('A block must start with a tag name.', $token->getLine(), $this->stream->getSourceContext());
                    }

                    if (null !== $test && $test($token)) {
                        if ($dropNeedle) {
                            $this->stream->next();
                        }

                        if (1 === count($rv)) {
                            return $rv[0];
                        }

                        return new Twig_Node($rv, array(), $lineno);
                    }

                    if (!isset($this->handlers[$token->getValue()])) {
                        if (null !== $test) {
                            $e = new Twig_Error_Syntax(sprintf('Unexpected "%s" tag', $token->getValue()), $token->getLine(), $this->stream->getSourceContext());

                            if (is_array($test) && isset($test[0]) && $test[0] instanceof Twig_TokenParserInterface) {
                                $e->appendMessage(sprintf(' (expecting closing tag for the "%s" tag defined near line %s).', $test[0]->getTag(), $lineno));
                            }
                        } else {
                            $e = new Twig_Error_Syntax(sprintf('Unknown "%s" tag.', $token->getValue()), $token->getLine(), $this->stream->getSourceContext());
                            $e->addSuggestions($token->getValue(), array_keys($this->env->getTags()));
                        }

                        throw $e;
                    }

                    $this->stream->next();

                    $subparser = $this->handlers[$token->getValue()];
                    $node = $subparser->parse($token);
                    if (null !== $node) {
                        $rv[] = $node;
                    }
                    break;

                default:
                    throw new Twig_Error_Syntax('Lexer or parser ended up in unsupported state.', $this->getCurrentToken()->getLine(), $this->stream->getSourceContext());
            }
        }

        if (1 === count($rv)) {
            return $rv[0];
        }

        return new Twig_Node($rv, array(), $lineno);
    }

    public function getBlockStack()
    {
        return $this->blockStack;
    }

    public function peekBlockStack()
    {
        return $this->blockStack[count($this->blockStack) - 1];
    }

    public function popBlockStack()
    {
        array_pop($this->blockStack);
    }

    public function pushBlockStack($name)
    {
        $this->blockStack[] = $name;
    }

    public function hasBlock($name)
    {
        return isset($this->blocks[$name]);
    }

    public function getBlock($name)
    {
        return $this->blocks[$name];
    }

    public function setBlock($name, Twig_Node_Block $value)
    {
        $this->blocks[$name] = new Twig_Node_Body(array($value), array(), $value->getTemplateLine());
    }

    public function hasMacro($name)
    {
        return isset($this->macros[$name]);
    }

    public function setMacro($name, Twig_Node_Macro $node)
    {
        $this->macros[$name] = $node;
    }

    public function isReservedMacroName($name)
    {
        return false;
    }

    public function addTrait($trait)
    {
        $this->traits[] = $trait;
    }

    public function hasTraits()
    {
        return count($this->traits) > 0;
    }

    public function embedTemplate(Twig_Node_Module $template)
    {
        $template->setIndex(mt_rand());

        $this->embeddedTemplates[] = $template;
    }

    public function addImportedSymbol($type, $alias, $name = null, Twig_Node_Expression $node = null)
    {
        $this->importedSymbols[0][$type][$alias] = array('name' => $name, 'node' => $node);
    }

    public function getImportedSymbol($type, $alias)
    {
        foreach ($this->importedSymbols as $functions) {
            if (isset($functions[$type][$alias])) {
                return $functions[$type][$alias];
            }
        }
    }

    public function isMainScope()
    {
        return 1 === count($this->importedSymbols);
    }

    public function pushLocalScope()
    {
        array_unshift($this->importedSymbols, array());
    }

    public function popLocalScope()
    {
        array_shift($this->importedSymbols);
    }

    /**
     * @return Twig_ExpressionParser
     */
    public function getExpressionParser()
    {
        return $this->expressionParser;
    }

    public function getParent()
    {
        return $this->parent;
    }

    public function setParent($parent)
    {
        $this->parent = $parent;
    }

    /**
     * @return Twig_TokenStream
     */
    public function getStream()
    {
        return $this->stream;
    }

    /**
     * @return Twig_Token
     */
    public function getCurrentToken()
    {
        return $this->stream->getCurrent();
    }

    private function filterBodyNodes(Twig_Node $node, $nested = false)
    {
        // check that the body does not contain non-empty output nodes
        if (
            ($node instanceof Twig_Node_Text && !ctype_space($node->getAttribute('data')))
            ||
            // the "&& !$node instanceof Twig_Node_Spaceless" part of the condition must be removed in 3.0
            (!$node instanceof Twig_Node_Text && !$node instanceof Twig_Node_BlockReference && ($node instanceof Twig_NodeOutputInterface && !$node instanceof Twig_Node_Spaceless))
        ) {
            if (false !== strpos((string) $node, chr(0xEF).chr(0xBB).chr(0xBF))) {
                throw new Twig_Error_Syntax('A template that extends another one cannot start with a byte order mark (BOM); it must be removed.', $node->getTemplateLine(), $this->stream->getSourceContext());
            }

            throw new Twig_Error_Syntax('A template that extends another one cannot include content outside Twig blocks. Did you forget to put the content inside a {% block %} tag?', $node->getTemplateLine(), $this->stream->getSourceContext());
        }

        // bypass nodes that "capture" the output
        if ($node instanceof Twig_NodeCaptureInterface) {
            // a "block" tag in such a node will serve as a block definition AND be displayed in place as well
            return $node;
        }

        // to be removed completely in Twig 3.0
        if (!$nested && $node instanceof Twig_Node_Spaceless) {
            @trigger_error(sprintf('Using the spaceless tag at the root level of a child template in "%s" at line %d is deprecated since version 2.5.0 and will become a syntax error in 3.0.', $this->stream->getSourceContext()->getName(), $node->getTemplateLine()), E_USER_DEPRECATED);
        }

        // "block" tags that are not captured (see above) are only used for defining
        // the content of the block. In such a case, nesting it does not work as
        // expected as the definition is not part of the default template code flow.
        if ($nested && $node instanceof Twig_Node_BlockReference) {
            //throw new Twig_Error_Syntax('A block definition cannot be nested under non-capturing nodes.', $node->getTemplateLine(), $this->stream->getSourceContext());
            @trigger_error(sprintf('Nesting a block definition under a non-capturing node in "%s" at line %d is deprecated since version 2.5.0 and will become a syntax error in 3.0.', $this->stream->getSourceContext()->getName(), $node->getTemplateLine()), E_USER_DEPRECATED);
            return;
        }

        // the "&& !$node instanceof Twig_Node_Spaceless" part of the condition must be removed in 3.0
        if ($node instanceof Twig_NodeOutputInterface && !$node instanceof Twig_Node_Spaceless) {
            return;
        }

        // here, $nested means "being at the root level of a child template"
        // we need to discard the wrapping "Twig_Node" for the "body" node
        $nested = $nested || get_class($node) !== 'Twig_Node';
        foreach ($node as $k => $n) {
            if (null !== $n && null === $this->filterBodyNodes($n, $nested)) {
                $node->removeNode($k);
            }
        }

        return $node;
    }
}

class_alias('Twig_Parser', 'Twig\Parser', false);
class_exists('Twig_Node');
class_exists('Twig_TokenStream');
