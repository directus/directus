<?php
/**
 * This file is part of phpDocumentor.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 * @copyright 2010-2015 Mike van Riel<mike@phpdoc.org>
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @link      http://phpdoc.org
 */

namespace phpDocumentor\Reflection\Types;

/**
 * Convenience class to create a Context for DocBlocks when not using the Reflection Component of phpDocumentor.
 *
 * For a DocBlock to be able to resolve types that use partial namespace names or rely on namespace imports we need to
 * provide a bit of context so that the DocBlock can read that and based on it decide how to resolve the types to
 * Fully Qualified names.
 *
 * @see Context for more information.
 */
final class ContextFactory
{
    /** The literal used at the end of a use statement. */
    const T_LITERAL_END_OF_USE = ';';

    /** The literal used between sets of use statements */
    const T_LITERAL_USE_SEPARATOR = ',';

    /**
     * Build a Context given a Class Reflection.
     *
     * @param \Reflector $reflector
     *
     * @see Context for more information on Contexts.
     *
     * @return Context
     */
    public function createFromReflector(\Reflector $reflector)
    {
        if (method_exists($reflector, 'getDeclaringClass')) {
            $reflector = $reflector->getDeclaringClass();
        }

        $fileName = $reflector->getFileName();
        $namespace = $reflector->getNamespaceName();

        if (file_exists($fileName)) {
            return $this->createForNamespace($namespace, file_get_contents($fileName));
        }

        return new Context($namespace, []);
    }

    /**
     * Build a Context for a namespace in the provided file contents.
     *
     * @param string $namespace It does not matter if a `\` precedes the namespace name, this method first normalizes.
     * @param string $fileContents the file's contents to retrieve the aliases from with the given namespace.
     *
     * @see Context for more information on Contexts.
     *
     * @return Context
     */
    public function createForNamespace($namespace, $fileContents)
    {
        $namespace = trim($namespace, '\\');
        $useStatements = [];
        $currentNamespace = '';
        $tokens = new \ArrayIterator(token_get_all($fileContents));

        while ($tokens->valid()) {
            switch ($tokens->current()[0]) {
                case T_NAMESPACE:
                    $currentNamespace = $this->parseNamespace($tokens);
                    break;
                case T_CLASS:
                    // Fast-forward the iterator through the class so that any
                    // T_USE tokens found within are skipped - these are not
                    // valid namespace use statements so should be ignored.
                    $braceLevel = 0;
                    $firstBraceFound = false;
                    while ($tokens->valid() && ($braceLevel > 0 || !$firstBraceFound)) {
                        if ($tokens->current() === '{'
                            || $tokens->current()[0] === T_CURLY_OPEN
                            || $tokens->current()[0] === T_DOLLAR_OPEN_CURLY_BRACES) {
                            if (!$firstBraceFound) {
                                $firstBraceFound = true;
                            }
                            $braceLevel++;
                        }

                        if ($tokens->current() === '}') {
                            $braceLevel--;
                        }
                        $tokens->next();
                    }
                    break;
                case T_USE:
                    if ($currentNamespace === $namespace) {
                        $useStatements = array_merge($useStatements, $this->parseUseStatement($tokens));
                    }
                    break;
            }
            $tokens->next();
        }

        return new Context($namespace, $useStatements);
    }

    /**
     * Deduce the name from tokens when we are at the T_NAMESPACE token.
     *
     * @param \ArrayIterator $tokens
     *
     * @return string
     */
    private function parseNamespace(\ArrayIterator $tokens)
    {
        // skip to the first string or namespace separator
        $this->skipToNextStringOrNamespaceSeparator($tokens);

        $name = '';
        while ($tokens->valid() && ($tokens->current()[0] === T_STRING || $tokens->current()[0] === T_NS_SEPARATOR)
        ) {
            $name .= $tokens->current()[1];
            $tokens->next();
        }

        return $name;
    }

    /**
     * Deduce the names of all imports when we are at the T_USE token.
     *
     * @param \ArrayIterator $tokens
     *
     * @return string[]
     */
    private function parseUseStatement(\ArrayIterator $tokens)
    {
        $uses = [];
        $continue = true;

        while ($continue) {
            $this->skipToNextStringOrNamespaceSeparator($tokens);

            list($alias, $fqnn) = $this->extractUseStatement($tokens);
            $uses[$alias] = $fqnn;
            if ($tokens->current()[0] === self::T_LITERAL_END_OF_USE) {
                $continue = false;
            }
        }

        return $uses;
    }

    /**
     * Fast-forwards the iterator as longs as we don't encounter a T_STRING or T_NS_SEPARATOR token.
     *
     * @param \ArrayIterator $tokens
     *
     * @return void
     */
    private function skipToNextStringOrNamespaceSeparator(\ArrayIterator $tokens)
    {
        while ($tokens->valid() && ($tokens->current()[0] !== T_STRING) && ($tokens->current()[0] !== T_NS_SEPARATOR)) {
            $tokens->next();
        }
    }

    /**
     * Deduce the namespace name and alias of an import when we are at the T_USE token or have not reached the end of
     * a USE statement yet.
     *
     * @param \ArrayIterator $tokens
     *
     * @return string
     */
    private function extractUseStatement(\ArrayIterator $tokens)
    {
        $result = [''];
        while ($tokens->valid()
            && ($tokens->current()[0] !== self::T_LITERAL_USE_SEPARATOR)
            && ($tokens->current()[0] !== self::T_LITERAL_END_OF_USE)
        ) {
            if ($tokens->current()[0] === T_AS) {
                $result[] = '';
            }
            if ($tokens->current()[0] === T_STRING || $tokens->current()[0] === T_NS_SEPARATOR) {
                $result[count($result) - 1] .= $tokens->current()[1];
            }
            $tokens->next();
        }

        if (count($result) == 1) {
            $backslashPos = strrpos($result[0], '\\');

            if (false !== $backslashPos) {
                $result[] = substr($result[0], $backslashPos + 1);
            } else {
                $result[] = $result[0];
            }
        }

        return array_reverse($result);
    }
}
