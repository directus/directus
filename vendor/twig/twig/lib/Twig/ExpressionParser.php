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
 * Parses expressions.
 *
 * This parser implements a "Precedence climbing" algorithm.
 *
 * @see https://www.engr.mun.ca/~theo/Misc/exp_parsing.htm
 * @see https://en.wikipedia.org/wiki/Operator-precedence_parser
 *
 * @author Fabien Potencier <fabien@symfony.com>
 *
 * @internal
 */
class Twig_ExpressionParser
{
    const OPERATOR_LEFT = 1;
    const OPERATOR_RIGHT = 2;

    private $parser;
    private $env;
    private $unaryOperators;
    private $binaryOperators;

    public function __construct(Twig_Parser $parser, Twig_Environment $env)
    {
        $this->parser = $parser;
        $this->env = $env;
        $this->unaryOperators = $env->getUnaryOperators();
        $this->binaryOperators = $env->getBinaryOperators();
    }

    public function parseExpression($precedence = 0)
    {
        $expr = $this->getPrimary();
        $token = $this->parser->getCurrentToken();
        while ($this->isBinary($token) && $this->binaryOperators[$token->getValue()]['precedence'] >= $precedence) {
            $op = $this->binaryOperators[$token->getValue()];
            $this->parser->getStream()->next();

            if ('is not' === $token->getValue()) {
                $expr = $this->parseNotTestExpression($expr);
            } elseif ('is' === $token->getValue()) {
                $expr = $this->parseTestExpression($expr);
            } elseif (isset($op['callable'])) {
                $expr = $op['callable']($this->parser, $expr);
            } else {
                $expr1 = $this->parseExpression(self::OPERATOR_LEFT === $op['associativity'] ? $op['precedence'] + 1 : $op['precedence']);
                $class = $op['class'];
                $expr = new $class($expr, $expr1, $token->getLine());
            }

            $token = $this->parser->getCurrentToken();
        }

        if (0 === $precedence) {
            return $this->parseConditionalExpression($expr);
        }

        return $expr;
    }

    private function getPrimary()
    {
        $token = $this->parser->getCurrentToken();

        if ($this->isUnary($token)) {
            $operator = $this->unaryOperators[$token->getValue()];
            $this->parser->getStream()->next();
            $expr = $this->parseExpression($operator['precedence']);
            $class = $operator['class'];

            return $this->parsePostfixExpression(new $class($expr, $token->getLine()));
        } elseif ($token->test(/* Twig_Token::PUNCTUATION_TYPE */ 9, '(')) {
            $this->parser->getStream()->next();
            $expr = $this->parseExpression();
            $this->parser->getStream()->expect(/* Twig_Token::PUNCTUATION_TYPE */ 9, ')', 'An opened parenthesis is not properly closed');

            return $this->parsePostfixExpression($expr);
        }

        return $this->parsePrimaryExpression();
    }

    private function parseConditionalExpression($expr)
    {
        while ($this->parser->getStream()->nextIf(/* Twig_Token::PUNCTUATION_TYPE */ 9, '?')) {
            if (!$this->parser->getStream()->nextIf(/* Twig_Token::PUNCTUATION_TYPE */ 9, ':')) {
                $expr2 = $this->parseExpression();
                if ($this->parser->getStream()->nextIf(/* Twig_Token::PUNCTUATION_TYPE */ 9, ':')) {
                    $expr3 = $this->parseExpression();
                } else {
                    $expr3 = new Twig_Node_Expression_Constant('', $this->parser->getCurrentToken()->getLine());
                }
            } else {
                $expr2 = $expr;
                $expr3 = $this->parseExpression();
            }

            $expr = new Twig_Node_Expression_Conditional($expr, $expr2, $expr3, $this->parser->getCurrentToken()->getLine());
        }

        return $expr;
    }

    private function isUnary(Twig_Token $token)
    {
        return $token->test(/* Twig_Token::OPERATOR_TYPE */ 8) && isset($this->unaryOperators[$token->getValue()]);
    }

