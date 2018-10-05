<?php
/*
 * This file is part of php-token-stream.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * A PHP token.
 */
abstract class PHP_Token
{
    /**
     * @var string
     */
    protected $text;

    /**
     * @var int
     */
    protected $line;

    /**
     * @var PHP_Token_Stream
     */
    protected $tokenStream;

    /**
     * @var int
     */
    protected $id;

    /**
     * @param string           $text
     * @param int              $line
     * @param PHP_Token_Stream $tokenStream
     * @param int              $id
     */
    public function __construct($text, $line, PHP_Token_Stream $tokenStream, $id)
    {
        $this->text        = $text;
        $this->line        = $line;
        $this->tokenStream = $tokenStream;
        $this->id          = $id;
    }

    /**
     * @return string
     */
    public function __toString()
    {
        return $this->text;
    }

    /**
     * @return int
     */
    public function getLine()
    {
        return $this->line;
    }

    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }
}

abstract class PHP_TokenWithScope extends PHP_Token
{
    /**
     * @var int
     */
    protected $endTokenId;

    /**
     * Get the docblock for this token
     *
     * This method will fetch the docblock belonging to the current token. The
     * docblock must be placed on the line directly above the token to be
     * recognized.
     *
     * @return string|null Returns the docblock as a string if found
     */
    public function getDocblock()
    {
        $tokens            = $this->tokenStream->tokens();
        $currentLineNumber = $tokens[$this->id]->getLine();
        $prevLineNumber    = $currentLineNumber - 1;

        for ($i = $this->id - 1; $i; $i--) {
            if (!isset($tokens[$i])) {
                return;
            }

            if ($tokens[$i] instanceof PHP_Token_FUNCTION ||
                $tokens[$i] instanceof PHP_Token_CLASS ||
                $tokens[$i] instanceof PHP_Token_TRAIT) {
                // Some other trait, class or function, no docblock can be
                // used for the current token
                break;
            }

            $line = $tokens[$i]->getLine();

            if ($line == $currentLineNumber ||
                ($line == $prevLineNumber &&
                 $tokens[$i] instanceof PHP_Token_WHITESPACE)) {
                continue;
            }

            if ($line < $currentLineNumber &&
                !$tokens[$i] instanceof PHP_Token_DOC_COMMENT) {
                break;
            }

            return (string) $tokens[$i];
        }
    }

    /**
     * @return int
     */
    public function getEndTokenId()
    {
        $block  = 0;
        $i      = $this->id;
        $tokens = $this->tokenStream->tokens();

        while ($this->endTokenId === null && isset($tokens[$i])) {
            if ($tokens[$i] instanceof PHP_Token_OPEN_CURLY ||
                $tokens[$i] instanceof PHP_Token_CURLY_OPEN) {
                $block++;
            } elseif ($tokens[$i] instanceof PHP_Token_CLOSE_CURLY) {
                $block--;

                if ($block === 0) {
                    $this->endTokenId = $i;
                }
            } elseif (($this instanceof PHP_Token_FUNCTION ||
                $this instanceof PHP_Token_NAMESPACE) &&
                $tokens[$i] instanceof PHP_Token_SEMICOLON) {
                if ($block === 0) {
                    $this->endTokenId = $i;
                }
            }

            $i++;
        }

        if ($this->endTokenId === null) {
            $this->endTokenId = $this->id;
        }

        return $this->endTokenId;
    }

    /**
     * @return int
     */
    public function getEndLine()
    {
        return $this->tokenStream[$this->getEndTokenId()]->getLine();
    }
}

abstract class PHP_TokenWithScopeAndVisibility extends PHP_TokenWithScope
{
    /**
     * @return string
     */
    public function getVisibility()
    {
        $tokens = $this->tokenStream->tokens();

        for ($i = $this->id - 2; $i > $this->id - 7; $i -= 2) {
            if (isset($tokens[$i]) &&
               ($tokens[$i] instanceof PHP_Token_PRIVATE ||
                $tokens[$i] instanceof PHP_Token_PROTECTED ||
                $tokens[$i] instanceof PHP_Token_PUBLIC)) {
                return strtolower(
                    str_replace('PHP_Token_', '', get_class($tokens[$i]))
                );
            }
            if (isset($tokens[$i]) &&
              !($tokens[$i] instanceof PHP_Token_STATIC ||
                $tokens[$i] instanceof PHP_Token_FINAL ||
                $tokens[$i] instanceof PHP_Token_ABSTRACT)) {
                // no keywords; stop visibility search
                break;
            }
        }
    }

