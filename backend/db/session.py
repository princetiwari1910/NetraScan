from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings

# Configure database engine
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that provides a transactional database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


_volume_sync_fn = None
_volume_reload_fn = None


def register_volume_hooks(sync_fn=None, reload_fn=None):
    """Registers persistence hooks for cloud-mounted volumes."""
    global _volume_sync_fn, _volume_reload_fn
    if sync_fn:
        _volume_sync_fn = sync_fn
    if reload_fn:
        _volume_reload_fn = reload_fn


def sync_volume():
    """Flushes volume commits to persistent storage."""
    global _volume_sync_fn
    if _volume_sync_fn:
        try:
            _volume_sync_fn()
        except Exception:
            pass


def reload_volume():
    """Reloads volume cache from persistent storage."""
    global _volume_reload_fn
    if _volume_reload_fn:
        try:
            _volume_reload_fn()
        except Exception:
            pass
