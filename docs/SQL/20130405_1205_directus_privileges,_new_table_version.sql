-- phpMyAdmin SQL Dump
-- version 3.5.7
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Apr 05, 2013 at 06:04 PM
-- Server version: 5.5.29
-- PHP Version: 5.4.10

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Database: `directus6`
--

-- --------------------------------------------------------

--
-- Table structure for table `directus_privileges`
--

DROP TABLE IF EXISTS `directus_privileges`;

CREATE TABLE `directus_privileges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `table_name` varchar(255) NOT NULL,
  `group_id` int(11) NOT NULL,
  `read_field_blacklist` varchar(1000) DEFAULT NULL,
  `write_field_blacklist` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `directus_privileges`
--

INSERT INTO `directus_privileges` (`id`, `table_name`, `group_id`, `read_field_blacklist`, `write_field_blacklist`) VALUES
(1, 'ui_gallery', 1, 'description', NULL),
(2, 'ui_gallery', 2, NULL, NULL),
(3, 'instructors', 1, 'email,phone,address_1,address_2,city,state,zip', NULL),
(4, 'instructors', 2, 'phone,address_1,address_2,city,state,zip', NULL);
