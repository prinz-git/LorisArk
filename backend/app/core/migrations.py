from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


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


def _ensure_inventory_table(engine: Engine, inspector, table_name: str) -> None:
    columns = {column["name"]: column for column in inspector.get_columns(table_name)}
    has_place = "place_name" in columns
    lat_nullable = columns.get("latitude", {}).get("nullable", True)
    lon_nullable = columns.get("longitude", {}).get("nullable", True)

    if engine.dialect.name == "sqlite":
        if not has_place or not lat_nullable or not lon_nullable:
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
            "latitude",
            "longitude",
            "created_at",
            "updated_at",
        ]

    available_columns = [col for col in base_columns if col in existing_columns]
    target_columns = available_columns + ["place_name"]
    if "place_name" in existing_columns:
        select_columns = available_columns + ["place_name"]
    else:
        select_columns = available_columns + ["NULL AS place_name"]

    with engine.begin() as connection:
        connection.execute(text(f"ALTER TABLE {table_name} RENAME TO {table_name}_old"))
        connection.execute(text(create_sql))
        if available_columns:
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
