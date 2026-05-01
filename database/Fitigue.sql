--DROP DATABASE if exists Fitigue

--CREATE DATABASE Fitigue
--GO

USE Fitigue
GO

DROP TABLE IF EXISTS Ratings
GO
DROP TABLE IF EXISTS Notifications
GO
DROP TABLE IF EXISTS ClothingRequests
GO
DROP TABLE IF EXISTS Messages
GO
DROP TABLE IF EXISTS Conversations
GO
DROP TABLE IF EXISTS Trades
GO
DROP TABLE IF EXISTS SwapRequests
GO
DROP TABLE IF EXISTS MarketplaceListings
GO
DROP TABLE IF EXISTS WardrobeItems
GO
DROP TABLE IF EXISTS Users
GO


CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    gender CHAR(1),
    age INT CHECK (age >= 13),
    created_at DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX idx_users_username ON Users(username);
GO

CREATE TABLE WardrobeItems (
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(1000),
    category VARCHAR(50) NOT NULL,
    size VARCHAR(2) NOT NULL,
    color VARCHAR(30),
    price DECIMAL(10,2) CHECK (price >= 0),
    allow_sale BIT DEFAULT 1,
    allow_swap BIT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'available',
    created_at DATETIME DEFAULT GETDATE(),
    image_url VARCHAR(500) NULL,

    CONSTRAINT fk_item_user FOREIGN KEY (user_id) REFERENCES Users(user_id),
    CONSTRAINT chk_item_status CHECK (status IN ('available','sold','swapped'))
);
GO

CREATE INDEX idx_items_user ON WardrobeItems(user_id);
CREATE INDEX idx_items_category ON WardrobeItems(category);
CREATE INDEX idx_items_price ON WardrobeItems(price);
GO

