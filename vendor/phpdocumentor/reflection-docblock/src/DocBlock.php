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

namespace phpDocumentor\Reflection;

use phpDocumentor\Reflection\DocBlock\Tag;
use Webmozart\Assert\Assert;

final class DocBlock
{
    /** @var string The opening line for this docblock. */
    private $summary = '';

    /** @var DocBlock\Description The actual description for this docblock. */
    private $description = null;

    /** @var Tag[] An array containing all the tags in this docblock; except inline. */
    private $tags = [];

    /** @var Types\Context Information about the context of this DocBlock. */
    private $context = null;

    /** @var Location Information about the location of this DocBlock. */
    private $location = null;

    /** @var bool Is this DocBlock (the start of) a template? */
    private $isTemplateStart = false;

    /** @var bool Does this DocBlock signify the end of a DocBlock template? */
    private $isTemplateEnd = false;

    /**
     * @param string $summary
     * @param DocBlock\Description $description
     * @param DocBlock\Tag[] $tags
     * @param Types\Context $context The context in which the DocBlock occurs.
     * @param Location $location The location within the file that this DocBlock occurs in.
     * @param bool $isTemplateStart
     * @param bool $isTemplateEnd
     */
    public function __construct(
        $summary = '',
        DocBlock\Description $description = null,
        array $tags = [],
        Types\Context $context = null,
        Location $location = null,
        $isTemplateStart = false,
        $isTemplateEnd = false
    ) {
        Assert::string($summary);
        Assert::boolean($isTemplateStart);
        Assert::boolean($isTemplateEnd);
        Assert::allIsInstanceOf($tags, Tag::class);

        $this->summary = $summary;
        $this->description = $description ?: new DocBlock\Description('');
        foreach ($tags as $tag) {
            $this->addTag($tag);
        }

        $this->context = $context;
        $this->location = $location;

        $this->isTemplateEnd = $isTemplateEnd;
        $this->isTemplateStart = $isTemplateStart;
    }

    /**
     * @return string
     */
    public function getSummary()
    {
        return $this->summary;
    }

    /**
     * @return DocBlock\Description
     */
    public function getDescription()
    {
        return $this->description;
    }

    /**
     * Returns the current context.
     *
     * @return Types\Context
     */
    public function getContext()
    {
        return $this->context;
    }

    /**
     * Returns the current location.
     *
     * @return Location
     */
    public function getLocation()
    {
        return $this->location;
    }

    /**
     * Returns whether this DocBlock is the start of a Template section.
     *
     * A Docblock may serve as template for a series of subsequent DocBlocks. This is indicated by a special marker
     * (`#@+`) that is appended directly after the opening `/**` of a DocBlock.
     *
     * An example of such an opening is:
     *
     * ```
     * /**#@+
     *  * My DocBlock
     *  * /
     * ```
     *
     * The description and tags (not the summary!) are copied onto all subsequent DocBlocks and also applied to all
     * elements that follow until another DocBlock is found that contains the closing marker (`#@-`).
     *
     * @see self::isTemplateEnd() for the check whether a closing marker was provided.
     *
     * @return boolean
     */
    public function isTemplateStart()
    {
        return $this->isTemplateStart;
    }

    /**
     * Returns whether this DocBlock is the end of a Template section.
     *
     * @see self::isTemplateStart() for a more complete description of the Docblock Template functionality.
     *
     * @return boolean
     */
    public function isTemplateEnd()
    {
        return $this->isTemplateEnd;
    }

    /**
     * Returns the tags for this DocBlock.
     *
     * @return Tag[]
     */
    public function getTags()
    {
        return $this->tags;
    }

    /**
     * Returns an array of tags matching the given name. If no tags are found
     * an empty array is returned.
     *
     * @param string $name String to search by.
     *
     * @return Tag[]
     */
    public function getTagsByName($name)
    {
        Assert::string($name);

        $result = [];

        /** @var Tag $tag */
        foreach ($this->getTags() as $tag) {
            if ($tag->getName() !== $name) {
                continue;
            }

            $result[] = $tag;
        }

        return $result;
    }

    /**
     * Checks if a tag of a certain type is present in this DocBlock.
     *
     * @param string $name Tag name to check for.
     *
     * @return bool
     */
    public function hasTag($name)
    {
        Assert::string($name);

        /** @var Tag $tag */
        foreach ($this->getTags() as $tag) {
            if ($tag->getName() === $name) {
                return true;
            }
        }

        return false;
    }

    /**
     * Remove a tag from this DocBlock.
     *
     * @param Tag $tag The tag to remove.
     *
     * @return void
     */
    public function removeTag(Tag $tagToRemove)
    {
        foreach ($this->tags as $key => $tag) {
            if ($tag === $tagToRemove) {
                unset($this->tags[$key]);
                break;
            }
        }
    }

    /**
     * Adds a tag to this DocBlock.
     *
     * @param Tag $tag The tag to add.
     *
     * @return void
     */
    private function addTag(Tag $tag)
    {
        $this->tags[] = $tag;
    }
}
