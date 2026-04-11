CREATE DATABASE Fitigue
GO

USE Fitigue
GO

DROP TABLE if exists Users
DROP TABLE if exists WardrobeItems
DROP TABLE if exists MarketplaceListings
DROP TABLE if exists SwapRequests
DROP TABLE if exists Trades
DROP TABLE if exists Conversations
DROP TABLE if exists Messages
DROP TABLE if exists ClothingRequests
DROP TABLE if exists Notifications
DROP TABLE if exists Ratings

--SCHEMA & CONSTRAINTS

CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    profile_image VARCHAR(255),
    gender CHAR(1),
    age INT CHECK (age >= 13),
    rating_avg DECIMAL(2,1) DEFAULT 0 CHECK (rating_avg BETWEEN 0 AND 5),
    total_trades INT DEFAULT 0 CHECK (total_trades >= 0),
    created_at DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX idx_users_username ON Users(username);
GO

CREATE TABLE WardrobeItems (
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    size VarCHAR(2) NOT NULL,
    color VARCHAR(30),
    price DECIMAL(10,2) CHECK (price >= 0),
    allow_sale BIT DEFAULT 1,
    allow_swap BIT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'available',
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_item_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id),
        
    CONSTRAINT chk_item_status
        CHECK (status IN ('available','sold','swapped')),
);
GO

CREATE INDEX idx_items_user ON WardrobeItems(user_id);
CREATE INDEX idx_items_category ON WardrobeItems(category);
CREATE INDEX idx_items_price ON WardrobeItems(price);
GO

CREATE TABLE MarketplaceListings (
    listing_id INT IDENTITY(1,1) PRIMARY KEY,
    item_id INT NOT NULL UNIQUE,
    posted_by INT NOT NULL,
    posted_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_listing_item
        FOREIGN KEY (item_id)
        REFERENCES WardrobeItems(item_id)
        ON DELETE CASCADE 
        ON UPDATE CASCADE,        
);
GO

CREATE TABLE SwapRequests (
    swap_id INT IDENTITY(1,1) PRIMARY KEY,
    requester_id INT NOT NULL,
    owner_id INT NOT NULL,
    requested_item_id INT NOT NULL ,
    offered_item_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_swap_requester
        FOREIGN KEY (requester_id) REFERENCES Users(user_id),

    CONSTRAINT fk_swap_owner
        FOREIGN KEY (owner_id) REFERENCES Users(user_id),

    CONSTRAINT fk_requested_item
        FOREIGN KEY (requested_item_id) REFERENCES WardrobeItems(item_id),

    CONSTRAINT fk_offered_item
        FOREIGN KEY (offered_item_id) REFERENCES WardrobeItems(item_id),

    CONSTRAINT chk_swap_status
        CHECK (status IN ('pending','accepted','rejected','completed'))
);
GO

CREATE INDEX idx_swap_requester ON SwapRequests(requester_id);
CREATE INDEX idx_swap_owner ON SwapRequests(owner_id);
GO

CREATE TABLE Trades (
    trade_id INT IDENTITY(1,1) PRIMARY KEY,
    buyer_id INT ,
    seller_id INT ,
    item_id INT,
    trade_type VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    trade_date DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_trade_buyer
        FOREIGN KEY (buyer_id) REFERENCES Users(user_id),

    CONSTRAINT fk_trade_seller
        FOREIGN KEY (seller_id) REFERENCES Users(user_id),

    CONSTRAINT fk_trade_item
        FOREIGN KEY (item_id) REFERENCES WardrobeItems(item_id),

    CONSTRAINT chk_trade_type
        CHECK (trade_type IN ('buy','sell')),

    CONSTRAINT chk_trade_status
        CHECK (status IN ('pending','completed','cancelled'))
);
GO

CREATE INDEX idx_trade_buyer ON Trades(buyer_id);
CREATE INDEX idx_trade_seller ON Trades(seller_id);
GO

CREATE TABLE Conversations (
    conversation_id INT IDENTITY(1,1) PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_conv_user1
        FOREIGN KEY (user1_id) REFERENCES Users(user_id),

    CONSTRAINT fk_conv_user2
        FOREIGN KEY (user2_id) REFERENCES Users(user_id),

    CONSTRAINT chk_different_users
        CHECK (user1_id <> user2_id)
);
GO

CREATE INDEX idx_conv_user1 ON Conversations(user1_id);
CREATE INDEX idx_conv_user2 ON Conversations(user2_id);
GO

