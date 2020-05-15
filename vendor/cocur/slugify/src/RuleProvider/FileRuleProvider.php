<?php

/**
 * This file is part of cocur/slugify.
 *
 * (c) Florian Eckerstorfer <florian@eckerstorfer.co>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Cocur\Slugify\RuleProvider;

/**
 * FileRuleProvider
 *
 * @package   Cocur\Slugify\RuleProvider
 * @author    Florian Eckerstorfer
 * @copyright 2015 Florian Eckerstorfer
 */
class FileRuleProvider implements RuleProviderInterface
{
    /**
     * @var string
     */
    protected $directoryName;

    /**
     * @param string $directoryName
     */
    public function __construct($directoryName)
    {
        $this->directoryName = $directoryName;
    }

    /**
     * @param $ruleset
     *
     * @return array
     */
    public function getRules($ruleset)
    {
        $fileName = $this->directoryName.DIRECTORY_SEPARATOR.$ruleset.'.json';

        return json_decode(file_get_contents($fileName), true);
    }
}