    /**
     * @return string
     */
    public function getKeywords()
    {
        $keywords = [];
        $tokens   = $this->tokenStream->tokens();

        for ($i = $this->id - 2; $i > $this->id - 7; $i -= 2) {
            if (isset($tokens[$i]) &&
               ($tokens[$i] instanceof PHP_Token_PRIVATE ||
                $tokens[$i] instanceof PHP_Token_PROTECTED ||
                $tokens[$i] instanceof PHP_Token_PUBLIC)) {
                continue;
            }

            if (isset($tokens[$i]) &&
               ($tokens[$i] instanceof PHP_Token_STATIC ||
                $tokens[$i] instanceof PHP_Token_FINAL ||
                $tokens[$i] instanceof PHP_Token_ABSTRACT)) {
                $keywords[] = strtolower(
                    str_replace('PHP_Token_', '', get_class($tokens[$i]))
                );
            }
        }

        return implode(',', $keywords);
    }
}

abstract class PHP_Token_Includes extends PHP_Token
{
    /**
     * @var string
     */
    protected $name;

    /**
     * @var string
     */
    protected $type;

    /**
     * @return string
     */
    public function getName()
    {
        if ($this->name === null) {
            $this->process();
        }

        return $this->name;
    }

    /**
     * @return string
     */
    public function getType()
    {
        if ($this->type === null) {
            $this->process();
        }

        return $this->type;
    }

    private function process()
    {
        $tokens = $this->tokenStream->tokens();

        if ($tokens[$this->id + 2] instanceof PHP_Token_CONSTANT_ENCAPSED_STRING) {
            $this->name = trim($tokens[$this->id + 2], "'\"");
            $this->type = strtolower(
                str_replace('PHP_Token_', '', get_class($tokens[$this->id]))
            );
        }
    }
}

class PHP_Token_FUNCTION extends PHP_TokenWithScopeAndVisibility
{
    /**
     * @var array
     */
    protected $arguments;

    /**
     * @var int
     */
    protected $ccn;

    /**
     * @var string
     */
    protected $name;

    /**
     * @var string
     */
    protected $signature;

    /**
     * @var bool
     */
    private $anonymous = false;

    /**
     * @return array
     */
    public function getArguments()
    {
        if ($this->arguments !== null) {
            return $this->arguments;
        }

        $this->arguments = [];
        $tokens          = $this->tokenStream->tokens();
        $typeDeclaration = null;

        // Search for first token inside brackets
        $i = $this->id + 2;

        while (!$tokens[$i - 1] instanceof PHP_Token_OPEN_BRACKET) {
            $i++;
        }

        while (!$tokens[$i] instanceof PHP_Token_CLOSE_BRACKET) {
            if ($tokens[$i] instanceof PHP_Token_STRING) {
                $typeDeclaration = (string) $tokens[$i];
            } elseif ($tokens[$i] instanceof PHP_Token_VARIABLE) {
                $this->arguments[(string) $tokens[$i]] = $typeDeclaration;
                $typeDeclaration                       = null;
            }

            $i++;
        }

        return $this->arguments;
    }

    /**
     * @return string
     */
    public function getName()
    {
        if ($this->name !== null) {
            return $this->name;
        }

        $tokens = $this->tokenStream->tokens();

        $i = $this->id + 1;

        if ($tokens[$i] instanceof PHP_Token_WHITESPACE) {
            $i++;
        }

        if ($tokens[$i] instanceof PHP_Token_AMPERSAND) {
            $i++;
        }

        if ($tokens[$i + 1] instanceof PHP_Token_OPEN_BRACKET) {
            $this->name = (string) $tokens[$i];
        } elseif ($tokens[$i + 1] instanceof PHP_Token_WHITESPACE && $tokens[$i + 2] instanceof PHP_Token_OPEN_BRACKET) {
            $this->name = (string) $tokens[$i];
        } else {
            $this->anonymous = true;

            $this->name = sprintf(
                'anonymousFunction:%s#%s',
                $this->getLine(),
                $this->getId()
            );
        }

        if (!$this->isAnonymous()) {
            for ($i = $this->id; $i; --$i) {
                if ($tokens[$i] instanceof PHP_Token_NAMESPACE) {
                    $this->name = $tokens[$i]->getName() . '\\' . $this->name;

                    break;
                }

                if ($tokens[$i] instanceof PHP_Token_INTERFACE) {
                    break;
                }
            }
        }

        return $this->name;
    }