CREATE TABLE Messages (
    message_id INT IDENTITY(1,1) PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    sent_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_msg_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES Conversations(conversation_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_msg_sender
        FOREIGN KEY (sender_id)
        REFERENCES Users(user_id)
);
GO

CREATE INDEX idx_msg_conversation ON Messages(conversation_id);
GO

CREATE TABLE ClothingRequests (
    request_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_request_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
GO

CREATE INDEX idx_request_user ON ClothingRequests(user_id);
GO

CREATE TABLE Notifications (
    notification_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id INT,
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE CASCADE
);
GO

CREATE INDEX idx_notification_user ON Notifications(user_id);
GO

CREATE TABLE Ratings (
    rating_id INT IDENTITY(1,1) PRIMARY KEY,
    reviewer_id INT ,
    reviewed_user_id INT NOT NULL,
    trade_id INT NOT NULL,
    rating_value INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_rating_reviewer
        FOREIGN KEY (reviewer_id) REFERENCES Users(user_id),

    CONSTRAINT fk_rating_reviewed
        FOREIGN KEY (reviewed_user_id) REFERENCES Users(user_id),

    CONSTRAINT fk_rating_trade
        FOREIGN KEY (trade_id) REFERENCES Trades(trade_id),

    CONSTRAINT chk_rating_value
        CHECK (rating_value BETWEEN 1 AND 5),

    CONSTRAINT chk_no_self_rating
        CHECK (reviewer_id <> reviewed_user_id)
);
GO

CREATE INDEX idx_rating_reviewed ON Ratings(reviewed_user_id);
GO

--DROP TRIGGER trg_DeleteUser_AllDependencies
--DROP TRIGGER trg_DeleteWardrobe_AllDependencies

CREATE TRIGGER trg_DeleteUser_AllDependencies
ON Users
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    -- Delete Messages of deleted user
    DELETE M
    FROM Messages M
    INNER JOIN DELETED D
        ON M.sender_id = D.user_id;

    -- Delete Conversations of deleted user
    DELETE C
    FROM Conversations C
    INNER JOIN DELETED D
        ON C.user1_id = D.user_id
        OR C.user2_id = D.user_id;

    -- Delete SwapRequests of deleted user
    DELETE SR
    FROM SwapRequests SR
    INNER JOIN DELETED D
        ON SR.requester_id = D.user_id
        OR SR.owner_id = D.user_id;

    -- Nullify Trades of deleted user
    UPDATE T
    SET buyer_id  = CASE WHEN T.buyer_id  = D.user_id THEN NULL ELSE T.buyer_id  END,
        seller_id = CASE WHEN T.seller_id = D.user_id THEN NULL ELSE T.seller_id END
    FROM Trades T
    INNER JOIN DELETED D
        ON T.buyer_id = D.user_id
        OR T.seller_id = D.user_id;

    -- Delete Ratings where deleted user was reviewed
    DELETE R
    FROM Ratings R
    INNER JOIN DELETED D
        ON R.reviewed_user_id = D.user_id;

    -- Nullify Ratings where deleted user was reviewer
    UPDATE R
    SET reviewer_id = NULL
    FROM Ratings R
    INNER JOIN DELETED D
        ON R.reviewer_id = D.user_id;

    -- Delete WardrobeItems of deleted user (MarketplaceListings deleted by cascade)
    DELETE WI
    FROM WardrobeItems WI
    INNER JOIN DELETED D
        ON WI.user_id = D.user_id;

    -- Delete User
    DELETE U
    FROM Users U
    INNER JOIN DELETED D
        ON U.user_id = D.user_id;
END;
GO

CREATE TRIGGER trg_DeleteWardrobe_AllDependencies
ON WardrobeItems
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Nullify Trades involving deleted item
    UPDATE T
    SET T.item_id = NULL
    FROM Trades T
    INNER JOIN DELETED D
        ON T.item_id = D.item_id;

    -- Delete SwapRequests involving deleted item
    DELETE SR
    FROM SwapRequests SR
    INNER JOIN DELETED D
        ON SR.requested_item_id = D.item_id      
        OR SR.offered_item_id = D.item_id;

    -- Delete WardrobeItem
    DELETE WI
    FROM WardrobeItems WI
    INNER JOIN DELETED D
        ON WI.item_id = D.item_id;
END;
GO

--DUMMY DATA

INSERT INTO Users (username, email, password_hash, profile_image, gender, age, rating_avg, total_trades)
VALUES
    ('alex_styles',    'alex@example.com',    'hash_alex123',    'profiles/alex.jpg',    'M', 24, 4.5, 12),
    ('sara_fit',       'sara@example.com',    'hash_sara456',    'profiles/sara.jpg',    'F', 22, 4.8, 20),
    ('mike_drip',      'mike@example.com',    'hash_mike789',    'profiles/mike.jpg',    'M', 27, 3.9, 7),
    ('luna_closet',    'luna@example.com',    'hash_luna321',    'profiles/luna.jpg',    'F', 19, 4.2, 5),
    ('jay_threads',    'jay@example.com',     'hash_jay654',     'profiles/jay.jpg',     'M', 31, 4.7, 18),
    ('nina_vogue',     'nina@example.com',    'hash_nina987',    'profiles/nina.jpg',    'F', 26, 4.0, 9),
    ('omar_swaps',     'omar@example.com',    'hash_omar111',    'profiles/omar.jpg',    'M', 23, 3.5, 3),
    ('zara_wear',      'zara@example.com',    'hash_zara222',    'profiles/zara.jpg',    'F', 28, 4.6, 14),
    ('leo_fits',       'leo@example.com',     'hash_leo333',     'profiles/leo.jpg',     'M', 21, 4.1, 6),
    ('maya_outfits',   'maya@example.com',    'hash_maya444',    'profiles/maya.jpg',    'F', 25, 4.9, 22);
GO

INSERT INTO WardrobeItems (user_id, title, description, category, size, color, price, allow_sale, allow_swap, status)
VALUES
    (1,  'Vintage Denim Jacket',     'Classic 90s wash, barely worn',         'Jackets',    'M',  'Blue',   35.00, 1, 1, 'available'),
    (1,  'Nike Air Force 1',         'White, size 42, good condition',         'Shoes',      '42', 'White',  60.00, 1, 0, 'available'),
    (2,  'Floral Sundress',          'Light summer dress, size S',             'Dresses',    'S',  'Pink',   25.00, 1, 1, 'available'),
    (2,  'Levi 501 Jeans',           'Classic straight fit, dark indigo',      'Pants',      'M',  'Indigo', 40.00, 1, 1, 'available'),
    (3,  'Oversized Hoodie',         'Grey, very cozy, washed many times',     'Tops',       'L',  'Grey',   20.00, 0, 1, 'available'),
    (3,  'Adidas Track Pants',       'Black with white stripes, size M',       'Pants',      'M',  'Black',  30.00, 1, 1, 'available'),
    (4,  'Crop Top Set',             'Matching set, olive green, size XS',     'Sets',       'XS', 'Olive',  45.00, 1, 1, 'available'),
    (4,  'Platform Sneakers',        'Black chunky soles, size 37',            'Shoes',      '37', 'Black',  55.00, 1, 1, 'available'),
    (5,  'Linen Blazer',             'Beige linen, summer perfect, size L',    'Jackets',    'L',  'Beige',  70.00, 1, 1, 'available'),
    (5,  'White Oxford Shirt',       'Classic fit, barely worn',               'Tops',       'L',  'White',  28.00, 1, 1, 'available'),
    (6,  'Knit Sweater',             'Burgundy, soft wool blend, size M',      'Tops',       'M',  'Red',    38.00, 1, 1, 'available'),
    (6,  'High Waist Skirt',         'Black faux leather, size S',             'Skirts',     'S',  'Black',  32.00, 1, 1, 'available'),
    (7,  'Graphic Tee',              'Band tee, vintage print, size M',        'Tops',       'M',  'Black',  15.00, 1, 1, 'available'),
    (7,  'Cargo Shorts',             'Khaki, lots of pockets, size 32',        'Shorts',     '32', 'Khaki',  22.00, 1, 0, 'available'),
    (8,  'Maxi Dress',               'Flowy boho style, blue floral, size M',  'Dresses',    'M',  'Blue',   48.00, 1, 1, 'available'),
    (8,  'Leather Belt',             'Brown leather, adjustable',              'Accessories','OS', 'Brown',  18.00, 1, 1, 'available'),
    (9,  'Slim Chinos',              'Navy blue, slim fit, size 30x32',        'Pants',      '30', 'Navy',   35.00, 1, 1, 'available'),
    (9,  'Polo Shirt',               'Classic polo, green, size M',            'Tops',       'M',  'Green',  25.00, 1, 1, 'available'),
    (10, 'Puffer Vest',              'Black quilted puffer vest, size S',      'Jackets',    'S',  'Black',  42.00, 1, 1, 'available'),
    (10, 'Ankle Boots',              'Brown suede, size 38, minimal wear',     'Shoes',      '38', 'Brown',  75.00, 1, 1, 'available');
GO

INSERT INTO MarketplaceListings (item_id, posted_by)
VALUES
    (1,  1),
    (2,  1),
    (3,  2),
    (4,  2),
    (6,  3),
    (7,  4),
    (8,  4),
    (9,  5),
    (11, 6),
    (13, 7),
    (15, 8),
    (20, 10);
GO

INSERT INTO SwapRequests (requester_id, owner_id, requested_item_id, offered_item_id, status)
VALUES
    (2, 1, 1,  3,  'pending'),      
    (3, 2, 4,  5,  'accepted'),     
    (4, 3, 6,  7,  'pending'),     
    (5, 4, 8,  9,  'completed'),    
    (6, 5, 10, 11, 'rejected'),     
    (7, 6, 12, 13, 'pending'),     
    (8, 7, 13, 15, 'completed'),    
    (9, 8, 16, 17, 'pending');      
GO

INSERT INTO Trades (buyer_id, seller_id, item_id, trade_type, status)
VALUES
    (2,  1,  2,  'buy',  'completed'),  
    (3,  2,  3,  'buy',  'completed'),   
    (5,  4,  7,  'buy',  'completed'),   
    (6,  5,  9,  'buy',  'completed'),   
    (7,  6,  11, 'buy',  'completed'),   
    (8,  7,  13, 'buy',  'completed'),   
    (9,  8,  15, 'buy',  'completed'),   
    (10, 9,  17, 'buy',  'completed'),   
    (1,  10, 19, 'buy',  'completed'),  
    (4,  3,  6,  'buy',  'pending');     
GO

INSERT INTO Conversations (user1_id, user2_id)
VALUES
    (1, 2),
    (2, 3),
    (3, 4),
    (4, 5),
    (5, 6),
    (7, 8);
GO

INSERT INTO Messages (conversation_id, sender_id, message_text)
VALUES
    (1, 1, 'Hey Sara, are you still interested in the denim jacket?'),
    (1, 2, 'Yes! Would you swap it for my floral dress?'),
    (1, 1, 'Hmm, let me think about it. What size is the dress?'),
    (1, 2, 'It is a size S, barely worn. Great condition!'),
    (1, 1, 'Deal! Let us arrange the swap.'),
    (2, 2, 'Hi Mike, I saw you liked my Levi jeans.'),
    (2, 3, 'Yes! Can we swap for my hoodie?'),
    (2, 2, 'The hoodie looks cozy. Accepted!'),
    (3, 3, 'Luna, interested in trading track pants for your crop set?'),
    (3, 4, 'Maybe! What condition are the pants in?'),
    (3, 3, 'Worn maybe 3 times, still crisp.'),
    (4, 4, 'Jay, your linen blazer is gorgeous!'),
    (4, 5, 'Thanks! Interested in trading for the platforms?'),
    (4, 4, 'Yes, let us do it!'),
    (5, 5, 'Nina, I saw you liked the Oxford shirt.'),
    (5, 6, 'I did but I think I will pass, sorry.'),
    (6, 7, 'Hey Zara, love the maxi dress!'),
    (6, 8, 'Thank you! Want to buy or swap?'),
    (6, 7, 'Buy! How much?'),
    (6, 8, 'Listed at 48, but happy to negotiate.');
GO

INSERT INTO ClothingRequests (user_id, description)
VALUES
    (1,  'Looking for a vintage bomber jacket, size M, any color.'),
    (2,  'Need white sneakers, size 37 or 38, preferably Nike or Adidas.'),
    (3,  'Searching for an oversized flannel shirt, size L or XL.'),
    (4,  'Want cute platform sandals for summer, size 37.'),
    (5,  'Looking for a lightweight raincoat, size L, any color.'),
    (9,  'Need formal chinos or dress pants, size 30x32, navy or grey.');
GO

INSERT INTO Notifications (user_id, type, reference_id, is_read)
VALUES
    (1,  'swap_request',   1,  0),   
    (2,  'swap_accepted',  2,  1),   
    (3,  'swap_request',   3,  0),   
    (4,  'swap_completed', 4,  1),   
    (5,  'swap_rejected',  5,  0),   
    (6,  'swap_request',   6,  0),  
    (2,  'trade_complete', 1,  1),   
    (3,  'trade_complete', 2,  1),   
    (5,  'trade_complete', 3,  1),   
    (6,  'trade_complete', 4,  0),  
    (1,  'new_message',    1,  0),   
    (8,  'new_message',    6,  0);   
GO

INSERT INTO Ratings (reviewer_id, reviewed_user_id, trade_id, rating_value)
VALUES
    (2,  1,  1, 5),   
    (1,  2,  1, 4),   
    (3,  2,  2, 5),   
    (2,  3,  2, 4),   
    (5,  4,  3, 5),   
    (4,  5,  3, 4),   
    (6,  5,  4, 5),   
    (5,  6,  4, 3),   
    (7,  6,  5, 4),   
    (8,  7,  6, 5);   
GO

SELECT * FROM Users 
SELECT * FROM WardrobeItems 
SELECT * FROM MarketplaceListings 
SELECT * FROM SwapRequests  
SELECT * FROM Trades
SELECT * FROM Conversations  
SELECT * FROM Messages 
SELECT * FROM ClothingRequests 
SELECT * FROM Notifications   
SELECT * FROM Ratings;
GO

--BASIC FEATURE QUERIES

--1: SIGN UP/LOGIN & USER PROFILE 

-- Register new user
INSERT INTO Users (username, email, password_hash, profile_image, gender, age)
VALUES ('emma_style', 'emma@example.com', 'hashed_pw_xyz', 'profiles/emma.jpg', 'F', 21);

-- Login
SELECT user_id, username, email, profile_image, rating_avg, total_trades
FROM Users
WHERE username = 'emma_style'
  AND password_hash = 'hashed_pw_xyz';

-- View user's own profile
SELECT u.user_id, u.username, u.profile_image, u.gender, u.age,
       u.rating_avg, u.total_trades, u.created_at,
       (SELECT COUNT(*) FROM WardrobeItems WHERE user_id = u.user_id) AS wardrobe_count,
       (SELECT COUNT(*) FROM MarketplaceListings WHERE posted_by = u.user_id) AS total_posts
FROM Users u
WHERE u.user_id = 1;

-- View another user's profile
SELECT u.username, u.profile_image, u.rating_avg, u.total_trades,
       (SELECT COUNT(*) FROM WardrobeItems WHERE user_id = u.user_id AND status = 'available') AS active_items,
       (SELECT COUNT(*) FROM MarketplaceListings WHERE posted_by = u.user_id) AS total_posts
FROM Users u
WHERE u.user_id = 2;

-- Edit profile 
UPDATE Users
SET username      = 'emma_updated',
    profile_image = 'profiles/emma_new.jpg',
    age           = 22
WHERE user_id = 1;

-- Change password
UPDATE Users
SET password_hash = 'new_hashed_pw_abc'
WHERE user_id = 1;

-- Delete account 
DELETE FROM Users WHERE user_id = 8;        

-- Check if username already exists 
SELECT COUNT(*) AS exists_flag
FROM Users
WHERE username = 'emma_style';

--2: WARDROBE MANAGEMENT 

-- Add new clothing item to wardrobe
INSERT INTO WardrobeItems (user_id, title, description, category, size, color, price, allow_sale, allow_swap)
VALUES (2, 'Black Blazer', 'Formal slim-fit blazer, worn twice', 'Jackets', 'M', 'Black', 50.00, 1, 1);

-- View all items in wardrobe
SELECT item_id, title, category, size, color, price,
       allow_sale, allow_swap, status, created_at
FROM WardrobeItems
WHERE user_id = 2
ORDER BY created_at DESC;

-- View single wardrobe item (on-click)
SELECT wi.*, u.username, u.rating_avg
FROM WardrobeItems wi
JOIN Users u ON wi.user_id = u.user_id
WHERE wi.item_id = 5;

-- Edit item details
UPDATE WardrobeItems
SET title       = 'Black Slim Blazer',
    description = 'Updated description  excellent condition',
    price       = 45.00,
    color       = 'Charcoal',
    allow_swap  = 0
WHERE item_id = 5 AND user_id = 3;

-- Mark item as sold/available
UPDATE WardrobeItems
SET status = 'sold'
WHERE item_id = 5 AND user_id = 3;

UPDATE WardrobeItems
SET status = 'available'
WHERE item_id = 5 AND user_id = 3;

-- Delete item from wardrobe
DELETE FROM WardrobeItems                 
WHERE item_id = 5 AND user_id = 3; 


--3: CLOTHING MARKETPLACE

-- Post item to the marketplace
INSERT INTO MarketplaceListings (item_id, posted_by)
VALUES (10, 5);

-- Scroll marketplace listings
SELECT ml.listing_id, wi.item_id, wi.title, wi.description,
       wi.category, wi.size, wi.color, wi.price,
       wi.allow_sale, wi.allow_swap,
       u.username, u.rating_avg, ml.posted_at
FROM MarketplaceListings ml
JOIN WardrobeItems wi ON ml.item_id = wi.item_id
JOIN Users u ON ml.posted_by = u.user_id
WHERE wi.status = 'available'
ORDER BY ml.posted_at DESC;

-- View listings posted by specific user
SELECT ml.listing_id, wi.title, wi.category, wi.price,
       wi.allow_sale, wi.allow_swap, wi.status, ml.posted_at
FROM MarketplaceListings ml
JOIN WardrobeItems wi ON ml.item_id = wi.item_id
WHERE ml.posted_by = 2
ORDER BY ml.posted_at DESC;

-- Remove listing from marketplace
DELETE FROM MarketplaceListings
WHERE listing_id = 3 AND posted_by = 2;

-- Full item detail (on-click)
SELECT wi.item_id, wi.title, wi.description, wi.category,
       wi.size, wi.color, wi.price, wi.allow_sale, wi.allow_swap,
       u.user_id, u.username, u.profile_image, u.rating_avg, u.total_trades,
       ml.posted_at
FROM MarketplaceListings ml
JOIN WardrobeItems wi ON ml.item_id = wi.item_id
JOIN Users u ON ml.posted_by = u.user_id
WHERE ml.listing_id = 1;

--4: FILTER FUNCTIONALITY

-- Filter by category
SELECT ml.listing_id, wi.title, wi.size, wi.color, wi.price, u.username
FROM MarketplaceListings ml
JOIN WardrobeItems wi ON ml.item_id = wi.item_id
JOIN Users u ON ml.posted_by = u.user_id
WHERE wi.status = 'available'
  AND wi.category = 'Jackets'
ORDER BY ml.posted_at DESC;

-- Filter by size
SELECT ml.listing_id, wi.title, wi.category, wi.color, wi.price, u.username
FROM MarketplaceListings ml
JOIN WardrobeItems wi ON ml.item_id = wi.item_id
JOIN Users u ON ml.posted_by = u.user_id
WHERE wi.status = 'available'
  AND wi.size = 'M'
ORDER BY ml.posted_at DESC;

-- Filter by color
SELECT ml.listing_id, wi.title, wi.category, wi.size, wi.price, u.username
FROM MarketplaceListings ml
JOIN WardrobeItems wi ON ml.item_id = wi.item_id
JOIN Users u ON ml.posted_by = u.user_id
WHERE wi.status = 'available'
  AND wi.color = 'Black'
ORDER BY ml.posted_at DESC;

-- Filter by price 
SELECT ml.listing_id, wi.title, wi.category, wi.size, wi.color, wi.price, u.username
FROM MarketplaceListings ml
JOIN WardrobeItems wi ON ml.item_id = wi.item_id
JOIN Users u ON ml.posted_by = u.user_id
WHERE wi.status = 'available'
  AND wi.price BETWEEN 20.00 AND 60.00
ORDER BY wi.price ASC;

-- Filter by category, size and price 
SELECT ml.listing_id, wi.title, wi.size, wi.color, wi.price,
       u.username, u.rating_avg
FROM MarketplaceListings ml
JOIN WardrobeItems wi ON ml.item_id = wi.item_id
JOIN Users u ON ml.posted_by = u.user_id
WHERE wi.status   = 'available'
  AND wi.category = 'Jackets'
  AND wi.size     = 'M'
  AND wi.price   <= 60.00
ORDER BY wi.price ASC;

-- Filter only swappable items
SELECT ml.listing_id, wi.title, wi.category, wi.size, wi.color, u.username
FROM MarketplaceListings ml
JOIN WardrobeItems wi ON ml.item_id = wi.item_id
JOIN Users u ON ml.posted_by = u.user_id
WHERE wi.status     = 'available'
  AND wi.allow_swap = 1
ORDER BY ml.posted_at DESC;

-- Filter only items for sale
SELECT ml.listing_id, wi.title, wi.category, wi.size, wi.price, u.username
FROM MarketplaceListings ml
JOIN WardrobeItems wi ON ml.item_id = wi.item_id
JOIN Users u ON ml.posted_by = u.user_id
WHERE wi.status    = 'available'
  AND wi.allow_sale = 1
ORDER BY wi.price ASC;

--5: BUY OPTION

-- New purchase
INSERT INTO Trades (buyer_id, seller_id, item_id, trade_type, status)
VALUES (3, 2, 4, 'buy', 'completed');

-- Mark item as sold 
UPDATE WardrobeItems
SET status = 'sold'
WHERE item_id = 4;

-- Increment seller's/buyer's total_trades
UPDATE Users
SET total_trades = total_trades + 1
WHERE user_id = 2;

-- Notify seller/buyer of purchase
INSERT INTO Notifications (user_id, type, reference_id)
VALUES (2, 'item_sold', 5);

INSERT INTO Notifications (user_id, type, reference_id)
VALUES (3, 'purchase_confirmed', 5);

-- Get all purchases made by a user 
SELECT t.trade_id, wi.title, wi.category, wi.price, wi.color,
       u_seller.username AS seller, t.trade_date, t.status
FROM Trades t
JOIN WardrobeItems wi ON t.item_id = wi.item_id
JOIN Users u_seller ON t.seller_id = u_seller.user_id
WHERE t.buyer_id = 3 AND t.trade_type = 'buy'
ORDER BY t.trade_date DESC;

-- Get all items sold by a user
SELECT t.trade_id, wi.title, wi.price, u_buyer.username AS buyer,
       t.trade_date, t.status
FROM Trades t
JOIN WardrobeItems wi ON t.item_id = wi.item_id
JOIN Users u_buyer ON t.buyer_id = u_buyer.user_id
WHERE t.seller_id = 2 AND t.trade_type = 'buy'
ORDER BY t.trade_date DESC;


--6: SWAP REQUEST SYSTEM 

-- Send swap request
INSERT INTO SwapRequests (requester_id, owner_id, requested_item_id, offered_item_id, status)
VALUES (3, 2, 6, 4, 'pending');

-- View all incoming swap requests
SELECT sr.swap_id, u_req.username AS requester, u_req.profile_image,
       u_req.rating_avg,
       req_item.title AS requested_item,
       off_item.title AS offered_item, off_item.size, off_item.color,
       sr.status, sr.created_at
FROM SwapRequests sr
JOIN Users u_req ON sr.requester_id = u_req.user_id
JOIN WardrobeItems req_item ON sr.requested_item_id = req_item.item_id
JOIN WardrobeItems off_item ON sr.offered_item_id = off_item.item_id
WHERE sr.owner_id = 2 AND sr.status = 'pending'
ORDER BY sr.created_at DESC;

-- View all outgoing swap requests 
SELECT sr.swap_id, u_owner.username AS owner,
       req_item.title AS i_want,
       off_item.title AS i_offered,
       sr.status, sr.created_at
FROM SwapRequests sr
JOIN Users u_owner ON sr.owner_id = u_owner.user_id
JOIN WardrobeItems req_item ON sr.requested_item_id = req_item.item_id
JOIN WardrobeItems off_item ON sr.offered_item_id = off_item.item_id
WHERE sr.requester_id = 3
ORDER BY sr.created_at DESC;

-- Accept/Reject swap request
UPDATE SwapRequests
SET status = 'accepted'
WHERE swap_id = 10 AND owner_id = 2;

UPDATE SwapRequests
SET status = 'rejected'
WHERE swap_id = 10 AND owner_id = 2;

-- Mark swap as completed 
UPDATE SwapRequests
SET status = 'completed'
WHERE swap_id = 10;

-- Mark both items as swapped
UPDATE WardrobeItems SET status = 'swapped' WHERE item_id = 6;
UPDATE WardrobeItems SET status = 'swapped' WHERE item_id = 4;

-- Notify owner of swap request
INSERT INTO Notifications (user_id, type, reference_id)
VALUES (2, 'swap_request', 4);

-- Notify requester when swap request is accepted/rejected
INSERT INTO Notifications (user_id, type, reference_id)
VALUES (3, 'swap_accepted', 4);

INSERT INTO Notifications (user_id, type, reference_id)
VALUES (3, 'swap_rejected', 4);

-- Cancel swap request 
DELETE FROM SwapRequests
WHERE swap_id = 1 AND requester_id = 2 AND status = 'pending';


--7: USER CHATS

-- Start conversation between two users
INSERT INTO Conversations (user1_id, user2_id)
VALUES (2, 3);

-- Check if conversation exists between two users
SELECT conversation_id
FROM Conversations
WHERE (user1_id = 2 AND user2_id = 3)
   OR (user1_id = 3 AND user2_id = 2);

-- Send message in conversation
INSERT INTO Messages (conversation_id, sender_id, message_text)
VALUES (2, 3, 'Hey! Are you open to swapping the black blazer?');

-- Show chatbox screen
SELECT c.conversation_id,
       CASE WHEN c.user1_id = 2 THEN u2.username ELSE u1.username END AS other_user,
       CASE WHEN c.user1_id = 2 THEN u2.profile_image ELSE u1.profile_image END AS other_user_img,
       (SELECT TOP 1 message_text FROM Messages
        WHERE conversation_id = c.conversation_id
        ORDER BY sent_at DESC) AS last_message,
       (SELECT TOP 1 sent_at FROM Messages
        WHERE conversation_id = c.conversation_id
        ORDER BY sent_at DESC) AS last_message_time
FROM Conversations c
JOIN Users u1 ON c.user1_id = u1.user_id
JOIN Users u2 ON c.user2_id = u2.user_id
WHERE c.user1_id = 2 OR c.user2_id = 2
ORDER BY last_message_time DESC;

-- Show chat history
SELECT m.message_id, m.sender_id, u.username AS sender_name,
       m.message_text, m.sent_at
FROM Messages m
JOIN Users u ON m.sender_id = u.user_id
WHERE m.conversation_id = 2
ORDER BY m.sent_at ASC;

--  Delete message
DELETE FROM Messages
WHERE message_id = 8 AND sender_id = 2;

-- Delete conversation
DELETE FROM Conversations
WHERE conversation_id = 2
  AND (user1_id = 2 OR user2_id = 2);

-- Count unread messages 
SELECT COUNT(*) AS unread_count
FROM Messages m
JOIN Conversations c ON m.conversation_id = c.conversation_id
WHERE (c.user1_id = 2 OR c.user2_id = 2)
  AND m.sender_id <> 2
  AND m.sent_at > (
      SELECT ISNULL(MAX(sent_at), '2000-01-01')
      FROM Messages
      WHERE conversation_id = m.conversation_id
        AND sender_id = 2
  );

--8: CLOTHING REQUEST POSTS

-- Post clothing request
INSERT INTO ClothingRequests (user_id, description)
VALUES (3, 'Looking for a vintage bomber jacket size M, any color. DM me!');

-- View all clothing requests 
SELECT cr.request_id, u.username, u.profile_image, u.rating_avg,
       cr.description, cr.created_at
FROM ClothingRequests cr
JOIN Users u ON cr.user_id = u.user_id
ORDER BY cr.created_at DESC;

-- Remove clothing request 
DELETE FROM ClothingRequests
WHERE request_id = 7 AND user_id = 3;

--9: TRADE HISTORY 

-- Trade history for user 
SELECT t.trade_id,
       CASE WHEN t.buyer_id = 2 THEN 'Bought' ELSE 'Sold' END AS action,
       wi.title, wi.category, wi.price,
       CASE WHEN t.buyer_id = 2
            THEN (SELECT username FROM Users WHERE user_id = t.seller_id)
            ELSE (SELECT username FROM Users WHERE user_id = t.buyer_id)
       END AS other_party,
       t.trade_type, t.status, t.trade_date
FROM Trades t
JOIN WardrobeItems wi ON t.item_id = wi.item_id
WHERE t.buyer_id = 2 OR t.seller_id = 2
ORDER BY t.trade_date DESC;

-- Swap history for user
SELECT sr.swap_id,
       req_item.title AS item_wanted,
       off_item.title AS item_offered,
       CASE WHEN sr.requester_id = 2 THEN u_owner.username
            ELSE u_req.username END AS other_user,
       sr.status, sr.created_at
FROM SwapRequests sr
JOIN WardrobeItems req_item ON sr.requested_item_id = req_item.item_id
JOIN WardrobeItems off_item ON sr.offered_item_id = off_item.item_id
JOIN Users u_req ON sr.requester_id = u_req.user_id
JOIN Users u_owner ON sr.owner_id = u_owner.user_id
WHERE sr.requester_id = 2 OR sr.owner_id = 2
ORDER BY sr.created_at DESC;

-- Count trades according to status
SELECT status, COUNT(*) AS count
FROM Trades
WHERE buyer_id = 2 OR seller_id = 2
GROUP BY status;

-- Mark pending trade cancelled
UPDATE Trades
SET status = 'cancelled'
WHERE trade_id = 10 AND status = 'pending'
  AND (buyer_id = 4 OR seller_id = 2);


--10: NOTIFICATIONS SYSTEM 

-- Create notification
INSERT INTO Notifications (user_id, type, reference_id)
VALUES (2, 'new_message', 1);

-- Get all notifications  
SELECT notification_id, type, reference_id, is_read, created_at
FROM Notifications
WHERE user_id = 2
ORDER BY created_at DESC;

-- Get unread notifications
SELECT notification_id, type, reference_id, created_at
FROM Notifications
WHERE user_id = 2 AND is_read = 0
ORDER BY created_at DESC;

-- Count unread notifications 
SELECT COUNT(*) AS unread_count
FROM Notifications
WHERE user_id = 2 AND is_read = 0;

-- Mark a notification as read
UPDATE Notifications
SET is_read = 1
WHERE notification_id = 5 AND user_id = 5;

-- Delete all read notifications
DELETE FROM Notifications
WHERE user_id = 2 AND is_read = 1;


--11: RATINGS SYSTEM 

-- Submit rating after trade
INSERT INTO Ratings (reviewer_id, reviewed_user_id, trade_id, rating_value)
VALUES (3, 2, 1, 5);

-- Update user's average rating after new rating
UPDATE Users
SET rating_avg = (
    SELECT AVG(CAST(rating_value AS DECIMAL(3,1)))
    FROM Ratings
    WHERE reviewed_user_id = 2
)
WHERE user_id = 2;

-- Delete rating 
DELETE FROM Ratings
WHERE rating_id = 3 AND reviewer_id = 3;
