<?php

class EmitterTest extends PHPUnit_Framework_TestCase
{
    public function testEmitter()
    {
        $emitter = new \Directus\Hook\Emitter();

        // =========================================================
        // Empty listeners
        // =========================================================
        $this->assertEmpty($emitter->getActionListeners('removed'));
        $this->assertEmpty($emitter->getFilterListeners('fetched'));


        // =========================================================
        // Expect Action callback to be called once
        // =========================================================
        $actionMock = $this->getMock('stdClass', array('actionCallback'));
        $actionMock->expects($this->at(1))
            ->method('actionCallback')
            ->with($this->equalTo(2))
            ->will($this->returnValue(true));

        $emitter->addAction('removed', [$actionMock, 'actionCallback']);

        // Using Hook Interface
        $actionHookMock = $this->getMock('\Directus\Hook\HookInterface', array('handle'));
        $actionHookMock->expects($this->at(0))
            ->method('handle');

        $emitter->addAction('removed', [$actionMock, 'actionCallback']);
        $emitter->addAction('removed', $actionHookMock, $emitter::P_HIGH);
        $emitter->run('removed', 2);

        // =========================================================
        // Expect Filter callback to be called once
        // and change the value
        // =========================================================
        $filterMock = $this->getMock('stdClass', array('filterCallback'));
        $filterMock->expects($this->once())
            ->method('filterCallback')
            ->with($this->equalTo('RNGR'))
            ->will($this->returnValue(strrev('RNGR')));

        // Using Hook Interface
        $filterHookMock = $this->getMock('\Directus\Hook\HookInterface', array('handle'));
        $filterHookMock->expects($this->at(0))
            ->method('handle')
            ->with($this->equalTo('rngr'))
            ->will($this->returnValue('RNGR'));

        $filterHookMock->expects($this->at(1))
            ->method('handle')
            ->with($this->equalTo('RGNR'))
            ->will($this->returnValue(strtolower('RGNR')));

        $emitter->addFilter('fetched', [$filterMock, 'filterCallback']);
        $emitter->addFilter('fetched', $filterHookMock, $emitter::P_LOW);
        $emitter->addFilter('fetched', $filterHookMock, $emitter::P_HIGH);

        $result = $emitter->apply('fetched', 'rngr');
        $this->assertSame('rgnr', $result);
    }

    /**
     * @expectedException InvalidArgumentException
     */
    public function testActionException()
    {
        $emitter = new \Directus\Hook\Emitter();
        $emitter->addAction('removed', 2);
    }

    /**
     * @expectedException InvalidArgumentException
     */
    public function testFilterException()
    {
        $emitter = new \Directus\Hook\Emitter();
        $emitter->addFilter('fetched', 2);
    }
}
