
"""initial
Revision ID: 23701ac6ebc8
Revises: 
Create Date: 2026-06-08 10:53:46.224689
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '23701ac6ebc8'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # This initial migration creates all tables from current models metadata.
    bind = op.get_bind()
    # Use SQLAlchemy metadata to create tables in correct order
    from flask_app.models import db
    db.metadata.create_all(bind=bind)


def downgrade():
    bind = op.get_bind()
    from flask_app.models import db
    db.metadata.drop_all(bind=bind)
