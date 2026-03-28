import uuid


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _register_user(client, role: str):
    payload = {
        "email": f"{uuid.uuid4()}@test.com",
        "password": "123456",
        "full_name": "Test User",
        "role": role,
    }
    client.post("/register", json=payload)
    resp = client.post(
        "/login", json={"email": payload["email"], "password": payload["password"]}
    )
    return payload, resp.json()["access_token"]


def test_host_can_create_roost(client):
    _, token = _register_user(client, "host")

    payload = {
        "title": "Garden Suite",
        "bedroom_type": "Private room",
        "bedroom_count": 1,
        "photos": ["https://example.com/room.jpg"],
        "wifi_speed_mbps": 180,
        "place_name": "Berlin, Germany",
    }
    create_resp = client.post(
        "/roosts", json=payload, headers=_auth_headers(token)
    )
    assert create_resp.status_code == 200

    mine_resp = client.get("/roosts/mine", headers=_auth_headers(token))
    assert mine_resp.status_code == 200
    assert len(mine_resp.json()) == 1


def test_artisan_can_create_root(client):
    _, token = _register_user(client, "artisan")

    payload = {
        "service_category": "Food",
        "service_description": "Seasonal village supper",
        "service_capacity": 4,
        "place_name": "Tokyo, Japan",
    }
    create_resp = client.post(
        "/roots", json=payload, headers=_auth_headers(token)
    )
    assert create_resp.status_code == 200

    mine_resp = client.get("/roots/mine", headers=_auth_headers(token))
    assert mine_resp.status_code == 200
    assert len(mine_resp.json()) == 1


def test_role_guard_blocks_mismatch(client):
    _, token = _register_user(client, "nomad")

    payload = {
        "title": "Riverside Nook",
        "bedroom_type": "Shared",
        "wifi_speed_mbps": 90,
        "place_name": "New York, USA",
    }
    resp = client.post("/roosts", json=payload, headers=_auth_headers(token))
    assert resp.status_code == 403
