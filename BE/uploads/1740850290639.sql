-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 20, 2025 at 04:32 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `user_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `articles`
--

CREATE TABLE `articles` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `author` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `articles`
--

INSERT INTO `articles` (`id`, `title`, `content`, `author`, `created_at`, `updated_at`) VALUES
(1, 'Template article 1', 'Text of article 1', 'Author 1', '2025-01-11 05:14:24', '2025-01-11 05:14:24'),
(2, 'Template article 2', 'Text of article 2', 'Author 2', '2025-01-11 05:14:24', '2025-01-11 05:14:24'),
(3, 'Template article 3', 'Text of article 3', 'Author 3', '2025-01-11 05:14:24', '2025-01-11 05:14:24'),
(4, 'Template article 4', 'Text of article 4', 'Author 4', '2025-01-11 05:14:24', '2025-01-11 05:14:24'),
(5, 'Template article 5', 'Text of article 5', 'Author 5', '2025-01-11 05:14:24', '2025-01-11 05:14:24'),
(6, 'Template article 6', 'Text of article 6', 'Author 6', '2025-01-11 05:14:24', '2025-01-11 05:14:24'),
(7, 'Template article 7', 'Text of article 7', 'Author 7', '2025-01-11 05:14:24', '2025-01-11 05:14:24'),
(8, 'Template article 8', 'Text of article 8', 'Author 8', '2025-01-11 05:14:24', '2025-01-11 05:14:24'),
(9, 'Template article 9', 'Text of article 9', 'Author 9', '2025-01-11 05:14:24', '2025-01-11 05:14:24'),
(10, 'Template article 10', 'Text of article 10', 'Author 10', '2025-01-11 05:14:24', '2025-01-11 05:14:24');

-- --------------------------------------------------------

--
-- Table structure for table `kuku`
--

CREATE TABLE `kuku` (
  `id` int(11) NOT NULL,
  `kk` varchar(256) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kuku`
--

INSERT INTO `kuku` (`id`, `kk`) VALUES
(3, NULL),
(4, '0'),
(5, '0'),
(6, '$2b$10$hJm6'),
(7, '$2b$10$jJOdD4WqEIoUwvtw7DA53OOEXstqs4FE6kHNxl/EjbN1bu0wpGYfm'),
(8, '$2b$10$VjmBjO/ZJkz.NInNMQ7/6OO9bqPFKlqIBzy5MEz0BX6xOr2vwgFEq');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `created_at`) VALUES
(1, 1, '2025-01-11 04:08:04');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`) VALUES
(1, 1, 1, 2),
(2, 1, 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(256) NOT NULL,
  `price` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `price`) VALUES
(1, 'dfg', 234),
(2, 'dfgwer', 234),
(3, 'dfgwer', 0);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `created_at`, `updated_at`) VALUES
(1, 'Alice', 'alice@example.com', 'hashed_password_1', '2025-01-10 21:04:47', '2025-01-10 21:04:47'),
(2, 'Bob', 'bob@example.com', 'hashed_password_2', '2025-01-10 21:04:47', '2025-01-10 21:04:47'),
(3, 'Charlie', 'charlie@example.com', 'hashed_password_3', '2025-01-10 21:04:47', '2025-01-10 21:04:47'),
(4, 'user123', 'qwe@qwe.qwe', '', '2025-01-10 21:19:50', '2025-01-10 21:19:50'),
(8, 'dfg', 'dfg@qwe.qwe', 'sdfs', '2025-01-10 23:27:58', '2025-01-10 23:27:58');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `articles`
--
ALTER TABLE `articles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `kuku`
--
ALTER TABLE `kuku`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `articles`
--
ALTER TABLE `articles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `kuku`
--
ALTER TABLE `kuku`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