    private function isBinary(Twig_Token $token)
    {
        return $token->test(/* Twig_Token::OPERATOR_TYPE */ 8) && isset($this->binaryOperators[$token->getValue()]);
    }

    public function parsePrimaryExpression()
    {
        $token = $this->parser->getCurrentToken();
        switch ($token->getType()) {
            case /* Twig_Token::NAME_TYPE */ 5:
                $this->parser->getStream()->next();
                switch ($token->getValue()) {
                    case 'true':
                    case 'TRUE':
                        $node = new Twig_Node_Expression_Constant(true, $token->getLine());
                        break;

                    case 'false':
                    case 'FALSE':
                        $node = new Twig_Node_Expression_Constant(false, $token->getLine());
                        break;

                    case 'none':
                    case 'NONE':
                    case 'null':
                    case 'NULL':
                        $node = new Twig_Node_Expression_Constant(null, $token->getLine());
                        break;

                    default:
                        if ('(' === $this->parser->getCurrentToken()->getValue()) {
                            $node = $this->getFunctionNode($token->getValue(), $token->getLine());
                        } else {
                            $node = new Twig_Node_Expression_Name($token->getValue(), $token->getLine());
                        }
                }
                break;

            case /* Twig_Token::NUMBER_TYPE */ 6:
                $this->parser->getStream()->next();
                $node = new Twig_Node_Expression_Constant($token->getValue(), $token->getLine());
                break;

            case /* Twig_Token::STRING_TYPE */ 7:
            case /* Twig_Token::INTERPOLATION_START_TYPE */ 10:
                $node = $this->parseStringExpression();
                break;

            case /* Twig_Token::OPERATOR_TYPE */ 8:
                if (preg_match(Twig_Lexer::REGEX_NAME, $token->getValue(), $matches) && $matches[0] == $token->getValue()) {
                    // in this context, string operators are variable names
                    $this->parser->getStream()->next();
                    $node = new Twig_Node_Expression_Name($token->getValue(), $token->getLine());
                    break;
                } elseif (isset($this->unaryOperators[$token->getValue()])) {
                    $class = $this->unaryOperators[$token->getValue()]['class'];

                    $ref = new ReflectionClass($class);
                    $negClass = 'Twig_Node_Expression_Unary_Neg';
                    $posClass = 'Twig_Node_Expression_Unary_Pos';
                    if (!(in_array($ref->getName(), array($negClass, $posClass)) || $ref->isSubclassOf($negClass) || $ref->isSubclassOf($posClass))) {
                        throw new Twig_Error_Syntax(sprintf('Unexpected unary operator "%s".', $token->getValue()), $token->getLine(), $this->parser->getStream()->getSourceContext());
                    }

                    $this->parser->getStream()->next();
                    $expr = $this->parsePrimaryExpression();

                    $node = new $class($expr, $token->getLine());
                    break;
                }

                // no break
            default:
                if ($token->test(/* Twig_Token::PUNCTUATION_TYPE */ 9, '[')) {
                    $node = $this->parseArrayExpression();
                } elseif ($token->test(/* Twig_Token::PUNCTUATION_TYPE */ 9, '{')) {
                    $node = $this->parseHashExpression();
                } elseif ($token->test(/* Twig_Token::OPERATOR_TYPE */ 8, '=') && ('==' === $this->parser->getStream()->look(-1)->getValue() || '!=' === $this->parser->getStream()->look(-1)->getValue())) {
                    throw new Twig_Error_Syntax(sprintf('Unexpected operator of value "%s". Did you try to use "===" or "!==" for strict comparison? Use "is same as(value)" instead.', $token->getValue()), $token->getLine(), $this->parser->getStream()->getSourceContext());
                } else {
                    throw new Twig_Error_Syntax(sprintf('Unexpected token "%s" of value "%s".', Twig_Token::typeToEnglish($token->getType()), $token->getValue()), $token->getLine(), $this->parser->getStream()->getSourceContext());
                }
        }

        return $this->parsePostfixExpression($node);
    }

