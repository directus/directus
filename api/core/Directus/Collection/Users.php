<?php

namespace Directus\Collection;

class Users extends \Directus\Collection {

	public static $table_name = 'directus_users';

	/**
	 * Get either a Gravatar URL or complete image tag for a specified email address.
	 *
	 * @param string $email The email address
	 * @param string $s Size in pixels, defaults to 80px [ 1 - 2048 ]
	 * @param string $d Default imageset to use [ 404 | mm | identicon | monsterid | wavatar ]
	 * @param string $r Maximum rating (inclusive) [ g | pg | r | x ]
	 * @param boole $img True to return a complete IMG tag False for just the URL
	 * @param array $atts Optional, additional key/value attributes to include in the IMG tag
	 * @return String containing either just a URL or a complete image tag
	 * @source http://gravatar.com/site/implement/images/php/
	 */
	public static function get_gravatar( $email, $s = 80, $d = 'mm', $r = 'g', $img = false, $atts = array() ) {
		$url = 'http://www.gravatar.com/avatar/';
		$url .= md5( strtolower( trim( $email ) ) );
		$url .= "?s=$s&d=$d&r=$r";
		if ( $img ) {
			$url = '<img src="' . $url . '"';
			foreach ( $atts as $key => $val )
				$url .= ' ' . $key . '="' . $val . '"';
			$url .= ' />';
		}
		return $url;
	}

	public static function getAllWithGravatar() {
		// TODO can be solved using a static class singleton etc
		global $db;
		$users = $db->get_users();
		foreach($users['rows'] as &$user) {
			$user['avatar'] = self::get_gravatar($user['email'], 28, 'identicon');
		}
		return $users;
	}

	public static function findOneByEmail($email) {
		global $db;
		$sql = "SELECT * FROM `" . self::$table_name. "` WHERE `email` = :email LIMIT 1;";
	    $sth = $db->dbh->prepare($sql);
	    $sth->bindValue(':email', $email, \PDO::PARAM_STR);
	    $sth->execute();
	    return $sth->fetch(\PDO::FETCH_ASSOC);
	}

}