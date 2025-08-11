#!/usr/bin/env python3
"""
Direct Render Database Setup Script
Connects to your Render PostgreSQL database and creates all required tables.
"""

import psycopg2
import sys
import os

# Your Render database connection string
DATABASE_URL = "postgresql://caregrid_db_user:VlZE0uQ3DlQRVjUVhJatj67UdKhF8dcg@dpg-d2cajkbuibrs738a74m0-a.oregon-postgres.render.com/caregrid_db"

def read_sql_file(file_path):
    """Read SQL file content"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        print(f"❌ Error: SQL file not found: {file_path}")
        return None
    except Exception as e:
        print(f"❌ Error reading SQL file: {e}")
        return None

def setup_database():
    """Connect to Render database and create tables"""
    print("🚀 Setting up Render PostgreSQL database...")
    
    try:
        # Connect to database
        print("📡 Connecting to Render database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Test connection
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Connected to PostgreSQL: {version[0][:50]}...")
        
        # Read migration SQL
        sql_file = "backend/migrations/001_initial_schema.sql"
        print(f"📄 Reading migration file: {sql_file}")
        
        sql_content = read_sql_file(sql_file)
        if not sql_content:
            return False
            
        # Execute migration
        print("🔧 Creating database tables...")
        cursor.execute(sql_content)
        conn.commit()
        
        # Verify tables were created
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"\n✅ Successfully created {len(tables)} tables:")
        for table in tables:
            print(f"   📋 {table[0]}")
            
        cursor.close()
        conn.close()
        
        print("\n🎉 Database setup completed successfully!")
        print("\n📋 Next Steps:")
        print("1. Test API: python3 test_api_mode.py")
        print("2. Process clinics: python3 caregrid_listings_manager.py input/test_clinics.csv")
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def check_dependencies():
    """Check if psycopg2 is installed"""
    try:
        import psycopg2
        return True
    except ImportError:
        print("❌ psycopg2 not found. Installing...")
        os.system("pip3 install psycopg2-binary")
        try:
            import psycopg2
            print("✅ psycopg2 installed successfully")
            return True
        except ImportError:
            print("❌ Failed to install psycopg2. Please install manually:")
            print("   pip3 install psycopg2-binary")
            return False

if __name__ == "__main__":
    print("🔧 CareGrid Render Database Setup")
    print("=" * 40)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Setup database
    if setup_database():
        print("\n🚀 Ready to publish clinics to CareGrid API!")
        sys.exit(0)
    else:
        print("\n❌ Database setup failed. Please check the errors above.")
        sys.exit(1)