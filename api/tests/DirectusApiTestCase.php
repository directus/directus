<?php

use Directus\Auth\Provider as AuthProvider;
use Directus\Bootstrap;

class DirectusApiTestCase extends \PHPUnit_Framework_TestCase {

	/** @var \Directus\Acl\Acl */
	protected $aclProvider;

	/** @var \Zend\Db\Adapter\Adapter */
	protected $ZendDb;

	protected function setUp() {
		$this->aclProvider = Bootstrap::get('aclProvider');
		$this->ZendDb = Bootstrap::get('ZendDb');
	}

}