CREATE TABLE MarketplaceListings (
    listing_id INT IDENTITY(1,1) PRIMARY KEY,
    item_id INT NOT NULL UNIQUE,
    posted_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_listing_item FOREIGN KEY (item_id) REFERENCES WardrobeItems(item_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE TABLE SwapRequests (
    swap_id INT IDENTITY(1,1) PRIMARY KEY,
    requested_item_id INT NOT NULL,
    offered_item_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_requested_item FOREIGN KEY (requested_item_id) REFERENCES WardrobeItems(item_id),
    CONSTRAINT fk_offered_item FOREIGN KEY (offered_item_id) REFERENCES WardrobeItems(item_id),
    CONSTRAINT chk_swap_status CHECK (status IN ('pending','accepted','rejected','completed'))
);
GO

CREATE INDEX idx_swap_requested ON SwapRequests(requested_item_id);
CREATE INDEX idx_swap_offered ON SwapRequests(offered_item_id);
GO

CREATE TABLE Trades (
    trade_id INT IDENTITY(1,1) PRIMARY KEY,
    buyer_id INT,
    item_id INT,
    trade_type VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    trade_date DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_trade_buyer FOREIGN KEY (buyer_id) REFERENCES Users(user_id),
    CONSTRAINT fk_trade_item FOREIGN KEY (item_id) REFERENCES WardrobeItems(item_id),
    CONSTRAINT chk_trade_type CHECK (trade_type IN ('buy','sell')),
    CONSTRAINT chk_trade_status CHECK (status IN ('pending','completed','cancelled'))
);
GO

CREATE INDEX idx_trade_buyer ON Trades(buyer_id);
CREATE INDEX idx_trade_item ON Trades(item_id);
GO

CREATE TABLE Conversations (
    conversation_id INT IDENTITY(1,1) PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_conv_user1 FOREIGN KEY (user1_id) REFERENCES Users(user_id),
    CONSTRAINT fk_conv_user2 FOREIGN KEY (user2_id) REFERENCES Users(user_id),
    CONSTRAINT chk_different_users CHECK (user1_id <> user2_id)
);
GO

CREATE INDEX idx_conv_user1 ON Conversations(user1_id);
CREATE INDEX idx_conv_user2 ON Conversations(user2_id);
GO

CREATE TABLE Messages (
    message_id INT IDENTITY(1,1) PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_text VARCHAR(2000) NOT NULL,
    sent_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_msg_conversation FOREIGN KEY (conversation_id) REFERENCES Conversations(conversation_id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES Users(user_id)
);
GO

CREATE INDEX idx_msg_conversation ON Messages(conversation_id);
GO

CREATE TABLE ClothingRequests (
    request_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    description VARCHAR(1000),
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_request_user FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
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

    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE
);
GO

CREATE INDEX idx_notification_user ON Notifications(user_id);
GO

CREATE TABLE Ratings (
    trade_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    reviewed_user_id INT NOT NULL,
    rating_value INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT pk_ratings PRIMARY KEY (trade_id, reviewer_id),
    CONSTRAINT fk_rating_reviewer FOREIGN KEY (reviewer_id) REFERENCES Users(user_id),
    CONSTRAINT fk_rating_reviewed FOREIGN KEY (reviewed_user_id) REFERENCES Users(user_id),
    CONSTRAINT fk_rating_trade FOREIGN KEY (trade_id) REFERENCES Trades(trade_id),
    CONSTRAINT chk_rating_value CHECK (rating_value BETWEEN 1 AND 5),
    CONSTRAINT chk_no_self_rating CHECK (reviewer_id <> reviewed_user_id)
);
GO

CREATE INDEX idx_rating_reviewed ON Ratings(reviewed_user_id);
GO

CREATE TRIGGER trg_DeleteUser_AllDependencies
ON Users
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DELETE M
    FROM Messages M
    INNER JOIN DELETED D ON M.sender_id = D.user_id;

    DELETE C
    FROM Conversations C
    INNER JOIN DELETED D ON C.user1_id = D.user_id OR C.user2_id = D.user_id;

    DELETE SR
    FROM SwapRequests SR
    INNER JOIN DELETED D ON SR.requested_item_id IN (SELECT item_id FROM WardrobeItems WHERE user_id = D.user_id)
                         OR SR.offered_item_id IN (SELECT item_id FROM WardrobeItems WHERE user_id = D.user_id);

    UPDATE T
    SET buyer_id = NULL
    FROM Trades T
    INNER JOIN DELETED D ON T.buyer_id = D.user_id;

    DELETE R
    FROM Ratings R
    INNER JOIN DELETED D ON R.reviewed_user_id = D.user_id;

    DELETE R
    FROM Ratings R
    INNER JOIN DELETED D ON R.reviewer_id = D.user_id;

    DELETE WI
    FROM WardrobeItems WI
    INNER JOIN DELETED D ON WI.user_id = D.user_id;

    DELETE U
    FROM Users U
    INNER JOIN DELETED D ON U.user_id = D.user_id;
END;
GO

CREATE TRIGGER trg_DeleteWardrobe_AllDependencies
ON WardrobeItems
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE T
    SET item_id = NULL
    FROM Trades T
    INNER JOIN DELETED D ON T.item_id = D.item_id;

    DELETE SR
    FROM SwapRequests SR
    INNER JOIN DELETED D ON SR.requested_item_id = D.item_id
                        OR SR.offered_item_id = D.item_id;

    DELETE WI
    FROM WardrobeItems WI
    INNER JOIN DELETED D ON WI.item_id = D.item_id;
END;
GO


INSERT INTO Users (username, email, password_hash, gender, age)
VALUES
    ('alex_styles',  'alex@example.com',  'hash_alex123',  'M', 24),
    ('sara_fit',     'sara@example.com',  'hash_sara456',  'F', 22),
    ('mike_drip',    'mike@example.com',  'hash_mike789',  'M', 27),
    ('luna_closet',  'luna@example.com',  'hash_luna321',  'F', 19),
    ('jay_threads',  'jay@example.com',   'hash_jay654',   'M', 31),
    ('nina_vogue',   'nina@example.com',  'hash_nina987',  'F', 26),
    ('omar_swaps',   'omar@example.com',  'hash_omar111',  'M', 23),
    ('zara_wear',    'zara@example.com',  'hash_zara222',  'F', 28),
    ('leo_fits',     'leo@example.com',   'hash_leo333',   'M', 21),
    ('maya_outfits', 'maya@example.com',  'hash_maya444',  'F', 25);
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

INSERT INTO MarketplaceListings (item_id)
VALUES
    (1), (2), (3), (4), (6), (7), (8), (9), (11), (13), (15), (20);
GO

INSERT INTO SwapRequests (requested_item_id, offered_item_id, status)
VALUES
    (7,  14,  'pending');

INSERT INTO SwapRequests (requested_item_id, offered_item_id, status)
VALUES
    (5, 7, 'pending'),
    (8, 9, 'completed'),
    (10, 11, 'rejected'),
    (12, 14, 'pending');
GO

INSERT INTO Trades (buyer_id, item_id, trade_type, status)
VALUES
    (2,  2,  'buy', 'completed'),
    (3,  3,  'buy', 'completed'),
    (5,  7,  'buy', 'completed'),
    (6,  9,  'buy', 'completed'),
    (7,  11, 'buy', 'completed'),
    (8,  13, 'buy', 'completed'),
    (9,  15, 'buy', 'completed'),
    (10, 17, 'buy', 'completed'),
    (1,  19, 'buy', 'completed'),
    (4,  6,  'buy', 'pending');
GO

INSERT INTO Conversations (user1_id, user2_id)
VALUES
    (1, 2), (2, 3), (3, 4), (4, 5), (5, 6), (7, 8);
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
    (1, 'Looking for a vintage bomber jacket, size M, any color.'),
    (2, 'Need white sneakers, size 37 or 38, preferably Nike or Adidas.'),
    (3, 'Searching for an oversized flannel shirt, size L or XL.'),
    (4, 'Want cute platform sandals for summer, size 37.'),
    (5, 'Looking for a lightweight raincoat, size L, any color.'),
    (9, 'Need formal chinos or dress pants, size 30x32, navy or grey.');
GO

INSERT INTO Notifications (user_id, type, reference_id, is_read)
VALUES
    (1, 'swap_request',   1, 0),
    (2, 'swap_accepted',  2, 1),
    (3, 'swap_request',   3, 0),
    (4, 'swap_completed', 4, 1),
    (5, 'swap_rejected',  5, 0),
    (6, 'swap_request',   6, 0),
    (2, 'trade_complete', 1, 1),
    (3, 'trade_complete', 2, 1),
    (5, 'trade_complete', 3, 1),
    (6, 'trade_complete', 4, 0),
    (1, 'new_message',    1, 0),
    (8, 'new_message',    6, 0);
GO

INSERT INTO Ratings (trade_id, reviewer_id, reviewed_user_id, rating_value)
VALUES
    (1, 2, 1, 5),
    (1, 1, 2, 4),
    (2, 3, 2, 5),
    (2, 2, 3, 4),
    (3, 5, 4, 5),
    (3, 4, 5, 4),
    (4, 6, 5, 5),
    (4, 5, 6, 3),
    (5, 7, 6, 4),
    (6, 8, 7, 5);
GO

SELECT * FROM Users;
SELECT * FROM WardrobeItems;
SELECT * FROM MarketplaceListings;
SELECT * FROM SwapRequests;
SELECT * FROM Trades;
SELECT * FROM Conversations;
SELECT * FROM Messages;
SELECT * FROM ClothingRequests;
SELECT * FROM Notifications;
SELECT * FROM Ratings;
GO