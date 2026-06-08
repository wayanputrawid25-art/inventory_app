"""
Run a SQL file against the database specified by DATABASE_URL env var.
Usage:
  set DATABASE_URL="postgresql+psycopg2://user:pass@host:port/dbname?sslmode=require"
  .venv\Scripts\python scripts\run_sql_file.py schema.sql

This will execute the SQL statements in the file sequentially.
"""
import os
import sys
from sqlalchemy import create_engine, text

def main():
    if len(sys.argv) < 2:
        print('Usage: run_sql_file.py <path-to-sql-file>')
        sys.exit(1)

    sql_file = sys.argv[1]
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print('DATABASE_URL not set. Export it before running this script.')
        sys.exit(2)

    if not os.path.exists(sql_file):
        print(f'SQL file not found: {sql_file}')
        sys.exit(3)

    engine = create_engine(database_url)

    with open(sql_file, 'r', encoding='utf-8') as f:
        sql = f.read()

    statements = [s.strip() for s in sql.split(';') if s.strip()]

    with engine.begin() as conn:
        for stmt in statements:
            try:
                print('Executing...')
                conn.execute(text(stmt))
            except Exception as e:
                print('Statement failed:', e)
                raise

    print('SQL script executed successfully.')

if __name__ == '__main__':
    main()
