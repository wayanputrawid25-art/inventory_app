"""
Create initial admin and opname users. Uses app factory to access DB models.
Usage (PowerShell):
  $env:DATABASE_URL='postgresql+psycopg2://user:pass@host:port/dbname?sslmode=require'
  $env:SECRET_KEY='dev-secret'; $env:JWT_SECRET_KEY='dev-secret'; .venv\Scripts\python scripts\create_initial_users.py --admin admin:AdminPass123 --opname opname:OpnamePass123

This will create two users if they do not exist: role 'admin' and 'checker_opname'.
"""
import os
import sys
import argparse
from app import create_app
from flask_app.utils.auth import AuthService
from flask_app.models import db, User, RoleEnum


def create_users(admin_creds, opname_creds):
    app = create_app()
    with app.app_context():
        admin_username, admin_password = admin_creds.split(':', 1)
        opname_username, opname_password = opname_creds.split(':', 1)

        # Admin
        if not User.query.filter_by(username=admin_username).first():
            admin = User(
                username=admin_username,
                email=f'{admin_username}@example.com',
                password_hash=AuthService.hash_password(admin_password),
                nama_lengkap='Administrator',
                role=RoleEnum.ADMIN
            )
            db.session.add(admin)
            print(f'Created admin user: {admin_username}')
        else:
            print(f'Admin user {admin_username} already exists')

        # Opname user
        if not User.query.filter_by(username=opname_username).first():
            user = User(
                username=opname_username,
                email=f'{opname_username}@example.com',
                password_hash=AuthService.hash_password(opname_password),
                nama_lengkap='Opname User',
                role=RoleEnum.CHECKER_OPNAME
            )
            db.session.add(user)
            print(f'Created opname user: {opname_username}')
        else:
            print(f'Opname user {opname_username} already exists')

        db.session.commit()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--admin', required=True, help='admin_username:password')
    parser.add_argument('--opname', required=True, help='opname_username:password')
    args = parser.parse_args()
    create_users(args.admin, args.opname)