    public function parseStringExpression()
    {
        $stream = $this->parser->getStream();

        $nodes = array();
        // a string cannot be followed by another string in a single expression
        $nextCanBeString = true;
        while (true) {
            if ($nextCanBeString && $token = $stream->nextIf(/* Twig_Token::STRING_TYPE */ 7)) {
                $nodes[] = new Twig_Node_Expression_Constant($token->getValue(), $token->getLine());
                $nextCanBeString = false;
            } elseif ($stream->nextIf(/* Twig_Token::INTERPOLATION_START_TYPE */ 10)) {
                $nodes[] = $this->parseExpression();
                $stream->expect(/* Twig_Token::INTERPOLATION_END_TYPE */ 11);
                $nextCanBeString = true;
            } else {
                break;
            }
        }

        $expr = array_shift($nodes);
        foreach ($nodes as $node) {
            $expr = new Twig_Node_Expression_Binary_Concat($expr, $node, $node->getTemplateLine());
        }

        return $expr;
    }

    public function parseArrayExpression()
    {
        $stream = $this->parser->getStream();
        $stream->expect(/* Twig_Token::PUNCTUATION_TYPE */ 9, '[', 'An array element was expected');

        $node = new Twig_Node_Expression_Array(array(), $stream->getCurrent()->getLine());
        $first = true;
        while (!$stream->test(/* Twig_Token::PUNCTUATION_TYPE */ 9, ']')) {
            if (!$first) {
                $stream->expect(/* Twig_Token::PUNCTUATION_TYPE */ 9, ',', 'An array element must be followed by a comma');

                // trailing ,?
                if ($stream->test(/* Twig_Token::PUNCTUATION_TYPE */ 9, ']')) {
                    break;
                }
            }
            $first = false;

            $node->addElement($this->parseExpression());
        }
        $stream->expect(/* Twig_Token::PUNCTUATION_TYPE */ 9, ']', 'An opened array is not properly closed');

        return $node;
    }

    public function parseHashExpression()
    {
        $stream = $this->parser->getStream();
        $stream->expect(/* Twig_Token::PUNCTUATION_TYPE */ 9, '{', 'A hash element was expected');

        $node = new Twig_Node_Expression_Array(array(), $stream->getCurrent()->getLine());
        $first = true;
        while (!$stream->test(/* Twig_Token::PUNCTUATION_TYPE */ 9, '}')) {
            if (!$first) {
                $stream->expect(/* Twig_Token::PUNCTUATION_TYPE */ 9, ',', 'A hash value must be followed by a comma');

                // trailing ,?
                if ($stream->test(/* Twig_Token::PUNCTUATION_TYPE */ 9, '}')) {
                    break;
                }
            }
            $first = false;

            // a hash key can be:
            //
            //  * a number -- 12
            //  * a string -- 'a'
            //  * a name, which is equivalent to a string -- a
            //  * an expression, which must be enclosed in parentheses -- (1 + 2)
            if (($token = $stream->nextIf(/* Twig_Token::STRING_TYPE */ 7)) || ($token = $stream->nextIf(/* Twig_Token::NAME_TYPE */ 5)) || $token = $stream->nextIf(/* Twig_Token::NUMBER_TYPE */ 6)) {
                $key = new Twig_Node_Expression_Constant($token->getValue(), $token->getLine());
            } elseif ($stream->test(/* Twig_Token::PUNCTUATION_TYPE */ 9, '(')) {
                $key = $this->parseExpression();
            } else {
                $current = $stream->getCurrent();

                throw new Twig_Error_Syntax(sprintf('A hash key must be a quoted string, a number, a name, or an expression enclosed in parentheses (unexpected token "%s" of value "%s".', Twig_Token::typeToEnglish($current->getType()), $current->getValue()), $current->getLine(), $stream->getSourceContext());
            }

            $stream->expect(/* Twig_Token::PUNCTUATION_TYPE */ 9, ':', 'A hash key must be followed by a colon (:)');
            $value = $this->parseExpression();

            $node->addElement($value, $key);
        }
        $stream->expect(/* Twig_Token::PUNCTUATION_TYPE */ 9, '}', 'An opened hash is not properly closed');

        return $node;
    }

