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
 * Lexes a template string.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Lexer
{
    private $tokens;
    private $code;
    private $cursor;
    private $lineno;
    private $end;
    private $state;
    private $states;
    private $brackets;
    private $env;
    private $source;
    private $options;
    private $regexes;
    private $position;
    private $positions;
    private $currentVarBlockLine;

    const STATE_DATA = 0;
    const STATE_BLOCK = 1;
    const STATE_VAR = 2;
    const STATE_STRING = 3;
    const STATE_INTERPOLATION = 4;

    const REGEX_NAME = '/[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/A';
    const REGEX_NUMBER = '/[0-9]+(?:\.[0-9]+)?/A';
    const REGEX_STRING = '/"([^#"\\\\]*(?:\\\\.[^#"\\\\]*)*)"|\'([^\'\\\\]*(?:\\\\.[^\'\\\\]*)*)\'/As';
    const REGEX_DQ_STRING_DELIM = '/"/A';
    const REGEX_DQ_STRING_PART = '/[^#"\\\\]*(?:(?:\\\\.|#(?!\{))[^#"\\\\]*)*/As';
    const PUNCTUATION = '()[]{}?:.,|';

    public function __construct(Twig_Environment $env, array $options = array())
    {
        $this->env = $env;

        $this->options = array_merge(array(
            'tag_comment' => array('{#', '#}'),
            'tag_block' => array('{%', '%}'),
            'tag_variable' => array('{{', '}}'),
            'whitespace_trim' => '-',
            'interpolation' => array('#{', '}'),
        ), $options);

        $this->regexes = array(
            'lex_var' => '/\s*'.preg_quote($this->options['whitespace_trim'].$this->options['tag_variable'][1], '/').'\s*|\s*'.preg_quote($this->options['tag_variable'][1], '/').'/A',
            'lex_block' => '/\s*(?:'.preg_quote($this->options['whitespace_trim'].$this->options['tag_block'][1], '/').'\s*|\s*'.preg_quote($this->options['tag_block'][1], '/').')\n?/A',
            'lex_raw_data' => '/('.preg_quote($this->options['tag_block'][0].$this->options['whitespace_trim'], '/').'|'.preg_quote($this->options['tag_block'][0], '/').')\s*(?:endverbatim)\s*(?:'.preg_quote($this->options['whitespace_trim'].$this->options['tag_block'][1], '/').'\s*|\s*'.preg_quote($this->options['tag_block'][1], '/').')/s',
            'operator' => $this->getOperatorRegex(),
            'lex_comment' => '/(?:'.preg_quote($this->options['whitespace_trim'], '/').preg_quote($this->options['tag_comment'][1], '/').'\s*|'.preg_quote($this->options['tag_comment'][1], '/').')\n?/s',
            'lex_block_raw' => '/\s*verbatim\s*(?:'.preg_quote($this->options['whitespace_trim'].$this->options['tag_block'][1], '/').'\s*|\s*'.preg_quote($this->options['tag_block'][1], '/').')/As',
            'lex_block_line' => '/\s*line\s+(\d+)\s*'.preg_quote($this->options['tag_block'][1], '/').'/As',
            'lex_tokens_start' => '/('.preg_quote($this->options['tag_variable'][0], '/').'|'.preg_quote($this->options['tag_block'][0], '/').'|'.preg_quote($this->options['tag_comment'][0], '/').')('.preg_quote($this->options['whitespace_trim'], '/').')?/s',
            'interpolation_start' => '/'.preg_quote($this->options['interpolation'][0], '/').'\s*/A',
            'interpolation_end' => '/\s*'.preg_quote($this->options['interpolation'][1], '/').'/A',
        );
    }

    public function tokenize(Twig_Source $source)
    {
        $this->source = $source;
        $this->code = str_replace(array("\r\n", "\r"), "\n", $source->getCode());
        $this->cursor = 0;
        $this->lineno = 1;
        $this->end = strlen($this->code);
        $this->tokens = array();
        $this->state = self::STATE_DATA;
        $this->states = array();
        $this->brackets = array();
        $this->position = -1;

        // find all token starts in one go
        preg_match_all($this->regexes['lex_tokens_start'], $this->code, $matches, PREG_OFFSET_CAPTURE);
        $this->positions = $matches;

        while ($this->cursor < $this->end) {
            // dispatch to the lexing functions depending
            // on the current state
            switch ($this->state) {
                case self::STATE_DATA:
                    $this->lexData();
                    break;

                case self::STATE_BLOCK:
                    $this->lexBlock();
                    break;

                case self::STATE_VAR:
                    $this->lexVar();
                    break;

                case self::STATE_STRING:
                    $this->lexString();
                    break;

                case self::STATE_INTERPOLATION:
                    $this->lexInterpolation();
                    break;
            }
        }

        $this->pushToken(/* Twig_Token::EOF_TYPE */ -1);

        if (!empty($this->brackets)) {
            list($expect, $lineno) = array_pop($this->brackets);
            throw new Twig_Error_Syntax(sprintf('Unclosed "%s".', $expect), $lineno, $this->source);
        }

        return new Twig_TokenStream($this->tokens, $this->source);
    }

    private function lexData()
    {
        // if no matches are left we return the rest of the template as simple text token
        if ($this->position == count($this->positions[0]) - 1) {
            $this->pushToken(/* Twig_Token::TEXT_TYPE */ 0, substr($this->code, $this->cursor));
            $this->cursor = $this->end;

            return;
        }

        // Find the first token after the current cursor
        $position = $this->positions[0][++$this->position];
        while ($position[1] < $this->cursor) {
            if ($this->position == count($this->positions[0]) - 1) {
                return;
            }
            $position = $this->positions[0][++$this->position];
        }

        // push the template text first
        $text = $textContent = substr($this->code, $this->cursor, $position[1] - $this->cursor);
        if (isset($this->positions[2][$this->position][0])) {
            $text = rtrim($text);
        }
        $this->pushToken(/* Twig_Token::TEXT_TYPE */ 0, $text);
        $this->moveCursor($textContent.$position[0]);

        switch ($this->positions[1][$this->position][0]) {
            case $this->options['tag_comment'][0]:
                $this->lexComment();
                break;

            case $this->options['tag_block'][0]:
                // raw data?
                if (preg_match($this->regexes['lex_block_raw'], $this->code, $match, null, $this->cursor)) {
                    $this->moveCursor($match[0]);
                    $this->lexRawData();
                // {% line \d+ %}
                } elseif (preg_match($this->regexes['lex_block_line'], $this->code, $match, null, $this->cursor)) {
                    $this->moveCursor($match[0]);
                    $this->lineno = (int) $match[1];
                } else {
                    $this->pushToken(/* Twig_Token::BLOCK_START_TYPE */ 1);
                    $this->pushState(self::STATE_BLOCK);
                    $this->currentVarBlockLine = $this->lineno;
                }
                break;

            case $this->options['tag_variable'][0]:
                $this->pushToken(/* Twig_Token::VAR_START_TYPE */ 2);
                $this->pushState(self::STATE_VAR);
                $this->currentVarBlockLine = $this->lineno;
                break;
        }
    }

    private function lexBlock()
    {
        if (empty($this->brackets) && preg_match($this->regexes['lex_block'], $this->code, $match, null, $this->cursor)) {
            $this->pushToken(/* Twig_Token::BLOCK_END_TYPE */ 3);
            $this->moveCursor($match[0]);
            $this->popState();
        } else {
            $this->lexExpression();
        }
    }

    private function lexVar()
    {
        if (empty($this->brackets) && preg_match($this->regexes['lex_var'], $this->code, $match, null, $this->cursor)) {
            $this->pushToken(/* Twig_Token::VAR_END_TYPE */ 4);
            $this->moveCursor($match[0]);
            $this->popState();
        } else {
            $this->lexExpression();
        }
    }

    private function lexExpression()
    {
        // whitespace
        if (preg_match('/\s+/A', $this->code, $match, null, $this->cursor)) {
            $this->moveCursor($match[0]);

            if ($this->cursor >= $this->end) {
                throw new Twig_Error_Syntax(sprintf('Unclosed "%s".', self::STATE_BLOCK === $this->state ? 'block' : 'variable'), $this->currentVarBlockLine, $this->source);
            }
        }

        // operators
        if (preg_match($this->regexes['operator'], $this->code, $match, null, $this->cursor)) {
            $this->pushToken(/* Twig_Token::OPERATOR_TYPE */ 8, preg_replace('/\s+/', ' ', $match[0]));
            $this->moveCursor($match[0]);
        }
        // names
        elseif (preg_match(self::REGEX_NAME, $this->code, $match, null, $this->cursor)) {
            $this->pushToken(/* Twig_Token::NAME_TYPE */ 5, $match[0]);
            $this->moveCursor($match[0]);
        }
        // numbers
        elseif (preg_match(self::REGEX_NUMBER, $this->code, $match, null, $this->cursor)) {
            $number = (float) $match[0];  // floats
            if (ctype_digit($match[0]) && $number <= PHP_INT_MAX) {
                $number = (int) $match[0]; // integers lower than the maximum
            }
            $this->pushToken(/* Twig_Token::NUMBER_TYPE */ 6, $number);
            $this->moveCursor($match[0]);
        }
        // punctuation
        elseif (false !== strpos(self::PUNCTUATION, $this->code[$this->cursor])) {
            // opening bracket
            if (false !== strpos('([{', $this->code[$this->cursor])) {
                $this->brackets[] = array($this->code[$this->cursor], $this->lineno);
            }
            // closing bracket
            elseif (false !== strpos(')]}', $this->code[$this->cursor])) {
                if (empty($this->brackets)) {
                    throw new Twig_Error_Syntax(sprintf('Unexpected "%s".', $this->code[$this->cursor]), $this->lineno, $this->source);
                }

                list($expect, $lineno) = array_pop($this->brackets);
                if ($this->code[$this->cursor] != strtr($expect, '([{', ')]}')) {
                    throw new Twig_Error_Syntax(sprintf('Unclosed "%s".', $expect), $lineno, $this->source);
                }
            }

            $this->pushToken(/* Twig_Token::PUNCTUATION_TYPE */ 9, $this->code[$this->cursor]);
            ++$this->cursor;
        }
        // strings
        elseif (preg_match(self::REGEX_STRING, $this->code, $match, null, $this->cursor)) {
            $this->pushToken(/* Twig_Token::STRING_TYPE */ 7, stripcslashes(substr($match[0], 1, -1)));
            $this->moveCursor($match[0]);
        }
        // opening double quoted string
        elseif (preg_match(self::REGEX_DQ_STRING_DELIM, $this->code, $match, null, $this->cursor)) {
            $this->brackets[] = array('"', $this->lineno);
            $this->pushState(self::STATE_STRING);
            $this->moveCursor($match[0]);
        }
        // unlexable
        else {
            throw new Twig_Error_Syntax(sprintf('Unexpected character "%s".', $this->code[$this->cursor]), $this->lineno, $this->source);
        }
    }

    private function lexRawData()
    {
        if (!preg_match($this->regexes['lex_raw_data'], $this->code, $match, PREG_OFFSET_CAPTURE, $this->cursor)) {
            throw new Twig_Error_Syntax('Unexpected end of file: Unclosed "verbatim" block.', $this->lineno, $this->source);
        }

        $text = substr($this->code, $this->cursor, $match[0][1] - $this->cursor);
        $this->moveCursor($text.$match[0][0]);

        if (false !== strpos($match[1][0], $this->options['whitespace_trim'])) {
            $text = rtrim($text);
        }

        $this->pushToken(/* Twig_Token::TEXT_TYPE */ 0, $text);
    }

    private function lexComment()
    {
        if (!preg_match($this->regexes['lex_comment'], $this->code, $match, PREG_OFFSET_CAPTURE, $this->cursor)) {
            throw new Twig_Error_Syntax('Unclosed comment.', $this->lineno, $this->source);
        }

        $this->moveCursor(substr($this->code, $this->cursor, $match[0][1] - $this->cursor).$match[0][0]);
    }

    private function lexString()
    {
        if (preg_match($this->regexes['interpolation_start'], $this->code, $match, null, $this->cursor)) {
            $this->brackets[] = array($this->options['interpolation'][0], $this->lineno);
            $this->pushToken(/* Twig_Token::INTERPOLATION_START_TYPE */ 10);
            $this->moveCursor($match[0]);
            $this->pushState(self::STATE_INTERPOLATION);
        } elseif (preg_match(self::REGEX_DQ_STRING_PART, $this->code, $match, null, $this->cursor) && strlen($match[0]) > 0) {
            $this->pushToken(/* Twig_Token::STRING_TYPE */ 7, stripcslashes($match[0]));
            $this->moveCursor($match[0]);
        } elseif (preg_match(self::REGEX_DQ_STRING_DELIM, $this->code, $match, null, $this->cursor)) {
            list($expect, $lineno) = array_pop($this->brackets);
            if ('"' != $this->code[$this->cursor]) {
                throw new Twig_Error_Syntax(sprintf('Unclosed "%s".', $expect), $lineno, $this->source);
            }

            $this->popState();
            ++$this->cursor;
        } else {
            // unlexable
            throw new Twig_Error_Syntax(sprintf('Unexpected character "%s".', $this->code[$this->cursor]), $this->lineno, $this->source);
        }
    }

    private function lexInterpolation()
    {
        $bracket = end($this->brackets);
        if ($this->options['interpolation'][0] === $bracket[0] && preg_match($this->regexes['interpolation_end'], $this->code, $match, null, $this->cursor)) {
            array_pop($this->brackets);
            $this->pushToken(/* Twig_Token::INTERPOLATION_END_TYPE */ 11);
            $this->moveCursor($match[0]);
            $this->popState();
        } else {
            $this->lexExpression();
        }
    }

    private function pushToken($type, $value = '')
    {
        // do not push empty text tokens
        if (/* Twig_Token::TEXT_TYPE */ 0 === $type && '' === $value) {
            return;
        }

        $this->tokens[] = new Twig_Token($type, $value, $this->lineno);
    }

    private function moveCursor($text)
    {
        $this->cursor += strlen($text);
        $this->lineno += substr_count($text, "\n");
    }

    private function getOperatorRegex()
    {
        $operators = array_merge(
            array('='),
            array_keys($this->env->getUnaryOperators()),
            array_keys($this->env->getBinaryOperators())
        );

        $operators = array_combine($operators, array_map('strlen', $operators));
        arsort($operators);

        $regex = array();
        foreach ($operators as $operator => $length) {
            // an operator that ends with a character must be followed by
            // a whitespace or a parenthesis
            if (ctype_alpha($operator[$length - 1])) {
                $r = preg_quote($operator, '/').'(?=[\s()])';
            } else {
                $r = preg_quote($operator, '/');
            }

            // an operator with a space can be any amount of whitespaces
            $r = preg_replace('/\s+/', '\s+', $r);

            $regex[] = $r;
        }

        return '/'.implode('|', $regex).'/A';
    }

    private function pushState($state)
    {
        $this->states[] = $this->state;
        $this->state = $state;
    }

    private function popState()
    {
        if (0 === count($this->states)) {
            throw new LogicException('Cannot pop state without a previous state.');
        }

        $this->state = array_pop($this->states);
    }
}

class_alias('Twig_Lexer', 'Twig\Lexer', false);
