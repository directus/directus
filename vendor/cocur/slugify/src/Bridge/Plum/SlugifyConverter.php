<?php

/**
 * This file is part of cocur/slugify.
 *
 * (c) Florian Eckerstorfer <florian@eckerstorfer.co>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Cocur\Slugify\Bridge\Plum;

use Plum\Plum\Converter\ConverterInterface;
use Cocur\Slugify\Slugify;
use Cocur\Slugify\SlugifyInterface;

/**
 * SlugifyConverter
 *
 * @package   Cocur\Slugify\Bridge\Plum
 * @author    Florian Eckerstorfer <florian@eckerstorfer.co>
 * @copyright 2015 Florian Eckerstorfer
 */
class SlugifyConverter implements ConverterInterface
{
    /** @var Slugify */
    private $slugify;

    /**
     * @param SlugifyInterface|null $slugify
     */
    public function __construct(SlugifyInterface $slugify = null)
    {
        if ($slugify === null) {
            $slugify = new Slugify();
        }
        $this->slugify = $slugify;
    }

    /**
     * @param string $item
     *
     * @return string
     */
    public function convert($item)
    {
        return $this->slugify->slugify($item);
    }
}
