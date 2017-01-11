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

class InsertPriorityQueue extends AthleticEvent
{
    public function classSetUp()
    {
        $this->splPriorityQueue  = new SplPriorityQueue();
        $this->fastPriorityQueue = new FastPriorityQueue();
        $this->priorityQueue     = new PriorityQueue();
    }

    /**
     * @iterations 5000
     */
    public function insertSplPriorityQueue()
    {
        $this->splPriorityQueue->insert('foo', rand(1, 100));
    }

    /**
     * @iterations 5000
     */
    public function insertPriorityQueue()
    {
        $this->priorityQueue->insert('foo', rand(1, 100));
    }

    /**
     * @iterations 5000
     */
    public function insertFastPriorityQueue()
    {
        $this->fastPriorityQueue->insert('foo', rand(1, 100));
    }
}
