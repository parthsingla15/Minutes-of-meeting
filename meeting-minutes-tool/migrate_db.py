from sqlalchemy import create_engine, text
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.begin() as conn:
        try:
            conn.execute(text('CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY, email VARCHAR NOT NULL UNIQUE, hashed_password VARCHAR NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'))
            print("Users table created.")
        except Exception as e:
            print(f"Error creating users: {e}")
            
        try:
            conn.execute(text('ALTER TABLE meetings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE'))
            print("user_id added to meetings.")
        except Exception as e:
            print(f"Error altering meetings: {e}")

if __name__ == "__main__":
    migrate()
