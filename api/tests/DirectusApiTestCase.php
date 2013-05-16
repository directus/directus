<?php

use Directus\Auth\Provider as AuthProvider;
use Directus\Bootstrap;

class DirectusApiTestCase extends \PHPUnit_Framework_TestCase {

	/** @var \Directus\Acl\Acl */
	protected $acl;

	/** @var \Zend\Db\Adapter\Adapter */
	protected $ZendDb;

	protected function setUp() {
		$this->acl = Bootstrap::get('acl');
		$this->ZendDb = Bootstrap::get('ZendDb');
	}

}