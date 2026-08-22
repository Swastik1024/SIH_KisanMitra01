-- Users and authentication
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('farmer', 'trader', 'agent', 'admin')),
    language TEXT DEFAULT 'en',
    location TEXT,
    verified BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trader_licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    licence_number TEXT NOT NULL,
    expiry_date DATE,
    verified BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE agent_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    service_area TEXT,
    commission_rate REAL DEFAULT 0,
    is_approved BOOLEAN DEFAULT 0,
    rating REAL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Categories and translations
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL
);

CREATE TABLE category_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    language TEXT NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(category_id, language),
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
);

-- Products and media
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    status TEXT DEFAULT 'pending_inspection'
        CHECK (status IN ('pending_inspection', 'verified', 'rejected', 'listed', 'sold')),
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users (id),
    FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE product_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    url TEXT NOT NULL,
    uploaded_by INTEGER NOT NULL,  -- user id (farmer or agent)
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users (id)
);

-- Inspection and AI quality report
CREATE TABLE inspection_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    agent_id INTEGER NOT NULL,
    inspection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quality_grade TEXT,           -- A, B, C, D
    freshness_score REAL,
    defect_rate REAL,
    size_uniformity TEXT,
    color_ripeness TEXT,
    foreign_material TEXT,
    moisture REAL,
    weight_estimate REAL,
    confidence_score REAL,
    recommendations TEXT,
    final_base_price REAL NOT NULL,  -- set by agent
    notes TEXT,
    FOREIGN KEY (product_id) REFERENCES products (id),
    FOREIGN KEY (agent_id) REFERENCES users (id)
);

-- Auctions
CREATE TABLE auctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL UNIQUE,
    farmer_id INTEGER NOT NULL,
    agent_id INTEGER NOT NULL,          -- agent who created/inspected
    base_price REAL NOT NULL,           -- final base price
    reserve_price REAL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    current_highest_bid REAL,
    current_highest_bidder_id INTEGER,
    status TEXT DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    min_bid_increment REAL DEFAULT 10,
    auto_extension_enabled BOOLEAN DEFAULT 1,
    FOREIGN KEY (product_id) REFERENCES products (id),
    FOREIGN KEY (farmer_id) REFERENCES users (id),
    FOREIGN KEY (agent_id) REFERENCES users (id),
    FOREIGN KEY (current_highest_bidder_id) REFERENCES users (id)
);

CREATE TABLE bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id INTEGER NOT NULL,
    bidder_id INTEGER NOT NULL,
    bid_amount REAL NOT NULL,
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_winning BOOLEAN DEFAULT 0,
    FOREIGN KEY (auction_id) REFERENCES auctions (id) ON DELETE CASCADE,
    FOREIGN KEY (bidder_id) REFERENCES users (id)
);

-- Orders and delivery
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    auction_id INTEGER,                -- nullable, if from auction
    trader_id INTEGER NOT NULL,
    agent_id INTEGER,
    quantity REAL NOT NULL,
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'shipped', 'delivered', 'cancelled')),
    payment_status TEXT DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'held', 'released', 'refunded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id),
    FOREIGN KEY (auction_id) REFERENCES auctions (id),
    FOREIGN KEY (trader_id) REFERENCES users (id),
    FOREIGN KEY (agent_id) REFERENCES users (id)
);

CREATE TABLE order_delivery_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL,  -- packed, shipped, in_transit, out_for_delivery, delivered
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location TEXT,
    note TEXT,
    updated_by INTEGER NOT NULL,       -- user id (agent/farmer/admin)
    proof_image_url TEXT,
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users (id)
);

-- Payments, escrow, GST
CREATE TABLE payment_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    gateway_transaction_id TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'created'
        CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')),
    payment_method TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE TABLE escrow_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL UNIQUE,
    amount_held REAL NOT NULL,
    status TEXT DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
    released_at TIMESTAMP,
    released_to TEXT,
    FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE TABLE payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
    payout_reference TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE TABLE gst_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL UNIQUE,
    invoice_number TEXT NOT NULL,
    gstin_seller TEXT,
    gstin_buyer TEXT,
    cgst REAL DEFAULT 0,
    sgst REAL DEFAULT 0,
    igst REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    invoice_pdf_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE TABLE commissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    agent_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (agent_id) REFERENCES users (id)
);

-- Notifications
CREATE TABLE notification_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_key TEXT NOT NULL,
    language TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    UNIQUE(template_key, language)
);

CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);