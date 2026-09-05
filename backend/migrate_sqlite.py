import sqlite3

def migrate():
    con = sqlite3.connect("agrimart.db")
    cur = con.cursor()
    
    # Check if agent_id is in inspection_reports
    cur.execute("PRAGMA table_info(inspection_reports)")
    cols = cur.fetchall()
    col_dict = {c[1]: c for c in cols}
    
    if "agent_id" in col_dict:
        print("Migrating inspection_reports to remove obsolete agent_id NOT NULL constraint...")
        
        # Create temp table matching model
        cur.execute("""
            CREATE TABLE IF NOT EXISTS inspection_reports_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL UNIQUE,
                inspection_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                quality_grade VARCHAR(10),
                freshness_score FLOAT,
                defect_rate FLOAT,
                size_uniformity VARCHAR(100),
                color_ripeness VARCHAR(100),
                foreign_material VARCHAR(255),
                moisture FLOAT,
                weight_estimate FLOAT,
                confidence_score FLOAT,
                recommendations TEXT,
                final_base_price FLOAT NOT NULL,
                notes TEXT,
                inspection_data TEXT,
                FOREIGN KEY (product_id) REFERENCES products (id)
            )
        """)
        
        # Copy data over
        cur.execute("""
            INSERT OR IGNORE INTO inspection_reports_new (
                id, product_id, inspection_date, quality_grade, freshness_score, 
                defect_rate, size_uniformity, color_ripeness, foreign_material, 
                moisture, weight_estimate, confidence_score, recommendations, 
                final_base_price, notes, inspection_data
            )
            SELECT 
                id, product_id, inspection_date, quality_grade, freshness_score, 
                defect_rate, size_uniformity, color_ripeness, foreign_material, 
                moisture, weight_estimate, confidence_score, recommendations, 
                final_base_price, notes, inspection_data
            FROM inspection_reports
        """)
        
    # Check if agent_id is in auctions
    cur.execute("PRAGMA table_info(auctions)")
    auc_cols = cur.fetchall()
    auc_col_dict = {c[1]: c for c in auc_cols}
    if "agent_id" in auc_col_dict:
        print("Migrating auctions table to remove obsolete agent_id NOT NULL constraint...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS auctions_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL UNIQUE,
                farmer_id INTEGER NOT NULL,
                base_price FLOAT NOT NULL,
                reserve_price FLOAT,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                current_highest_bid FLOAT,
                current_highest_bidder_id INTEGER,
                status VARCHAR(20) DEFAULT 'scheduled',
                min_bid_increment FLOAT DEFAULT 10.0,
                auto_extension_enabled BOOLEAN DEFAULT 1,
                FOREIGN KEY (product_id) REFERENCES products (id),
                FOREIGN KEY (farmer_id) REFERENCES users (id),
                FOREIGN KEY (current_highest_bidder_id) REFERENCES users (id)
            )
        """)
        cur.execute("""
            INSERT OR IGNORE INTO auctions_new (
                id, product_id, farmer_id, base_price, reserve_price,
                start_time, end_time, current_highest_bid, current_highest_bidder_id,
                status, min_bid_increment, auto_extension_enabled
            )
            SELECT 
                id, product_id, farmer_id, base_price, reserve_price,
                start_time, end_time, current_highest_bid, current_highest_bidder_id,
                status, min_bid_increment, auto_extension_enabled
            FROM auctions
        """)
        cur.execute("DROP TABLE auctions")
        cur.execute("ALTER TABLE auctions_new RENAME TO auctions")
        con.commit()

    
    con.close()

if __name__ == "__main__":
    migrate()
