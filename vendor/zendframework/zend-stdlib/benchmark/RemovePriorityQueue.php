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

class RemovePriorityQueue extends AthleticEvent
{
    public function classSetUp()
    {
        $this->fastPriorityQueue = new FastPriorityQueue();
        $this->priorityQueue     = new PriorityQueue();

        for ($i = 0; $i < 1000; $i += 1) {
            $priority = rand(1, 100);
            $this->fastPriorityQueue->insert('foo', $priority);
            $this->priorityQueue->insert('foo', $priority);
        }
    }

    /**
     * @iterations 1000
     */
    public function removePriorityQueue()
    {
        $this->priorityQueue->remove('foo');
    }

    /**
     * @iterations 1000
     */
    public function removeFastPriorityQueue()
    {
        $this->fastPriorityQueue->remove('foo');
    }
}
