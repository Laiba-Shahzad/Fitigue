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
    --CONSTRAINT chk_item_status CHECK (status IN ('available','sold','swapped','traded'))
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
    --CONSTRAINT chk_swap_status CHECK (status IN ('pending','accepted','rejected','completed'))
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
    --CONSTRAINT chk_trade_type CHECK (trade_type IN ('buy','sell')),
    --CONSTRAINT chk_trade_status CHECK (status IN ('pending','completed','cancelled'))
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