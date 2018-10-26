<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation\Extractor;

use Symfony\Component\Translation\MessageCatalogue;

/**
 * Extracts translation messages from a directory or files to the catalogue.
 * New found messages are injected to the catalogue using the prefix.
 *
 * @author Michel Salib <michelsalib@hotmail.com>
 */
interface ExtractorInterface
{
    /**
     * Extracts translation messages from files, a file or a directory to the catalogue.
     *
     * @param string|array     $resource  Files, a file or a directory
     * @param MessageCatalogue $catalogue The catalogue
     */
    public function extract($resource, MessageCatalogue $catalogue);

    /**
     * Sets the prefix that should be used for new found messages.
     *
     * @param string $prefix The prefix
     */
    public function setPrefix($prefix);
}
