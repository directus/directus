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

namespace phpDocumentor\Reflection\DocBlock\Tags;

use phpDocumentor\Reflection\DocBlock\Description;
use phpDocumentor\Reflection\DocBlock\Tag;
use Webmozart\Assert\Assert;

/**
 * Reflection class for a {@}example tag in a Docblock.
 */
final class Example extends BaseTag
{
    /**
     * @var string Path to a file to use as an example. May also be an absolute URI.
     */
    private $filePath;

    /**
     * @var bool Whether the file path component represents an URI. This determines how the file portion
     *     appears at {@link getContent()}.
     */
    private $isURI = false;

    /**
     * @var int
     */
    private $startingLine;

    /**
     * @var int
     */
    private $lineCount;

    public function __construct($filePath, $isURI, $startingLine, $lineCount, $description)
    {
        Assert::notEmpty($filePath);
        Assert::integer($startingLine);
        Assert::greaterThanEq($startingLine, 0);

        $this->filePath = $filePath;
        $this->startingLine = $startingLine;
        $this->lineCount = $lineCount;
        $this->name = 'example';
        if ($description !== null) {
            $this->description = trim($description);
        }

        $this->isURI = $isURI;
    }

    /**
     * {@inheritdoc}
     */
    public function getContent()
    {
        if (null === $this->description) {
            $filePath = '"' . $this->filePath . '"';
            if ($this->isURI) {
                $filePath = $this->isUriRelative($this->filePath)
                    ? str_replace('%2F', '/', rawurlencode($this->filePath))
                    :$this->filePath;
            }

            return trim($filePath . ' ' . parent::getDescription());
        }

        return $this->description;
    }

    /**
     * {@inheritdoc}
     */
    public static function create($body)
    {
        // File component: File path in quotes or File URI / Source information
        if (! preg_match('/^(?:\"([^\"]+)\"|(\S+))(?:\s+(.*))?$/sux', $body, $matches)) {
            return null;
        }

        $filePath = null;
        $fileUri  = null;
        if ('' !== $matches[1]) {
            $filePath = $matches[1];
        } else {
            $fileUri = $matches[2];
        }

        $startingLine = 1;
        $lineCount    = null;
        $description  = null;

        if (array_key_exists(3, $matches)) {
            $description = $matches[3];

            // Starting line / Number of lines / Description
            if (preg_match('/^([1-9]\d*)(?:\s+((?1))\s*)?(.*)$/sux', $matches[3], $contentMatches)) {
                $startingLine = (int)$contentMatches[1];
                if (isset($contentMatches[2]) && $contentMatches[2] !== '') {
                    $lineCount = (int)$contentMatches[2];
                }

                if (array_key_exists(3, $contentMatches)) {
                    $description = $contentMatches[3];
                }
            }
        }

        return new static(
            $filePath !== null?$filePath:$fileUri,
            $fileUri !== null,
            $startingLine,
            $lineCount,
            $description
        );
    }

    /**
     * Returns the file path.
     *
     * @return string Path to a file to use as an example.
     *     May also be an absolute URI.
     */
    public function getFilePath()
    {
        return $this->filePath;
    }

    /**
     * Returns a string representation for this tag.
     *
     * @return string
     */
    public function __toString()
    {
        return $this->filePath . ($this->description ? ' ' . $this->description : '');
    }

    /**
     * Returns true if the provided URI is relative or contains a complete scheme (and thus is absolute).
     *
     * @param string $uri
     *
     * @return bool
     */
    private function isUriRelative($uri)
    {
        return false === strpos($uri, ':');
    }

    /**
     * @return int
     */
    public function getStartingLine()
    {
        return $this->startingLine;
    }

    /**
     * @return int
     */
    public function getLineCount()
    {
        return $this->lineCount;
    }
}
