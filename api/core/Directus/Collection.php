<?php

namespace Directus;

class Collection {

	public static $table_name;

	public static function findOneById($id) {
		if(is_null(static::$table_name)) {
			throw new UninitializedCollectionException("Define the static property \$table_name to use a collection.");
		}
		global $db;
		$sql = "SELECT * FROM `" . static::$table_name. "` WHERE `id` = :id LIMIT 1;";
	    $sth = $db->dbh->prepare($sql);
	    $sth->bindValue(':id', $id, \PDO::PARAM_INT);
	    $sth->execute();
	    return $sth->fetch(\PDO::FETCH_ASSOC);
	}

}

/**
 * Exceptions
 */

class UninitializedCollectionException extends \Exception {}