    /**
     * @return int
     */
    public function getCCN()
    {
        if ($this->ccn !== null) {
            return $this->ccn;
        }

        $this->ccn = 1;
        $end       = $this->getEndTokenId();
        $tokens    = $this->tokenStream->tokens();

        for ($i = $this->id; $i <= $end; $i++) {
            switch (get_class($tokens[$i])) {
                case 'PHP_Token_IF':
                case 'PHP_Token_ELSEIF':
                case 'PHP_Token_FOR':
                case 'PHP_Token_FOREACH':
                case 'PHP_Token_WHILE':
                case 'PHP_Token_CASE':
                case 'PHP_Token_CATCH':
                case 'PHP_Token_BOOLEAN_AND':
                case 'PHP_Token_LOGICAL_AND':
                case 'PHP_Token_BOOLEAN_OR':
                case 'PHP_Token_LOGICAL_OR':
                case 'PHP_Token_QUESTION_MARK':
                    $this->ccn++;
                    break;
            }
        }

        return $this->ccn;
    }

    /**
     * @return string
     */
    public function getSignature()
    {
        if ($this->signature !== null) {
            return $this->signature;
        }

        if ($this->isAnonymous()) {
            $this->signature = 'anonymousFunction';
            $i               = $this->id + 1;
        } else {
            $this->signature = '';
            $i               = $this->id + 2;
        }

        $tokens = $this->tokenStream->tokens();

        while (isset($tokens[$i]) &&
               !$tokens[$i] instanceof PHP_Token_OPEN_CURLY &&
               !$tokens[$i] instanceof PHP_Token_SEMICOLON) {
            $this->signature .= $tokens[$i++];
        }

        $this->signature = trim($this->signature);

        return $this->signature;
    }

    /**
     * @return bool
     */
    public function isAnonymous()
    {
        return $this->anonymous;
    }
}

class PHP_Token_INTERFACE extends PHP_TokenWithScopeAndVisibility
{
    /**
     * @var array
     */
    protected $interfaces;

    /**
     * @return string
     */
    public function getName()
    {
        return (string) $this->tokenStream[$this->id + 2];
    }

    /**
     * @return bool
     */
    public function hasParent()
    {
        return $this->tokenStream[$this->id + 4] instanceof PHP_Token_EXTENDS;
    }

    /**
     * @return array
     */
    public function getPackage()
    {
        $className  = $this->getName();
        $docComment = $this->getDocblock();

        $result = [
            'namespace'   => '',
            'fullPackage' => '',
            'category'    => '',
            'package'     => '',
            'subpackage'  => ''
        ];

        for ($i = $this->id; $i; --$i) {
            if ($this->tokenStream[$i] instanceof PHP_Token_NAMESPACE) {
                $result['namespace'] = $this->tokenStream[$i]->getName();
                break;
            }
        }

        if (preg_match('/@category[\s]+([\.\w]+)/', $docComment, $matches)) {
            $result['category'] = $matches[1];
        }

        if (preg_match('/@package[\s]+([\.\w]+)/', $docComment, $matches)) {
            $result['package']     = $matches[1];
            $result['fullPackage'] = $matches[1];
        }

        if (preg_match('/@subpackage[\s]+([\.\w]+)/', $docComment, $matches)) {
            $result['subpackage']   = $matches[1];
            $result['fullPackage'] .= '.' . $matches[1];
        }

        if (empty($result['fullPackage'])) {
            $result['fullPackage'] = $this->arrayToName(
                explode('_', str_replace('\\', '_', $className)),
                '.'
            );
        }

        return $result;
    }

    /**
     * @param array  $parts
     * @param string $join
     *
     * @return string
     */
    protected function arrayToName(array $parts, $join = '\\')
    {
        $result = '';

        if (count($parts) > 1) {
            array_pop($parts);

            $result = implode($join, $parts);
        }

        return $result;
    }

