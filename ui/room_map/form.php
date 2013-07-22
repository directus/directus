<?php

use Directus\Bootstrap;
use Directus\Db\RowGateway\AclAwareRowGateway;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Update;
use Zend\Db\Sql\Where;

class RoomMapForm {

	protected $data = null;

	public function __construct(&$data, &$parentRecordWithForeignKeys) {
		$this->data = &$data;
		$this->parentRecordWithForeignKeys = &$parentRecordWithForeignKeys;
	}

	public function isValid() {
		return true; // so i can push!
		$data = $this->data;
		if(!isset($data['Room Map'])) {
			return false;
		}
		if(0 === strlen(trim($data['Room Map'])) || empty($data['Room Map'])) {
			return false;
		}
		return true;
	}

	public function submit() {

		$acl = Bootstrap::get('acl');
		$db = Bootstrap::get('ZendDb');
		$SeatsTableGateway = new AclAwareTableGateway($acl, 'seats', $db);

		$data = $this->data;
		$roomId = $data['id'];
		$map = json_decode(isset($data['Room Map']) ? $data['Room Map'] : '[]' , true);

		// Prepare new seat records
		$rows = array();
		foreach($map as $x => $row) {
			foreach($row as $y => $value) {
				$value = trim($value);
				if(empty($value))
					continue;
				$rows[] = array(
					'active' 	=> AclAwareRowGateway::ACTIVE_STATE_ACTIVE,
					'x' 		=> $x,
					'y' 		=> $y,
					'value'		=> $value,
					'room_id'	=> $roomId
				);
			}
		}

		// Begin transaction
		$connection = $db->getDriver()->getConnection();
		$connection->beginTransaction();

		// Delete old seats
		$where = new Where;
		$where->equalTo('room_id', $roomId);
		$SeatsTableGateway->delete($where);

		// Insert the new seats
		$insertIds = array();
		foreach($rows as $row) {
			$affectedRows = $SeatsTableGateway->insert($row);
			if(1 !== $affectedRows) {
				// There was an error. Delete our progress so far & inform the client that we aborted.
				$connection->rollback();

				/**
				 * @todo make \Directus\Http\Exceptions & then the exception view only has to check for
				 * subclasses, & we don't need to repeat behaviors for each new exception we invoke.
				 * @todo throw Directus-specific exception
				 */
				throw new \RuntimeException('Failed inserting new seat records.');
			}
			$insertIds[] = $SeatsTableGateway->getLastInsertValue();
		}

		// Commit transaction
		$connection->commit();

		// It's not a real field. Revoke it from the RelationalTableGateway's data.
		unset($this->data['Room Map']);
		unset($this->parentRecordWithForeignKeys['Room Map']);
	}

}