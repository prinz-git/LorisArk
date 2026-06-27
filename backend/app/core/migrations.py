from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from app.core.roles import RoleEnum
from app.core.security import hash_password
from app.models import User


def ensure_superadmin_user(session_factory) -> None:
    db = session_factory()
    try:
        user = db.query(User).filter(User.email == "superadmin").first()
        password = hash_password("super!@#")
        if user:
            user.full_name = user.full_name or "Super Admin"
            user.password = password
            user.role = RoleEnum.superadmin.value
        else:
            db.add(
                User(
                    email="superadmin",
                    full_name="Super Admin",
                    password=password,
                    role=RoleEnum.superadmin.value,
                )
            )
        db.commit()
    finally:
        db.close()


def ensure_user_role_column(engine: Engine) -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    if "role" in columns:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR"))
        connection.execute(text("UPDATE users SET role = 'nomad' WHERE role IS NULL"))


def ensure_inventory_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    if not tables:
        return

    if "roosts" in tables:
        _ensure_inventory_table(engine, inspector, "roosts")
    if "roots" in tables:
        _ensure_inventory_table(engine, inspector, "roots")


def ensure_bundling_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    if not tables:
        return

    required_tables = {
        "bundles": _create_bundles_table,
        "bundle_items": _create_bundle_items_table,
        "service_tickets": _create_service_tickets_table,
        "root_daily_capacity": _create_root_daily_capacity_table,
    }
    for name, creator in required_tables.items():
        if name not in tables:
            creator(engine)

    inspector = inspect(engine)
    if "bundles" in inspector.get_table_names():
        _ensure_status_column(engine, inspector, "bundles", "pending_host")
    if "service_tickets" in inspector.get_table_names():
        _ensure_status_column(engine, inspector, "service_tickets", "pending_host")


def _ensure_status_column(
    engine: Engine, inspector, table_name: str, default_status: str
) -> None:
    columns = {column["name"] for column in inspector.get_columns(table_name)}
    with engine.begin() as connection:
        if "status" not in columns:
            connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN status VARCHAR"))
        connection.execute(
            text(
                f"UPDATE {table_name} SET status = :status "
                "WHERE status IS NULL OR status = ''"
            ),
            {"status": default_status},
        )


def _ensure_inventory_table(engine: Engine, inspector, table_name: str) -> None:
    columns = {column["name"]: column for column in inspector.get_columns(table_name)}
    has_place = "place_name" in columns
    lat_nullable = columns.get("latitude", {}).get("nullable", True)
    lon_nullable = columns.get("longitude", {}).get("nullable", True)
    if table_name == "roosts":
        required = {"wifi_active", "nightly_rate", "availability_ranges", "is_deleted"}
    else:
        required = {
            "remaining_capacity",
            "available_days",
            "service_window_start",
            "service_window_end",
            "is_active",
            "is_deleted",
            "base_price",
        }
    has_required = required.issubset(set(columns.keys()))

    if engine.dialect.name == "sqlite":
        if not has_place or not lat_nullable or not lon_nullable or not has_required:
            _rebuild_sqlite_inventory_table(engine, table_name, list(columns.keys()))
        return

    with engine.begin() as connection:
        if not has_place:
            connection.execute(
                text(f"ALTER TABLE {table_name} ADD COLUMN place_name VARCHAR")
            )
        if "latitude" in columns and not lat_nullable:
            connection.execute(
                text(f"ALTER TABLE {table_name} ALTER COLUMN latitude DROP NOT NULL")
            )
        if "longitude" in columns and not lon_nullable:
            connection.execute(
                text(f"ALTER TABLE {table_name} ALTER COLUMN longitude DROP NOT NULL")
            )
        column_types = {
            "wifi_active": "BOOLEAN",
            "nightly_rate": "FLOAT",
            "availability_ranges": "JSON",
            "is_deleted": "BOOLEAN",
            "remaining_capacity": "INTEGER",
            "available_days": "VARCHAR",
            "service_window_start": "VARCHAR",
            "service_window_end": "VARCHAR",
            "is_active": "BOOLEAN",
            "base_price": "FLOAT",
        }
        for column_name in required:
            if column_name not in columns:
                column_type = column_types.get(column_name, "VARCHAR")
                connection.execute(
                    text(
                        f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
                    )
                )
        if "is_deleted" in required:
            connection.execute(
                text(f"UPDATE {table_name} SET is_deleted = 0 WHERE is_deleted IS NULL")
            )