    /**
     * @return bool|string
     */
    public function getParent()
    {
        if (!$this->hasParent()) {
            return false;
        }

        $i         = $this->id + 6;
        $tokens    = $this->tokenStream->tokens();
        $className = (string) $tokens[$i];

        while (isset($tokens[$i + 1]) &&
               !$tokens[$i + 1] instanceof PHP_Token_WHITESPACE) {
            $className .= (string) $tokens[++$i];
        }

        return $className;
    }

    /**
     * @return bool
     */
    public function hasInterfaces()
    {
        return (isset($this->tokenStream[$this->id + 4]) &&
                $this->tokenStream[$this->id + 4] instanceof PHP_Token_IMPLEMENTS) ||
               (isset($this->tokenStream[$this->id + 8]) &&
                $this->tokenStream[$this->id + 8] instanceof PHP_Token_IMPLEMENTS);
    }

    /**
     * @return array|bool
     */
    public function getInterfaces()
    {
        if ($this->interfaces !== null) {
            return $this->interfaces;
        }

        if (!$this->hasInterfaces()) {
            return ($this->interfaces = false);
        }

        if ($this->tokenStream[$this->id + 4] instanceof PHP_Token_IMPLEMENTS) {
            $i = $this->id + 3;
        } else {
            $i = $this->id + 7;
        }

        $tokens = $this->tokenStream->tokens();

        while (!$tokens[$i + 1] instanceof PHP_Token_OPEN_CURLY) {
            $i++;

            if ($tokens[$i] instanceof PHP_Token_STRING) {
                $this->interfaces[] = (string) $tokens[$i];
            }
        }

        return $this->interfaces;
    }
}

class PHP_Token_ABSTRACT extends PHP_Token
{
}

class PHP_Token_AMPERSAND extends PHP_Token
{
}

class PHP_Token_AND_EQUAL extends PHP_Token
{
}

class PHP_Token_ARRAY extends PHP_Token
{
}

class PHP_Token_ARRAY_CAST extends PHP_Token
{
}

class PHP_Token_AS extends PHP_Token
{
}

class PHP_Token_AT extends PHP_Token
{
}

class PHP_Token_BACKTICK extends PHP_Token
{
}

class PHP_Token_BAD_CHARACTER extends PHP_Token
{
}

class PHP_Token_BOOLEAN_AND extends PHP_Token
{
}

class PHP_Token_BOOLEAN_OR extends PHP_Token
{
}

class PHP_Token_BOOL_CAST extends PHP_Token
{
}

class PHP_Token_BREAK extends PHP_Token
{
}

class PHP_Token_CARET extends PHP_Token
{
}

class PHP_Token_CASE extends PHP_Token
{
}

class PHP_Token_CATCH extends PHP_Token
{
}

class PHP_Token_CHARACTER extends PHP_Token
{
}

class PHP_Token_CLASS extends PHP_Token_INTERFACE
{
    /**
     * @var bool
     */
    private $anonymous = false;

    /**
     * @var string
     */
    private $name;

    /**
     * @return string
     */
    public function getName()
    {
        if ($this->name !== null) {
            return $this->name;
        }

        $next = $this->tokenStream[$this->id + 1];

        if ($next instanceof PHP_Token_WHITESPACE) {
            $next = $this->tokenStream[$this->id + 2];
        }

        if ($next instanceof PHP_Token_STRING) {
            $this->name =(string) $next;

            return $this->name;
        }

        if ($next instanceof PHP_Token_OPEN_CURLY ||
            $next instanceof PHP_Token_EXTENDS ||
            $next instanceof PHP_Token_IMPLEMENTS) {

            $this->name = sprintf(
                'AnonymousClass:%s#%s',
                $this->getLine(),
                $this->getId()
            );

            $this->anonymous = true;

            return $this->name;
        }
    }

    public function isAnonymous()
    {
        return $this->anonymous;
    }
}

class PHP_Token_CLASS_C extends PHP_Token
{
}

class PHP_Token_CLASS_NAME_CONSTANT extends PHP_Token
{
}

class PHP_Token_CLONE extends PHP_Token
{
}

class PHP_Token_CLOSE_BRACKET extends PHP_Token
{
}

