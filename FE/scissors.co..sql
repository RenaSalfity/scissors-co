-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: מרץ 01, 2025 בזמן 10:58 PM
-- גרסת שרת: 10.4.27-MariaDB
-- PHP Version: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `scissors&co.`
--
CREATE DATABASE IF NOT EXISTS `scissors&co.` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `scissors&co.`;

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `image` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- הוצאת מידע עבור טבלה `categories`
--

INSERT INTO `categories` (`id`, `name`, `image`) VALUES
(1, 'Manicure & Pedicure', 'manicure_category.jpg'),
(2, 'Haircuts', 'haircut_category.jpg'),
(3, 'Hair Removal', 'hair_removal_category.jpg'),
(13, 'xv', '1740764186231.pdf'),
(16, 'edfcads', '1740791740442.pdf'),
(18, 'vdz', '1740825958034.jsx'),
(19, 'vdzx', '1740850290639.sql');

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `time` varchar(50) NOT NULL,
  `category_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- הוצאת מידע עבור טבלה `services`
--

INSERT INTO `services` (`id`, `name`, `price`, `time`, `category_id`) VALUES
(1, 'sh3r', '30.00', '20', 13),
(2, 'dvds', '30.00', '90', 13),
(3, 'haircut (men)', '60.00', '20', 2),
(5, 'fcaq', '44.00', '43', 13),
(6, 'czx', '42.00', '44', 18),
(7, 'mnaker', '60.00', '60', 1),
(8, 'face hair removal', '1500.00', '45', 3),
(10, 'hand hair', '1200.00', '35', 3);

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Admin','Customer','Employee') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- הוצאת מידע עבור טבלה `users`
--

INSERT INTO `users` (`id`, `name`, `phone`, `email`, `password`, `role`) VALUES
(1, '', '0585110220', 'admin@scissorsco.com', '$2b$12$hfkInHdqIK3XVELasWAiROfnkth/YSoHJnwDe0Zu4pAtBm2Nu7Ti.', 'Admin'),
(2, '', '', 'Amir@scissorsco.com', '$2b$12$hfkInHdqIK3XVELasWAiROfnkth/YSoHJnwDe0Zu4pAtBm2Nu7Ti.', 'Customer'),
(3, '', '', 'Rana@scissorsco.com', '$2b$12$hfkInHdqIK3XVELasWAiROfnkth/YSoHJnwDe0Zu4pAtBm2Nu7Ti.', 'Employee'),
(5, 'Rena', '0585110220', 'rena@hotmail.com', '$2b$10$0RamuHC2mGKD1pjAhBqHne/isVnpe.R9WwfLEcGiHQhPkbfHVgK3W', 'Customer'),
(6, 'qasem', '0526114905', 'qasem@scissorsco.com', '$2b$10$y3hdVsz/hALm3MkKCEz4U.PPKe8FF6CeT1xS6EvVUR8sYX3UxoLH2', 'Customer'),
(7, 'renatyyyycc', '0501234567', 'renaaa@hotmail.com', '$2b$10$2e.f1a0cMhC7h9opYNwPJ.yONWrrzsIE99GzvB4REZZsU6B/YD/di', 'Customer'),
(8, 'renatyyyycc', '0501234567', 'renaaaa@hotmail.com', '$2b$10$qyAYTHYdvw8fOdWUxhW0q.h7jy7WMowHiqYet/rLDE00IFY43WCfa', 'Customer'),
(9, 'renatyyyyddcc', '0501234567', 'renaaaaa@hotmail.com', '$2b$10$6ddRFNZZuHdUeUmWCQjCyeJfXS4vAx7ScIAlyXEF60rKfEG.RcpfW', 'Customer'),
(10, 'kareem', '0512345698', 'kareem@scissorsco.com', '$2b$10$Z4cFslfykUP8sRm7aUgMoerxeYxupSaem9UG5LBYIGdZkZ6dUf.ye', 'Customer');

--
-- Indexes for dumped tables
--

--
-- אינדקסים לטבלה `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- אינדקסים לטבלה `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- אינדקסים לטבלה `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- הגבלות לטבלאות שהוצאו
--

--
-- הגבלות לטבלה `services`
--
ALTER TABLE `services`
  ADD CONSTRAINT `services_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