def _rebuild_sqlite_inventory_table(
    engine: Engine, table_name: str, existing_columns: list[str]
) -> None:
    if table_name == "roosts":
        create_sql = """
        CREATE TABLE roosts (
            id INTEGER PRIMARY KEY,
            provider_id INTEGER NOT NULL,
            title VARCHAR NOT NULL,
            bedroom_type VARCHAR NOT NULL,
            bedroom_count INTEGER,
            photos JSON,
            wifi_speed_mbps FLOAT NOT NULL,
            wifi_active BOOLEAN NOT NULL,
            is_deleted BOOLEAN NOT NULL,
            nightly_rate FLOAT,
            availability_ranges JSON,
            place_name VARCHAR,
            latitude FLOAT,
            longitude FLOAT,
            created_at DATETIME,
            updated_at DATETIME
        )
        """
        base_columns = [
            "id",
            "provider_id",
            "title",
            "bedroom_type",
            "bedroom_count",
            "photos",
            "wifi_speed_mbps",
            "wifi_active",
            "is_deleted",
            "nightly_rate",
            "availability_ranges",
            "latitude",
            "longitude",
            "created_at",
            "updated_at",
        ]
    else:
        create_sql = """
        CREATE TABLE roots (
            id INTEGER PRIMARY KEY,
            provider_id INTEGER NOT NULL,
            service_category VARCHAR NOT NULL,
            service_description VARCHAR NOT NULL,
            service_capacity INTEGER NOT NULL,
            remaining_capacity INTEGER,
            available_days VARCHAR,
            service_window_start VARCHAR,
            service_window_end VARCHAR,
            is_active BOOLEAN NOT NULL,
            is_deleted BOOLEAN NOT NULL,
            base_price FLOAT,
            place_name VARCHAR,
            latitude FLOAT,
            longitude FLOAT,
            created_at DATETIME,
            updated_at DATETIME
        )
        """
        base_columns = [
            "id",
            "provider_id",
            "service_category",
            "service_description",
            "service_capacity",
            "remaining_capacity",
            "available_days",
            "service_window_start",
            "service_window_end",
            "is_active",
            "is_deleted",
            "base_price",
            "latitude",
            "longitude",
            "created_at",
            "updated_at",
        ]

    desired_columns = base_columns + ["place_name"]
    select_columns = []
    for column in desired_columns:
        if column in existing_columns:
            select_columns.append(column)
        else:
            if column in {"wifi_active", "is_active"}:
                select_columns.append("1 AS {}".format(column))
            elif column == "is_deleted":
                select_columns.append("0 AS is_deleted")
            elif column == "remaining_capacity":
                if "service_capacity" in existing_columns:
                    select_columns.append("service_capacity AS remaining_capacity")
                else:
                    select_columns.append("NULL AS remaining_capacity")
            else:
                select_columns.append(f"NULL AS {column}")
    target_columns = desired_columns

    with engine.begin() as connection:
        connection.execute(text(f"ALTER TABLE {table_name} RENAME TO {table_name}_old"))
        connection.execute(text(create_sql))
        if existing_columns:
            connection.execute(
                text(
                    "INSERT INTO {table} ({columns}) SELECT {selects} FROM {old}".format(
                        table=table_name,
                        columns=", ".join(target_columns),
                        selects=", ".join(select_columns),
                        old=f"{table_name}_old",
                    )
                )
            )
        connection.execute(text(f"DROP TABLE {table_name}_old"))


def _create_bundles_table(engine: Engine) -> None:
    create_sql = """
    CREATE TABLE bundles (
        id INTEGER PRIMARY KEY,
        nomad_id INTEGER NOT NULL,
        roost_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_price FLOAT NOT NULL,
        status VARCHAR NOT NULL,
        created_at DATETIME,
        updated_at DATETIME
    )
    """
    with engine.begin() as connection:
        connection.execute(text(create_sql))


def _create_bundle_items_table(engine: Engine) -> None:
    create_sql = """
    CREATE TABLE bundle_items (
        id INTEGER PRIMARY KEY,
        bundle_id INTEGER NOT NULL,
        root_id INTEGER NOT NULL,
        scheduled_date DATE NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price FLOAT NOT NULL,
        total_price FLOAT NOT NULL
    )
    """
    with engine.begin() as connection:
        connection.execute(text(create_sql))


def _create_service_tickets_table(engine: Engine) -> None:
    create_sql = """
    CREATE TABLE service_tickets (
        id INTEGER PRIMARY KEY,
        bundle_id INTEGER NOT NULL,
        root_id INTEGER NOT NULL,
        nomad_id INTEGER NOT NULL,
        host_id INTEGER NOT NULL,
        status VARCHAR NOT NULL,
        note VARCHAR,
        created_at DATETIME
    )
    """
    with engine.begin() as connection:
        connection.execute(text(create_sql))


def _create_root_daily_capacity_table(engine: Engine) -> None:
    create_sql = """
    CREATE TABLE root_daily_capacity (
        id INTEGER PRIMARY KEY,
        root_id INTEGER NOT NULL,
        date DATE NOT NULL,
        remaining_capacity INTEGER NOT NULL
    )
    """
    with engine.begin() as connection:
        connection.execute(text(create_sql))