class PHP_Token_CLOSE_CURLY extends PHP_Token
{
}

class PHP_Token_CLOSE_SQUARE extends PHP_Token
{
}

class PHP_Token_CLOSE_TAG extends PHP_Token
{
}

class PHP_Token_COLON extends PHP_Token
{
}

class PHP_Token_COMMA extends PHP_Token
{
}

class PHP_Token_COMMENT extends PHP_Token
{
}

class PHP_Token_CONCAT_EQUAL extends PHP_Token
{
}

class PHP_Token_CONST extends PHP_Token
{
}

class PHP_Token_CONSTANT_ENCAPSED_STRING extends PHP_Token
{
}

class PHP_Token_CONTINUE extends PHP_Token
{
}

class PHP_Token_CURLY_OPEN extends PHP_Token
{
}

class PHP_Token_DEC extends PHP_Token
{
}

class PHP_Token_DECLARE extends PHP_Token
{
}

class PHP_Token_DEFAULT extends PHP_Token
{
}

class PHP_Token_DIV extends PHP_Token
{
}

class PHP_Token_DIV_EQUAL extends PHP_Token
{
}

class PHP_Token_DNUMBER extends PHP_Token
{
}

class PHP_Token_DO extends PHP_Token
{
}

class PHP_Token_DOC_COMMENT extends PHP_Token
{
}

class PHP_Token_DOLLAR extends PHP_Token
{
}

class PHP_Token_DOLLAR_OPEN_CURLY_BRACES extends PHP_Token
{
}

class PHP_Token_DOT extends PHP_Token
{
}

class PHP_Token_DOUBLE_ARROW extends PHP_Token
{
}

class PHP_Token_DOUBLE_CAST extends PHP_Token
{
}

class PHP_Token_DOUBLE_COLON extends PHP_Token
{
}

class PHP_Token_DOUBLE_QUOTES extends PHP_Token
{
}

class PHP_Token_ECHO extends PHP_Token
{
}

class PHP_Token_ELSE extends PHP_Token
{
}

class PHP_Token_ELSEIF extends PHP_Token
{
}

class PHP_Token_EMPTY extends PHP_Token
{
}

class PHP_Token_ENCAPSED_AND_WHITESPACE extends PHP_Token
{
}

class PHP_Token_ENDDECLARE extends PHP_Token
{
}

class PHP_Token_ENDFOR extends PHP_Token
{
}

class PHP_Token_ENDFOREACH extends PHP_Token
{
}

class PHP_Token_ENDIF extends PHP_Token
{
}

class PHP_Token_ENDSWITCH extends PHP_Token
{
}

class PHP_Token_ENDWHILE extends PHP_Token
{
}

class PHP_Token_END_HEREDOC extends PHP_Token
{
}

class PHP_Token_EQUAL extends PHP_Token
{
}

class PHP_Token_EVAL extends PHP_Token
{
}

class PHP_Token_EXCLAMATION_MARK extends PHP_Token
{
}

class PHP_Token_EXIT extends PHP_Token
{
}

class PHP_Token_EXTENDS extends PHP_Token
{
}

class PHP_Token_FILE extends PHP_Token
{
}

class PHP_Token_FINAL extends PHP_Token
{
}

class PHP_Token_FOR extends PHP_Token
{
}

class PHP_Token_FOREACH extends PHP_Token
{
}

class PHP_Token_FUNC_C extends PHP_Token
{
}

class PHP_Token_GLOBAL extends PHP_Token
{
}

class PHP_Token_GT extends PHP_Token
{
}

class PHP_Token_IF extends PHP_Token
{
}

class PHP_Token_IMPLEMENTS extends PHP_Token
{
}

class PHP_Token_INC extends PHP_Token
{
}

class PHP_Token_INCLUDE extends PHP_Token_Includes
{
}

class PHP_Token_INCLUDE_ONCE extends PHP_Token_Includes
{
}

class PHP_Token_INLINE_HTML extends PHP_Token
{
}

class PHP_Token_INSTANCEOF extends PHP_Token
{
}

class PHP_Token_INT_CAST extends PHP_Token
{
}

class PHP_Token_ISSET extends PHP_Token
{
}

class PHP_Token_IS_EQUAL extends PHP_Token
{
}

class PHP_Token_IS_GREATER_OR_EQUAL extends PHP_Token
{
}

