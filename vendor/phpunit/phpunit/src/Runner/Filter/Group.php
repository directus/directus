<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

abstract class PHPUnit_Runner_Filter_GroupFilterIterator extends RecursiveFilterIterator
{
    /**
     * @var array
     */
    protected $groupTests = [];

    /**
     * @param RecursiveIterator           $iterator
     * @param array                       $groups
     * @param PHPUnit_Framework_TestSuite $suite
     */
    public function __construct(RecursiveIterator $iterator, array $groups, PHPUnit_Framework_TestSuite $suite)
    {
        parent::__construct($iterator);

        foreach ($suite->getGroupDetails() as $group => $tests) {
            if (in_array($group, $groups)) {
                $testHashes = array_map(
                    function ($test) {
                        return spl_object_hash($test);
                    },
                    $tests
                );

                $this->groupTests = array_merge($this->groupTests, $testHashes);
            }
        }
    }

    /**
     * @return bool
     */
    public function accept()
    {
        $test = $this->getInnerIterator()->current();

        if ($test instanceof PHPUnit_Framework_TestSuite) {
            return true;
        }

        return $this->doAccept(spl_object_hash($test));
    }

    abstract protected function doAccept($hash);
}
