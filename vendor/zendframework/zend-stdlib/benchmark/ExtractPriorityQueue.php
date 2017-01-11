<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2015 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendBench\Stdlib;

use Athletic\AthleticEvent;
use Zend\Stdlib\FastPriorityQueue;
use Zend\Stdlib\PriorityQueue;
use Zend\Stdlib\SplPriorityQueue;

class ExtractPriorityQueue extends AthleticEvent
{
    public function classSetUp()
    {
        $this->splPriorityQueue  = new SplPriorityQueue();
        $this->fastPriorityQueue = new FastPriorityQueue();
        $this->priorityQueue     = new PriorityQueue();

        for ($i = 0; $i < 5000; $i += 1) {
            $priority = rand(1, 100);
            $this->splPriorityQueue->insert('foo', $priority);
            $this->fastPriorityQueue->insert('foo', $priority);
            $this->priorityQueue->insert('foo', $priority);
        }
    }

    /**
     * @iterations 5000
     */
    public function extractSplPriorityQueue()
    {
        $this->splPriorityQueue->extract();
    }

    /**
     * @iterations 5000
     */
    public function extractPriorityQueue()
    {
        $this->priorityQueue->extract();
    }

    /**
     * @iterations 5000
     */
    public function extractFastPriorityQueue()
    {
        $this->fastPriorityQueue->extract();
    }
}