class PHP_Token_IS_IDENTICAL extends PHP_Token
{
}

class PHP_Token_IS_NOT_EQUAL extends PHP_Token
{
}

class PHP_Token_IS_NOT_IDENTICAL extends PHP_Token
{
}

class PHP_Token_IS_SMALLER_OR_EQUAL extends PHP_Token
{
}

class PHP_Token_LINE extends PHP_Token
{
}

class PHP_Token_LIST extends PHP_Token
{
}

class PHP_Token_LNUMBER extends PHP_Token
{
}

class PHP_Token_LOGICAL_AND extends PHP_Token
{
}

class PHP_Token_LOGICAL_OR extends PHP_Token
{
}

class PHP_Token_LOGICAL_XOR extends PHP_Token
{
}

class PHP_Token_LT extends PHP_Token
{
}

class PHP_Token_METHOD_C extends PHP_Token
{
}

class PHP_Token_MINUS extends PHP_Token
{
}

class PHP_Token_MINUS_EQUAL extends PHP_Token
{
}

class PHP_Token_MOD_EQUAL extends PHP_Token
{
}

class PHP_Token_MULT extends PHP_Token
{
}

class PHP_Token_MUL_EQUAL extends PHP_Token
{
}

class PHP_Token_NEW extends PHP_Token
{
}

class PHP_Token_NUM_STRING extends PHP_Token
{
}

class PHP_Token_OBJECT_CAST extends PHP_Token
{
}

class PHP_Token_OBJECT_OPERATOR extends PHP_Token
{
}

class PHP_Token_OPEN_BRACKET extends PHP_Token
{
}

class PHP_Token_OPEN_CURLY extends PHP_Token
{
}

class PHP_Token_OPEN_SQUARE extends PHP_Token
{
}

class PHP_Token_OPEN_TAG extends PHP_Token
{
}

class PHP_Token_OPEN_TAG_WITH_ECHO extends PHP_Token
{
}

class PHP_Token_OR_EQUAL extends PHP_Token
{
}

class PHP_Token_PAAMAYIM_NEKUDOTAYIM extends PHP_Token
{
}

class PHP_Token_PERCENT extends PHP_Token
{
}

class PHP_Token_PIPE extends PHP_Token
{
}

class PHP_Token_PLUS extends PHP_Token
{
}

class PHP_Token_PLUS_EQUAL extends PHP_Token
{
}

class PHP_Token_PRINT extends PHP_Token
{
}

class PHP_Token_PRIVATE extends PHP_Token
{
}

class PHP_Token_PROTECTED extends PHP_Token
{
}

class PHP_Token_PUBLIC extends PHP_Token
{
}

class PHP_Token_QUESTION_MARK extends PHP_Token
{
}

class PHP_Token_REQUIRE extends PHP_Token_Includes
{
}

class PHP_Token_REQUIRE_ONCE extends PHP_Token_Includes
{
}

class PHP_Token_RETURN extends PHP_Token
{
}

class PHP_Token_SEMICOLON extends PHP_Token
{
}

class PHP_Token_SL extends PHP_Token
{
}

class PHP_Token_SL_EQUAL extends PHP_Token
{
}

class PHP_Token_SR extends PHP_Token
{
}

class PHP_Token_SR_EQUAL extends PHP_Token
{
}

class PHP_Token_START_HEREDOC extends PHP_Token
{
}

class PHP_Token_STATIC extends PHP_Token
{
}

class PHP_Token_STRING extends PHP_Token
{
}

class PHP_Token_STRING_CAST extends PHP_Token
{
}

class PHP_Token_STRING_VARNAME extends PHP_Token
{
}

class PHP_Token_SWITCH extends PHP_Token
{
}

class PHP_Token_THROW extends PHP_Token
{
}

class PHP_Token_TILDE extends PHP_Token
{
}

class PHP_Token_TRY extends PHP_Token
{
}

class PHP_Token_UNSET extends PHP_Token
{
}

class PHP_Token_UNSET_CAST extends PHP_Token
{
}

class PHP_Token_USE extends PHP_Token
{
}

class PHP_Token_USE_FUNCTION extends PHP_Token
{
}

class PHP_Token_VAR extends PHP_Token
{
}

class PHP_Token_VARIABLE extends PHP_Token
{
}