    public function parsePostfixExpression($node)
    {
        while (true) {
            $token = $this->parser->getCurrentToken();
            if (/* Twig_Token::PUNCTUATION_TYPE */ 9 == $token->getType()) {
                if ('.' == $token->getValue() || '[' == $token->getValue()) {
                    $node = $this->parseSubscriptExpression($node);
                } elseif ('|' == $token->getValue()) {
                    $node = $this->parseFilterExpression($node);
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        return $node;
    }

    public function getFunctionNode($name, $line)
    {
        switch ($name) {
            case 'parent':
                $this->parseArguments();
                if (!count($this->parser->getBlockStack())) {
                    throw new Twig_Error_Syntax('Calling "parent" outside a block is forbidden.', $line, $this->parser->getStream()->getSourceContext());
                }

                if (!$this->parser->getParent() && !$this->parser->hasTraits()) {
                    throw new Twig_Error_Syntax('Calling "parent" on a template that does not extend nor "use" another template is forbidden.', $line, $this->parser->getStream()->getSourceContext());
                }

                return new Twig_Node_Expression_Parent($this->parser->peekBlockStack(), $line);
            case 'block':
                $args = $this->parseArguments();
                if (count($args) < 1) {
                    throw new Twig_Error_Syntax('The "block" function takes one argument (the block name).', $line, $this->parser->getStream()->getSourceContext());
                }

                return new Twig_Node_Expression_BlockReference($args->getNode(0), count($args) > 1 ? $args->getNode(1) : null, $line);
            case 'attribute':
                $args = $this->parseArguments();
                if (count($args) < 2) {
                    throw new Twig_Error_Syntax('The "attribute" function takes at least two arguments (the variable and the attributes).', $line, $this->parser->getStream()->getSourceContext());
                }

                return new Twig_Node_Expression_GetAttr($args->getNode(0), $args->getNode(1), count($args) > 2 ? $args->getNode(2) : null, Twig_Template::ANY_CALL, $line);
            default:
                if (null !== $alias = $this->parser->getImportedSymbol('function', $name)) {
                    $arguments = new Twig_Node_Expression_Array(array(), $line);
                    foreach ($this->parseArguments() as $n) {
                        $arguments->addElement($n);
                    }

                    $node = new Twig_Node_Expression_MethodCall($alias['node'], $alias['name'], $arguments, $line);
                    $node->setAttribute('safe', true);

                    return $node;
                }

                $args = $this->parseArguments(true);
                $class = $this->getFunctionNodeClass($name, $line);

                return new $class($name, $args, $line);
        }
    }

    public function parseSubscriptExpression($node)
    {
        $stream = $this->parser->getStream();
        $token = $stream->next();
        $lineno = $token->getLine();
        $arguments = new Twig_Node_Expression_Array(array(), $lineno);
        $type = Twig_Template::ANY_CALL;
        if ('.' == $token->getValue()) {
            $token = $stream->next();
            if (
                /* Twig_Token::NAME_TYPE */ 5 == $token->getType()
                ||
                /* Twig_Token::NUMBER_TYPE */ 6 == $token->getType()
                ||
                (/* Twig_Token::OPERATOR_TYPE */ 8 == $token->getType() && preg_match(Twig_Lexer::REGEX_NAME, $token->getValue()))
            ) {
                $arg = new Twig_Node_Expression_Constant($token->getValue(), $lineno);

                if ($stream->test(/* Twig_Token::PUNCTUATION_TYPE */ 9, '(')) {
                    $type = Twig_Template::METHOD_CALL;
                    foreach ($this->parseArguments() as $n) {
                        $arguments->addElement($n);
                    }
                }
            } else {
                throw new Twig_Error_Syntax('Expected name or number.', $lineno, $stream->getSourceContext());
            }

            if ($node instanceof Twig_Node_Expression_Name && null !== $this->parser->getImportedSymbol('template', $node->getAttribute('name'))) {
                if (!$arg instanceof Twig_Node_Expression_Constant) {
                    throw new Twig_Error_Syntax(sprintf('Dynamic macro names are not supported (called on "%s").', $node->getAttribute('name')), $token->getLine(), $stream->getSourceContext());
                }

                $name = $arg->getAttribute('value');

                $node = new Twig_Node_Expression_MethodCall($node, 'macro_'.$name, $arguments, $lineno);
                $node->setAttribute('safe', true);

                return $node;
            }
        } else {
            $type = Twig_Template::ARRAY_CALL;

            // slice?
            $slice = false;
            if ($stream->test(/* Twig_Token::PUNCTUATION_TYPE */ 9, ':')) {
                $slice = true;
                $arg = new Twig_Node_Expression_Constant(0, $token->getLine());
            } else {
                $arg = $this->parseExpression();
            }

            if ($stream->nextIf(/* Twig_Token::PUNCTUATION_TYPE */ 9, ':')) {
                $slice = true;
            }

            if ($slice) {
                if ($stream->test(/* Twig_Token::PUNCTUATION_TYPE */ 9, ']')) {
                    $length = new Twig_Node_Expression_Constant(null, $token->getLine());
                } else {
                    $length = $this->parseExpression();
                }

                $class = $this->getFilterNodeClass('slice', $token->getLine());
                $arguments = new Twig_Node(array($arg, $length));
                $filter = new $class($node, new Twig_Node_Expression_Constant('slice', $token->getLine()), $arguments, $token->getLine());

                $stream->expect(/* Twig_Token::PUNCTUATION_TYPE */ 9, ']');

                return $filter;
            }

            $stream->expect(/* Twig_Token::PUNCTUATION_TYPE */ 9, ']');
        }

        return new Twig_Node_Expression_GetAttr($node, $arg, $arguments, $type, $lineno);
    }

    public function parseFilterExpression($node)
    {
        $this->parser->getStream()->next();

        return $this->parseFilterExpressionRaw($node);
    }

    public function parseFilterExpressionRaw($node, $tag = null)
    {
        while (true) {
            $token = $this->parser->getStream()->expect(/* Twig_Token::NAME_TYPE */ 5);

            $name = new Twig_Node_Expression_Constant($token->getValue(), $token->getLine());
            if (!$this->parser->getStream()->test(/* Twig_Token::PUNCTUATION_TYPE */ 9, '(')) {
                $arguments = new Twig_Node();
            } else {
                $arguments = $this->parseArguments(true);
            }

            $class = $this->getFilterNodeClass($name->getAttribute('value'), $token->getLine());

            $node = new $class($node, $name, $arguments, $token->getLine(), $tag);

            if (!$this->parser->getStream()->test(/* Twig_Token::PUNCTUATION_TYPE */ 9, '|')) {
                break;
            }

            $this->parser->getStream()->next();
        }

        return $node;
    }

    /**
     * Parses arguments.
     *
     * @param bool $namedArguments Whether to allow named arguments or not
     * @param bool $definition     Whether we are parsing arguments for a function definition
     *
     * @return Twig_Node
     *
     * @throws Twig_Error_Syntax
     */
    public function parseArguments($namedArguments = false, $definition = false)
    {
        $args = array();
        $stream = $this->parser->getStream();

        $stream->expect(/* Twig_Token::PUNCTUATION_TYPE */ 9, '(', 'A list of arguments must begin with an opening parenthesis');
        while (!$stream->test(/* Twig_Token::PUNCTUATION_TYPE */ 9, ')')) {
            if (!empty($args)) {
                $stream->expect(/* Twig_Token::PUNCTUATION_TYPE */ 9, ',', 'Arguments must be separated by a comma');
            }

            if ($definition) {
                $token = $stream->expect(/* Twig_Token::NAME_TYPE */ 5, null, 'An argument must be a name');
                $value = new Twig_Node_Expression_Name($token->getValue(), $this->parser->getCurrentToken()->getLine());
            } else {
                $value = $this->parseExpression();
            }

            $name = null;
            if ($namedArguments && $token = $stream->nextIf(/* Twig_Token::OPERATOR_TYPE */ 8, '=')) {
                if (!$value instanceof Twig_Node_Expression_Name) {
                    throw new Twig_Error_Syntax(sprintf('A parameter name must be a string, "%s" given.', get_class($value)), $token->getLine(), $stream->getSourceContext());
                }
                $name = $value->getAttribute('name');

                if ($definition) {
                    $value = $this->parsePrimaryExpression();

                    if (!$this->checkConstantExpression($value)) {
                        throw new Twig_Error_Syntax(sprintf('A default value for an argument must be a constant (a boolean, a string, a number, or an array).'), $token->getLine(), $stream->getSourceContext());
                    }
                } else {
                    $value = $this->parseExpression();
                }
            }

            if ($definition) {
                if (null === $name) {
                    $name = $value->getAttribute('name');
                    $value = new Twig_Node_Expression_Constant(null, $this->parser->getCurrentToken()->getLine());
                }
                $args[$name] = $value;
            } else {
                if (null === $name) {
                    $args[] = $value;
                } else {
                    $args[$name] = $value;
                }
            }
        }
        $stream->expect(/* Twig_Token::PUNCTUATION_TYPE */ 9, ')', 'A list of arguments must be closed by a parenthesis');

        return new Twig_Node($args);
    }

    public function parseAssignmentExpression()
    {
        $stream = $this->parser->getStream();
        $targets = array();
        while (true) {
            $token = $stream->expect(/* Twig_Token::NAME_TYPE */ 5, null, 'Only variables can be assigned to');
            $value = $token->getValue();
            if (in_array(strtolower($value), array('true', 'false', 'none', 'null'))) {
                throw new Twig_Error_Syntax(sprintf('You cannot assign a value to "%s".', $value), $token->getLine(), $stream->getSourceContext());
            }
            $targets[] = new Twig_Node_Expression_AssignName($value, $token->getLine());

            if (!$stream->nextIf(/* Twig_Token::PUNCTUATION_TYPE */ 9, ',')) {
                break;
            }
        }

        return new Twig_Node($targets);
    }

    public function parseMultitargetExpression()
    {
        $targets = array();
        while (true) {
            $targets[] = $this->parseExpression();
            if (!$this->parser->getStream()->nextIf(/* Twig_Token::PUNCTUATION_TYPE */ 9, ',')) {
                break;
            }
        }

        return new Twig_Node($targets);
    }

    private function parseNotTestExpression(Twig_Node $node)
    {
        return new Twig_Node_Expression_Unary_Not($this->parseTestExpression($node), $this->parser->getCurrentToken()->getLine());
    }

    private function parseTestExpression(Twig_Node $node)
    {
        $stream = $this->parser->getStream();
        list($name, $test) = $this->getTest($node->getTemplateLine());

        $class = $this->getTestNodeClass($test);
        $arguments = null;
        if ($stream->test(/* Twig_Token::PUNCTUATION_TYPE */ 9, '(')) {
            $arguments = $this->parser->getExpressionParser()->parseArguments(true);
        }

        return new $class($node, $name, $arguments, $this->parser->getCurrentToken()->getLine());
    }

    private function getTest($line)
    {
        $stream = $this->parser->getStream();
        $name = $stream->expect(/* Twig_Token::NAME_TYPE */ 5)->getValue();

        if ($test = $this->env->getTest($name)) {
            return array($name, $test);
        }

        if ($stream->test(/* Twig_Token::NAME_TYPE */ 5)) {
            // try 2-words tests
            $name = $name.' '.$this->parser->getCurrentToken()->getValue();

            if ($test = $this->env->getTest($name)) {
                $stream->next();

                return array($name, $test);
            }
        }

        $e = new Twig_Error_Syntax(sprintf('Unknown "%s" test.', $name), $line, $stream->getSourceContext());
        $e->addSuggestions($name, array_keys($this->env->getTests()));

        throw $e;
    }

    private function getTestNodeClass($test)
    {
        if ($test->isDeprecated()) {
            $stream = $this->parser->getStream();
            $message = sprintf('Twig Test "%s" is deprecated', $test->getName());

            if (!is_bool($test->getDeprecatedVersion())) {
                $message .= sprintf(' since version %s', $test->getDeprecatedVersion());
            }
            if ($test->getAlternative()) {
                $message .= sprintf('. Use "%s" instead', $test->getAlternative());
            }
            $src = $stream->getSourceContext();
            $message .= sprintf(' in %s at line %d.', $src->getPath() ?: $src->getName(), $stream->getCurrent()->getLine());

            @trigger_error($message, E_USER_DEPRECATED);
        }

        return $test->getNodeClass();
    }

    private function getFunctionNodeClass($name, $line)
    {
        if (false === $function = $this->env->getFunction($name)) {
            $e = new Twig_Error_Syntax(sprintf('Unknown "%s" function.', $name), $line, $this->parser->getStream()->getSourceContext());
            $e->addSuggestions($name, array_keys($this->env->getFunctions()));

            throw $e;
        }

        if ($function->isDeprecated()) {
            $message = sprintf('Twig Function "%s" is deprecated', $function->getName());
            if (!is_bool($function->getDeprecatedVersion())) {
                $message .= sprintf(' since version %s', $function->getDeprecatedVersion());
            }
            if ($function->getAlternative()) {
                $message .= sprintf('. Use "%s" instead', $function->getAlternative());
            }
            $src = $this->parser->getStream()->getSourceContext();
            $message .= sprintf(' in %s at line %d.', $src->getPath() ?: $src->getName(), $line);

            @trigger_error($message, E_USER_DEPRECATED);
        }

        return $function->getNodeClass();
    }

    private function getFilterNodeClass($name, $line)
    {
        if (false === $filter = $this->env->getFilter($name)) {
            $e = new Twig_Error_Syntax(sprintf('Unknown "%s" filter.', $name), $line, $this->parser->getStream()->getSourceContext());
            $e->addSuggestions($name, array_keys($this->env->getFilters()));

            throw $e;
        }

        if ($filter->isDeprecated()) {
            $message = sprintf('Twig Filter "%s" is deprecated', $filter->getName());
            if (!is_bool($filter->getDeprecatedVersion())) {
                $message .= sprintf(' since version %s', $filter->getDeprecatedVersion());
            }
            if ($filter->getAlternative()) {
                $message .= sprintf('. Use "%s" instead', $filter->getAlternative());
            }
            $src = $this->parser->getStream()->getSourceContext();
            $message .= sprintf(' in %s at line %d.', $src->getPath() ?: $src->getName(), $line);

            @trigger_error($message, E_USER_DEPRECATED);
        }

        return $filter->getNodeClass();
    }

    // checks that the node only contains "constant" elements
    private function checkConstantExpression(Twig_Node $node)
    {
        if (!($node instanceof Twig_Node_Expression_Constant || $node instanceof Twig_Node_Expression_Array
            || $node instanceof Twig_Node_Expression_Unary_Neg || $node instanceof Twig_Node_Expression_Unary_Pos
        )) {
            return false;
        }

        foreach ($node as $n) {
            if (!$this->checkConstantExpression($n)) {
                return false;
            }
        }

        return true;
    }
}

class_alias('Twig_ExpressionParser', 'Twig\ExpressionParser', false);
