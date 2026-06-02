"""
Portable SQLAlchemy types that work across PostgreSQL (production) and
SQLite (tests).  Import from here instead of sqlalchemy.dialects.postgresql.
"""
import uuid

from sqlalchemy import String, types


class PortableUUID(types.TypeDecorator):
    """
    UUID type that stores as native UUID on PostgreSQL and VARCHAR(36) on SQLite.

    This allows models to run without modification against both dialects, which
    is important for the in-memory SQLite test database.
    """

    impl = String(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import UUID as PGUUID

            return dialect.type_descriptor(PGUUID(as_uuid=True))
        else:
            return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            # psycopg2 handles UUID objects natively
            return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
        # SQLite: store as plain string
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))
