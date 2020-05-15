<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\TableGateway\Feature;

/**
 * EventFeature event constants.
 *
 * This moves the constants introduced in {@link https://github.com/zendframework/zf2/pull/7066}
 * into a separate interface that EventFeature implements; the change keeps
 * backwards compatibility, while simultaneously removing the need to add
 * another hard dependency to the component.
 */
interface EventFeatureEventsInterface
{
    const EVENT_PRE_INITIALIZE  = 'preInitialize';
    const EVENT_POST_INITIALIZE = 'postInitialize';

    const EVENT_PRE_SELECT      = 'preSelect';
    const EVENT_POST_SELECT     = 'postSelect';

    const EVENT_PRE_INSERT      = 'preInsert';
    const EVENT_POST_INSERT     = 'postInsert';

    const EVENT_PRE_DELETE      = 'preDelete';
    const EVENT_POST_DELETE     = 'postDelete';

    const EVENT_PRE_UPDATE      = 'preUpdate';
    const EVENT_POST_UPDATE     = 'postUpdate';
}