class PHP_Token_WHILE extends PHP_Token
{
}

class PHP_Token_WHITESPACE extends PHP_Token
{
}

class PHP_Token_XOR_EQUAL extends PHP_Token
{
}

// Tokens introduced in PHP 5.1
class PHP_Token_HALT_COMPILER extends PHP_Token
{
}

// Tokens introduced in PHP 5.3
class PHP_Token_DIR extends PHP_Token
{
}

class PHP_Token_GOTO extends PHP_Token
{
}

class PHP_Token_NAMESPACE extends PHP_TokenWithScope
{
    /**
     * @return string
     */
    public function getName()
    {
        $tokens    = $this->tokenStream->tokens();
        $namespace = (string) $tokens[$this->id + 2];

        for ($i = $this->id + 3;; $i += 2) {
            if (isset($tokens[$i]) &&
                $tokens[$i] instanceof PHP_Token_NS_SEPARATOR) {
                $namespace .= '\\' . $tokens[$i + 1];
            } else {
                break;
            }
        }

        return $namespace;
    }
}

class PHP_Token_NS_C extends PHP_Token
{
}

class PHP_Token_NS_SEPARATOR extends PHP_Token
{
}

// Tokens introduced in PHP 5.4
class PHP_Token_CALLABLE extends PHP_Token
{
}

class PHP_Token_INSTEADOF extends PHP_Token
{
}

class PHP_Token_TRAIT extends PHP_Token_INTERFACE
{
}

class PHP_Token_TRAIT_C extends PHP_Token
{
}

// Tokens introduced in PHP 5.5
class PHP_Token_FINALLY extends PHP_Token
{
}

class PHP_Token_YIELD extends PHP_Token
{
}

// Tokens introduced in PHP 5.6
class PHP_Token_ELLIPSIS extends PHP_Token
{
}

class PHP_Token_POW extends PHP_Token
{
}

class PHP_Token_POW_EQUAL extends PHP_Token
{
}

// Tokens introduced in PHP 7.0
class PHP_Token_COALESCE extends PHP_Token
{
}

class PHP_Token_SPACESHIP extends PHP_Token
{
}

class PHP_Token_YIELD_FROM extends PHP_Token
{
}

// Tokens introduced in HackLang / HHVM
class PHP_Token_ASYNC extends PHP_Token
{
}

class PHP_Token_AWAIT extends PHP_Token
{
}

class PHP_Token_COMPILER_HALT_OFFSET extends PHP_Token
{
}

class PHP_Token_ENUM extends PHP_Token
{
}

class PHP_Token_EQUALS extends PHP_Token
{
}

class PHP_Token_IN extends PHP_Token
{
}

class PHP_Token_JOIN extends PHP_Token
{
}

class PHP_Token_LAMBDA_ARROW extends PHP_Token
{
}

class PHP_Token_LAMBDA_CP extends PHP_Token
{
}

class PHP_Token_LAMBDA_OP extends PHP_Token
{
}

class PHP_Token_ONUMBER extends PHP_Token
{
}

class PHP_Token_NULLSAFE_OBJECT_OPERATOR extends PHP_Token
{
}

class PHP_Token_SHAPE extends PHP_Token
{
}

class PHP_Token_SUPER extends PHP_Token
{
}

class PHP_Token_TYPE extends PHP_Token
{
}

class PHP_Token_TYPELIST_GT extends PHP_Token
{
}

class PHP_Token_TYPELIST_LT extends PHP_Token
{
}

class PHP_Token_WHERE extends PHP_Token
{
}

class PHP_Token_XHP_ATTRIBUTE extends PHP_Token
{
}

class PHP_Token_XHP_CATEGORY extends PHP_Token
{
}

class PHP_Token_XHP_CATEGORY_LABEL extends PHP_Token
{
}

class PHP_Token_XHP_CHILDREN extends PHP_Token
{
}

class PHP_Token_XHP_LABEL extends PHP_Token
{
}

class PHP_Token_XHP_REQUIRED extends PHP_Token
{
}

class PHP_Token_XHP_TAG_GT extends PHP_Token
{
}

class PHP_Token_XHP_TAG_LT extends PHP_Token
{
}

class PHP_Token_XHP_TEXT extends PHP_Token
{
}
