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

namespace phpDocumentor\Reflection\DocBlock;

use phpDocumentor\Reflection\Types\Context as TypeContext;

/**
 * Creates a new Description object given a body of text.
 *
 * Descriptions in phpDocumentor are somewhat complex entities as they can contain one or more tags inside their
 * body that can be replaced with a readable output. The replacing is done by passing a Formatter object to the
 * Description object's `render` method.
 *
 * In addition to the above does a Description support two types of escape sequences:
 *
 * 1. `{@}` to escape the `@` character to prevent it from being interpreted as part of a tag, i.e. `{{@}link}`
 * 2. `{}` to escape the `}` character, this can be used if you want to use the `}` character in the description
 *    of an inline tag.
 *
 * If a body consists of multiple lines then this factory will also remove any superfluous whitespace at the beginning
 * of each line while maintaining any indentation that is used. This will prevent formatting parsers from tripping
 * over unexpected spaces as can be observed with tag descriptions.
 */
class DescriptionFactory
{
    /** @var TagFactory */
    private $tagFactory;

    /**
     * Initializes this factory with the means to construct (inline) tags.
     *
     * @param TagFactory $tagFactory
     */
    public function __construct(TagFactory $tagFactory)
    {
        $this->tagFactory = $tagFactory;
    }

    /**
     * Returns the parsed text of this description.
     *
     * @param string $contents
     * @param TypeContext $context
     *
     * @return Description
     */
    public function create($contents, TypeContext $context = null)
    {
        list($text, $tags) = $this->parse($this->lex($contents), $context);

        return new Description($text, $tags);
    }

    /**
     * Strips the contents from superfluous whitespace and splits the description into a series of tokens.
     *
     * @param string $contents
     *
     * @return string[] A series of tokens of which the description text is composed.
     */
    private function lex($contents)
    {
        $contents = $this->removeSuperfluousStartingWhitespace($contents);

        // performance optimalization; if there is no inline tag, don't bother splitting it up.
        if (strpos($contents, '{@') === false) {
            return [$contents];
        }

        return preg_split(
            '/\{
                # "{@}" is not a valid inline tag. This ensures that we do not treat it as one, but treat it literally.
                (?!@\})
                # We want to capture the whole tag line, but without the inline tag delimiters.
                (\@
                    # Match everything up to the next delimiter.
                    [^{}]*
                    # Nested inline tag content should not be captured, or it will appear in the result separately.
                    (?:
                        # Match nested inline tags.
                        (?:
                            # Because we did not catch the tag delimiters earlier, we must be explicit with them here.
                            # Notice that this also matches "{}", as a way to later introduce it as an escape sequence.
                            \{(?1)?\}
                            |
                            # Make sure we match hanging "{".
                            \{
                        )
                        # Match content after the nested inline tag.
                        [^{}]*
                    )* # If there are more inline tags, match them as well. We use "*" since there may not be any
                       # nested inline tags.
                )
            \}/Sux',
            $contents,
            null,
            PREG_SPLIT_DELIM_CAPTURE
        );
    }

    /**
     * Parses the stream of tokens in to a new set of tokens containing Tags.
     *
     * @param string[] $tokens
     * @param TypeContext $context
     *
     * @return string[]|Tag[]
     */
    private function parse($tokens, TypeContext $context)
    {
        $count = count($tokens);
        $tagCount = 0;
        $tags  = [];

        for ($i = 1; $i < $count; $i += 2) {
            $tags[] = $this->tagFactory->create($tokens[$i], $context);
            $tokens[$i] = '%' . ++$tagCount . '$s';
        }

        //In order to allow "literal" inline tags, the otherwise invalid
        //sequence "{@}" is changed to "@", and "{}" is changed to "}".
        //"%" is escaped to "%%" because of vsprintf.
        //See unit tests for examples.
        for ($i = 0; $i < $count; $i += 2) {
            $tokens[$i] = str_replace(['{@}', '{}', '%'], ['@', '}', '%%'], $tokens[$i]);
        }

        return [implode('', $tokens), $tags];
    }

    /**
     * Removes the superfluous from a multi-line description.
     *
     * When a description has more than one line then it can happen that the second and subsequent lines have an
     * additional indentation. This is commonly in use with tags like this:
     *
     *     {@}since 1.1.0 This is an example
     *         description where we have an
     *         indentation in the second and
     *         subsequent lines.
     *
     * If we do not normalize the indentation then we have superfluous whitespace on the second and subsequent
     * lines and this may cause rendering issues when, for example, using a Markdown converter.
     *
     * @param string $contents
     *
     * @return string
     */
    private function removeSuperfluousStartingWhitespace($contents)
    {
        $lines = explode("\n", $contents);

        // if there is only one line then we don't have lines with superfluous whitespace and
        // can use the contents as-is
        if (count($lines) <= 1) {
            return $contents;
        }

        // determine how many whitespace characters need to be stripped
        $startingSpaceCount = 9999999;
        for ($i = 1; $i < count($lines); $i++) {
            // lines with a no length do not count as they are not indented at all
            if (strlen(trim($lines[$i])) === 0) {
                continue;
            }

            // determine the number of prefixing spaces by checking the difference in line length before and after
            // an ltrim
            $startingSpaceCount = min($startingSpaceCount, strlen($lines[$i]) - strlen(ltrim($lines[$i])));
        }

        // strip the number of spaces from each line
        if ($startingSpaceCount > 0) {
            for ($i = 1; $i < count($lines); $i++) {
                $lines[$i] = substr($lines[$i], $startingSpaceCount);
            }
        }

        return implode("\n", $lines);
    }
}
