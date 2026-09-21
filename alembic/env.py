import os
import sys
import urllib.parse
from logging.config import fileConfig

import dotenv
from sqlalchemy import engine_from_config, pool
from alembic import context

# Ensure backend modules are on sys.path
sys.path.insert(0, os.path.abspath("backend"))

# Load environment variables securely from backend/.env if available
env_path = os.path.abspath("backend/.env")
if os.path.exists(env_path):
    dotenv.load_dotenv(env_path)

from db.models import Base
target_metadata = Base.metadata

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def get_database_url() -> str:
    """Dynamically resolves the target database URL from environment without hardcoding."""
    db_url = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not db_url and os.path.exists(env_path):
        vals = dotenv.dotenv_values(env_path)
        db_url = vals.get("SUPABASE_DATABASE_URL") or vals.get("DATABASE_URL")
    
    if not db_url:
        raise ValueError("No SUPABASE_DATABASE_URL or DATABASE_URL found in environment or backend/.env.")
    
    # Ensure postgresql+psycopg2 dialect prefix
    if db_url.startswith("postgres://"):
        db_url = "postgresql+psycopg2://" + db_url[len("postgres://"):]
    elif db_url.startswith("postgresql://"):
        db_url = "postgresql+psycopg2://" + db_url[len("postgresql://"):]
    
    return db_url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_database_url()
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
