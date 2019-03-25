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

namespace Twig;

use Twig\Error\SyntaxError;
use Twig\Node\BlockNode;
use Twig\Node\BlockReferenceNode;
use Twig\Node\BodyNode;
use Twig\Node\Expression\AbstractExpression;
use Twig\Node\MacroNode;
use Twig\Node\ModuleNode;
use Twig\Node\Node;
use Twig\Node\NodeCaptureInterface;
use Twig\Node\NodeOutputInterface;
use Twig\Node\PrintNode;
use Twig\Node\SpacelessNode;
use Twig\Node\TextNode;
use Twig\TokenParser\TokenParserInterface;

/**
 * Default parser implementation.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Parser
{
    private $stack = [];
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
    private $embeddedTemplates = [];
    private $varNameSalt = 0;

    public function __construct(Environment $env)
    {
        $this->env = $env;
    }

    public function getVarName()
    {
        return sprintf('__internal_%s', hash('sha256', __METHOD__.$this->stream->getSourceContext()->getCode().$this->varNameSalt++));
    }

    public function parse(TokenStream $stream, $test = null, $dropNeedle = false)
    {
        $vars = get_object_vars($this);
        unset($vars['stack'], $vars['env'], $vars['handlers'], $vars['visitors'], $vars['expressionParser'], $vars['reservedMacroNames']);
        $this->stack[] = $vars;

        // tag handlers
        if (null === $this->handlers) {
            $this->handlers = [];
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
            $this->expressionParser = new ExpressionParser($this, $this->env);
        }

        $this->stream = $stream;
        $this->parent = null;
        $this->blocks = [];
        $this->macros = [];
        $this->traits = [];
        $this->blockStack = [];
        $this->importedSymbols = [[]];
        $this->embeddedTemplates = [];
        $this->varNameSalt = 0;

        try {
            $body = $this->subparse($test, $dropNeedle);

            if (null !== $this->parent && null === $body = $this->filterBodyNodes($body)) {
                $body = new Node();
            }
        } catch (SyntaxError $e) {
            if (!$e->getSourceContext()) {
                $e->setSourceContext($this->stream->getSourceContext());
            }

            if (!$e->getTemplateLine()) {
                $e->setTemplateLine($this->stream->getCurrent()->getLine());
            }

            throw $e;
        }

        $node = new ModuleNode(new BodyNode([$body]), $this->parent, new Node($this->blocks), new Node($this->macros), new Node($this->traits), $this->embeddedTemplates, $stream->getSourceContext());

        $traverser = new NodeTraverser($this->env, $this->visitors);

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
        $rv = [];
        while (!$this->stream->isEOF()) {
            switch ($this->getCurrentToken()->getType()) {
                case /* Token::TEXT_TYPE */ 0:
                    $token = $this->stream->next();
                    $rv[] = new TextNode($token->getValue(), $token->getLine());
                    break;

                case /* Token::VAR_START_TYPE */ 2:
                    $token = $this->stream->next();
                    $expr = $this->expressionParser->parseExpression();
                    $this->stream->expect(/* Token::VAR_END_TYPE */ 4);
                    $rv[] = new PrintNode($expr, $token->getLine());
                    break;

                case /* Token::BLOCK_START_TYPE */ 1:
                    $this->stream->next();
                    $token = $this->getCurrentToken();

                    if (/* Token::NAME_TYPE */ 5 !== $token->getType()) {
                        throw new SyntaxError('A block must start with a tag name.', $token->getLine(), $this->stream->getSourceContext());
                    }

                    if (null !== $test && $test($token)) {
                        if ($dropNeedle) {
                            $this->stream->next();
                        }

                        if (1 === \count($rv)) {
                            return $rv[0];
                        }

                        return new Node($rv, [], $lineno);
                    }

                    if (!isset($this->handlers[$token->getValue()])) {
                        if (null !== $test) {
                            $e = new SyntaxError(sprintf('Unexpected "%s" tag', $token->getValue()), $token->getLine(), $this->stream->getSourceContext());

                            if (\is_array($test) && isset($test[0]) && $test[0] instanceof TokenParserInterface) {
                                $e->appendMessage(sprintf(' (expecting closing tag for the "%s" tag defined near line %s).', $test[0]->getTag(), $lineno));
                            }
                        } else {
                            $e = new SyntaxError(sprintf('Unknown "%s" tag.', $token->getValue()), $token->getLine(), $this->stream->getSourceContext());
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
                    throw new SyntaxError('Lexer or parser ended up in unsupported state.', $this->getCurrentToken()->getLine(), $this->stream->getSourceContext());
            }
        }

        if (1 === \count($rv)) {
            return $rv[0];
        }

        return new Node($rv, [], $lineno);
    }

    public function getBlockStack()
    {
        return $this->blockStack;
    }

    public function peekBlockStack()
    {
        return $this->blockStack[\count($this->blockStack) - 1];
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

    public function setBlock($name, BlockNode $value)
    {
        $this->blocks[$name] = new BodyNode([$value], [], $value->getTemplateLine());
    }

    public function hasMacro($name)
    {
        return isset($this->macros[$name]);
    }

    public function setMacro($name, MacroNode $node)
    {
        $this->macros[$name] = $node;
    }

    /**
     * @deprecated since Twig 2.7 as there are no reserved macro names anymore, will be removed in 3.0.
     */
    public function isReservedMacroName($name)
    {
        @trigger_error(sprintf('The "%s" method is deprecated since Twig 2.7 and will be removed in 3.0.', __METHOD__), E_USER_DEPRECATED);

        return false;
    }

    public function addTrait($trait)
    {
        $this->traits[] = $trait;
    }

    public function hasTraits()
    {
        return \count($this->traits) > 0;
    }

    public function embedTemplate(ModuleNode $template)
    {
        $template->setIndex(mt_rand());

        $this->embeddedTemplates[] = $template;
    }

    public function addImportedSymbol($type, $alias, $name = null, AbstractExpression $node = null)
    {
        $this->importedSymbols[0][$type][$alias] = ['name' => $name, 'node' => $node];
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
        return 1 === \count($this->importedSymbols);
    }

    public function pushLocalScope()
    {
        array_unshift($this->importedSymbols, []);
    }

    public function popLocalScope()
    {
        array_shift($this->importedSymbols);
    }

    /**
     * @return ExpressionParser
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
     * @return TokenStream
     */
    public function getStream()
    {
        return $this->stream;
    }

    /**
     * @return Token
     */
    public function getCurrentToken()
    {
        return $this->stream->getCurrent();
    }

    private function filterBodyNodes(Node $node, bool $nested = false)
    {
        // check that the body does not contain non-empty output nodes
        if (
            ($node instanceof TextNode && !ctype_space($node->getAttribute('data')))
            ||
            // the "&& !$node instanceof SpacelessNode" part of the condition must be removed in 3.0
            (!$node instanceof TextNode && !$node instanceof BlockReferenceNode && ($node instanceof NodeOutputInterface && !$node instanceof SpacelessNode))
        ) {
            if (false !== strpos((string) $node, \chr(0xEF).\chr(0xBB).\chr(0xBF))) {
                $t = substr($node->getAttribute('data'), 3);
                if ('' === $t || ctype_space($t)) {
                    // bypass empty nodes starting with a BOM
                    return;
                }
            }

            throw new SyntaxError('A template that extends another one cannot include content outside Twig blocks. Did you forget to put the content inside a {% block %} tag?', $node->getTemplateLine(), $this->stream->getSourceContext());
        }

        // bypass nodes that "capture" the output
        if ($node instanceof NodeCaptureInterface) {
            // a "block" tag in such a node will serve as a block definition AND be displayed in place as well
            return $node;
        }

        // to be removed completely in Twig 3.0
        if (!$nested && $node instanceof SpacelessNode) {
            @trigger_error(sprintf('Using the spaceless tag at the root level of a child template in "%s" at line %d is deprecated since Twig 2.5.0 and will become a syntax error in 3.0.', $this->stream->getSourceContext()->getName(), $node->getTemplateLine()), E_USER_DEPRECATED);
        }

        // "block" tags that are not captured (see above) are only used for defining
        // the content of the block. In such a case, nesting it does not work as
        // expected as the definition is not part of the default template code flow.
        if ($nested && ($node instanceof BlockReferenceNode || $node instanceof \Twig_Node_BlockReference)) {
            //throw new SyntaxError('A block definition cannot be nested under non-capturing nodes.', $node->getTemplateLine(), $this->stream->getSourceContext());
            @trigger_error(sprintf('Nesting a block definition under a non-capturing node in "%s" at line %d is deprecated since Twig 2.5.0 and will become a syntax error in 3.0.', $this->stream->getSourceContext()->getName(), $node->getTemplateLine()), E_USER_DEPRECATED);

            return;
        }

        // the "&& !$node instanceof SpacelessNode" part of the condition must be removed in 3.0
        if ($node instanceof NodeOutputInterface && !$node instanceof SpacelessNode) {
            return;
        }

        // here, $nested means "being at the root level of a child template"
        // we need to discard the wrapping "Twig_Node" for the "body" node
        $nested = $nested || ('Twig_Node' !== \get_class($node) && Node::class !== \get_class($node));
        foreach ($node as $k => $n) {
            if (null !== $n && null === $this->filterBodyNodes($n, $nested)) {
                $node->removeNode($k);
            }
        }

        return $node;
    }
}

class_alias('Twig\Parser', 'Twig_Parser');
