<?php

namespace League\Flysystem\Util;

use League\Flysystem\Util;

/**
 * @internal
 */
class ContentListingFormatter
{
    /**
     * @var string
     */
    private $directory;

    /**
     * @var bool
     */
    private $recursive;

    /**
     * @var bool
     */
    private $caseSensitive;

    /**
     * @param string $directory
     * @param bool   $recursive
     */
    public function __construct($directory, $recursive, $caseSensitive = true)
    {
        $this->directory = rtrim($directory, '/');
        $this->recursive = $recursive;
        $this->caseSensitive = $caseSensitive;
    }

    /**
     * Format contents listing.
     *
     * @param array $listing
     *
     * @return array
     */
    public function formatListing(array $listing)
    {
        $listing = array_filter(array_map([$this, 'addPathInfo'], $listing), [$this, 'isEntryOutOfScope']);

        return $this->sortListing(array_values($listing));
    }

    private function addPathInfo(array $entry)
    {
        return $entry + Util::pathinfo($entry['path']);
    }

    /**
     * Determine if the entry is out of scope.
     *
     * @param array $entry
     *
     * @return bool
     */
    private function isEntryOutOfScope(array $entry)
    {
        if (empty($entry['path']) && $entry['path'] !== '0') {
            return false;
        }

        if ($this->recursive) {
            return $this->residesInDirectory($entry);
        }

        return $this->isDirectChild($entry);
    }

    /**
     * Check if the entry resides within the parent directory.
     *
     * @param array $entry
     *
     * @return bool
     */
    private function residesInDirectory(array $entry)
    {
        if ($this->directory === '') {
            return true;
        }

        return $this->caseSensitive
            ? strpos($entry['path'], $this->directory . '/') === 0
            : stripos($entry['path'], $this->directory . '/') === 0;
    }

    /**
     * Check if the entry is a direct child of the directory.
     *
     * @param array $entry
     *
     * @return bool
     */
    private function isDirectChild(array $entry)
    {
        return $this->caseSensitive
            ? $entry['dirname'] === $this->directory
            : strcasecmp($this->directory, $entry['dirname']) === 0;
    }

    /**
     * @param array $listing
     *
     * @return array
     */
    private function sortListing(array $listing)
    {
        usort($listing, function ($a, $b) {
            return strcasecmp($a['path'], $b['path']);
        });

        return $listing;
    }
}
