<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\TableGateway\Feature;

use PHPUnit_Framework_TestCase;
use Zend\EventManager\EventManager;
use Zend\Db\TableGateway\Feature\EventFeature;

class EventFeatureTest extends PHPUnit_Framework_TestCase
{
    /** @var EventManager */
    protected $eventManager = null;

    /** @var EventFeature */
    protected $feature = null;

    protected $event = null;

    /** @var \Zend\Db\TableGateway\TableGateway */
    protected $tableGateway = null;

    public function setup()
    {
        $this->eventManager = new EventManager;
        $this->event = new EventFeature\TableGatewayEvent();
        $this->feature = new EventFeature($this->eventManager, $this->event);
        $this->tableGateway = $this->getMockForAbstractClass('Zend\Db\TableGateway\TableGateway', array(), '', false);
        $this->feature->setTableGateway($this->tableGateway);

        // typically runs before everything else
        $this->feature->preInitialize();
    }

    public function testGetEventManager()
    {
        $this->assertSame($this->eventManager, $this->feature->getEventManager());
    }

    public function testGetEvent()
    {
        $this->assertSame($this->event, $this->feature->getEvent());
    }

    public function testPreInitialize()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach('preInitialize', function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->preInitialize();
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals('preInitialize', $event->getName());
    }

    public function testPostInitialize()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach('postInitialize', function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->postInitialize();
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals('postInitialize', $event->getName());
    }

    public function testPreSelect()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach('preSelect', function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->preSelect($select = $this->getMock('Zend\Db\Sql\Select'));
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals('preSelect', $event->getName());
        $this->assertSame($select, $event->getParam('select'));
    }

    public function testPostSelect()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach('postSelect', function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->postSelect(
            ($stmt = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface')),
            ($result = $this->getMock('Zend\Db\Adapter\Driver\ResultInterface')),
            ($resultset = $this->getMock('Zend\Db\ResultSet\ResultSet'))
        );
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals('postSelect', $event->getName());
        $this->assertSame($stmt, $event->getParam('statement'));
        $this->assertSame($result, $event->getParam('result'));
        $this->assertSame($resultset, $event->getParam('result_set'));
    }

    public function testPreInsert()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach('preInsert', function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->preInsert($insert = $this->getMock('Zend\Db\Sql\Insert'));
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals('preInsert', $event->getName());
        $this->assertSame($insert, $event->getParam('insert'));
    }

    public function testPostInsert()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach('postInsert', function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->postInsert(
            ($stmt = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface')),
            ($result = $this->getMock('Zend\Db\Adapter\Driver\ResultInterface'))
        );
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals('postInsert', $event->getName());
        $this->assertSame($stmt, $event->getParam('statement'));
        $this->assertSame($result, $event->getParam('result'));
    }

    public function testPreUpdate()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach('preUpdate', function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->preUpdate($update = $this->getMock('Zend\Db\Sql\Update'));
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals('preUpdate', $event->getName());
        $this->assertSame($update, $event->getParam('update'));
    }

    public function testPostUpdate()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach('postUpdate', function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->postUpdate(
            ($stmt = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface')),
            ($result = $this->getMock('Zend\Db\Adapter\Driver\ResultInterface'))
        );
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals('postUpdate', $event->getName());
        $this->assertSame($stmt, $event->getParam('statement'));
        $this->assertSame($result, $event->getParam('result'));
    }

    public function testPreDelete()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach('preDelete', function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->preDelete($delete = $this->getMock('Zend\Db\Sql\Delete'));
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals('preDelete', $event->getName());
        $this->assertSame($delete, $event->getParam('delete'));
    }

    public function testPostDelete()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach('postDelete', function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->postDelete(
            ($stmt = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface')),
            ($result = $this->getMock('Zend\Db\Adapter\Driver\ResultInterface'))
        );
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals('postDelete', $event->getName());
        $this->assertSame($stmt, $event->getParam('statement'));
        $this->assertSame($result, $event->getParam('result'));
    }
}
