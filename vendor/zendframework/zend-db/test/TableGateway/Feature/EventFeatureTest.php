<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
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
        $this->tableGateway = $this->getMockForAbstractClass('Zend\Db\TableGateway\TableGateway', [], '', false);
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
        $this->eventManager->attach(EventFeature::EVENT_PRE_INITIALIZE, function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->preInitialize();
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals(EventFeature::EVENT_PRE_INITIALIZE, $event->getName());
    }

    public function testPostInitialize()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach(EventFeature::EVENT_POST_INITIALIZE, function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->postInitialize();
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals(EventFeature::EVENT_POST_INITIALIZE, $event->getName());
    }

    public function testPreSelect()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach(EventFeature::EVENT_PRE_SELECT, function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->preSelect($select = $this->getMock('Zend\Db\Sql\Select'));
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals(EventFeature::EVENT_PRE_SELECT, $event->getName());
        $this->assertSame($select, $event->getParam('select'));
    }

    public function testPostSelect()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach(EventFeature::EVENT_POST_SELECT, function ($e) use (&$closureHasRun, &$event) {
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
        $this->assertEquals(EventFeature::EVENT_POST_SELECT, $event->getName());
        $this->assertSame($stmt, $event->getParam('statement'));
        $this->assertSame($result, $event->getParam('result'));
        $this->assertSame($resultset, $event->getParam('result_set'));
    }

    public function testPreInsert()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach(EventFeature::EVENT_PRE_INSERT, function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->preInsert($insert = $this->getMock('Zend\Db\Sql\Insert'));
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals(EventFeature::EVENT_PRE_INSERT, $event->getName());
        $this->assertSame($insert, $event->getParam('insert'));
    }

    public function testPostInsert()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach(EventFeature::EVENT_POST_INSERT, function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->postInsert(
            ($stmt = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface')),
            ($result = $this->getMock('Zend\Db\Adapter\Driver\ResultInterface'))
        );
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals(EventFeature::EVENT_POST_INSERT, $event->getName());
        $this->assertSame($stmt, $event->getParam('statement'));
        $this->assertSame($result, $event->getParam('result'));
    }

    public function testPreUpdate()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach(EventFeature::EVENT_PRE_UPDATE, function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->preUpdate($update = $this->getMock('Zend\Db\Sql\Update'));
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals(EventFeature::EVENT_PRE_UPDATE, $event->getName());
        $this->assertSame($update, $event->getParam('update'));
    }

    public function testPostUpdate()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach(EventFeature::EVENT_POST_UPDATE, function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->postUpdate(
            ($stmt = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface')),
            ($result = $this->getMock('Zend\Db\Adapter\Driver\ResultInterface'))
        );
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals(EventFeature::EVENT_POST_UPDATE, $event->getName());
        $this->assertSame($stmt, $event->getParam('statement'));
        $this->assertSame($result, $event->getParam('result'));
    }

    public function testPreDelete()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach(EventFeature::EVENT_PRE_DELETE, function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->preDelete($delete = $this->getMock('Zend\Db\Sql\Delete'));
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals(EventFeature::EVENT_PRE_DELETE, $event->getName());
        $this->assertSame($delete, $event->getParam('delete'));
    }

    public function testPostDelete()
    {
        $closureHasRun = false;

        /** @var $event EventFeature\TableGatewayEvent */
        $event = null;
        $this->eventManager->attach(EventFeature::EVENT_POST_DELETE, function ($e) use (&$closureHasRun, &$event) {
            $event = $e;
            $closureHasRun = true;
        });

        $this->feature->postDelete(
            ($stmt = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface')),
            ($result = $this->getMock('Zend\Db\Adapter\Driver\ResultInterface'))
        );
        $this->assertTrue($closureHasRun);
        $this->assertInstanceOf('Zend\Db\TableGateway\TableGateway', $event->getTarget());
        $this->assertEquals(EventFeature::EVENT_POST_DELETE, $event->getName());
        $this->assertSame($stmt, $event->getParam('statement'));
        $this->assertSame($result, $event->getParam('result'));
    }
}
