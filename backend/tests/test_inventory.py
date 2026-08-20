import uuid
from pathlib import Path


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
        "status": "hidden",
        "nightly_rate": 145,
        "availability_ranges": [
            {"start_date": "2026-04-20", "end_date": "2026-04-24"},
            {"start_date": "2026-05-01", "end_date": "2026-05-06"},
        ],
        "place_name": "Berlin, Germany",
    }
    create_resp = client.post(
        "/roosts", json=payload, headers=_auth_headers(token)
    )
    assert create_resp.status_code == 200
    body = create_resp.json()
    assert body["wifi_active"] is False
    assert body["nightly_rate"] == 145
    assert len(body["availability_ranges"]) == 2

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


def test_host_can_upload_roost_image_and_nomad_can_view_url(client):
    _, host_token = _register_user(client, "host")
    roost_resp = client.post(
        "/roosts",
        json={
            "title": "Image Roost",
            "bedroom_type": "Private room",
            "wifi_speed_mbps": 120,
            "place_name": "Lisbon",
            "photos": [],
        },
        headers=_auth_headers(host_token),
    )
    assert roost_resp.status_code == 200

    upload_resp = client.post(
        f"/roosts/{roost_resp.json()['id']}/photos",
        files={"image": ("room.png", b"\x89PNG\r\n\x1a\n", "image/png")},
        headers=_auth_headers(host_token),
    )
    assert upload_resp.status_code == 200
    photo_url = upload_resp.json()["photos"][0]
    assert photo_url.startswith("/static/uploads/roosts/")

    _, nomad_token = _register_user(client, "nomad")
    public_resp = client.get("/roosts?page=1&limit=10", headers=_auth_headers(nomad_token))
    assert public_resp.status_code == 200
    assert public_resp.json()["items"][0]["photos"] == [photo_url]

    (Path("backend/app") / photo_url.removeprefix("/")).unlink(missing_ok=True)


def test_artisan_can_upload_root_image_and_nomad_can_view_url(client):
    _, artisan_token = _register_user(client, "artisan")
    root_resp = client.post(
        "/roots",
        json={
            "service_category": "Food",
            "service_description": "Image Supper",
            "service_capacity": 4,
            "place_name": "Lisbon",
            "photos": [],
        },
        headers=_auth_headers(artisan_token),
    )
    assert root_resp.status_code == 200

    upload_resp = client.post(
        f"/roots/{root_resp.json()['id']}/photos",
        files={"image": ("supper.png", b"\x89PNG\r\n\x1a\n", "image/png")},
        headers=_auth_headers(artisan_token),
    )
    assert upload_resp.status_code == 200
    photo_url = upload_resp.json()["photos"][0]
    assert photo_url.startswith("/static/uploads/roots/")

    _, nomad_token = _register_user(client, "nomad")
    public_resp = client.get("/roots?page=1&limit=10", headers=_auth_headers(nomad_token))
    assert public_resp.status_code == 200
    assert public_resp.json()["items"][0]["photos"] == [photo_url]

    (Path("backend/app") / photo_url.removeprefix("/")).unlink(missing_ok=True)


def test_upload_rejects_non_image_files(client):
    _, host_token = _register_user(client, "host")
    roost_resp = client.post(
        "/roosts",
        json={
            "title": "No Text Files",
            "bedroom_type": "Private room",
            "wifi_speed_mbps": 120,
            "place_name": "Lisbon",
        },
        headers=_auth_headers(host_token),
    )
    assert roost_resp.status_code == 200

    upload_resp = client.post(
        f"/roosts/{roost_resp.json()['id']}/photos",
        files={"image": ("notes.txt", b"hello", "text/plain")},
        headers=_auth_headers(host_token),
    )
    assert upload_resp.status_code == 400


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


def test_artisan_guard_blocks_root_creation(client):
    _, token = _register_user(client, "nomad")

    payload = {
        "service_category": "Craft",
        "service_description": "Wood carving",
        "service_capacity": 3,
        "place_name": "Kyoto, Japan",
    }
    resp = client.post("/roots", json=payload, headers=_auth_headers(token))
    assert resp.status_code == 403


def test_roost_pagination_and_search(client):
    _, host_token = _register_user(client, "host")
    for idx in range(7):
        payload = {
            "title": f"Roost {idx}",
            "bedroom_type": "Private room",
            "bedroom_count": 1,
            "photos": [],
            "wifi_speed_mbps": 120,
            "place_name": "Lisbon" if idx % 2 == 0 else "Porto",
        }
        resp = client.post("/roosts", json=payload, headers=_auth_headers(host_token))
        assert resp.status_code == 200

    _, nomad_token = _register_user(client, "nomad")
    page1 = client.get(
        "/roosts?page=1&limit=3",
        headers=_auth_headers(nomad_token),
    )
    assert page1.status_code == 200
    body1 = page1.json()
    assert body1["total"] == 7
    assert len(body1["items"]) == 3

    page3 = client.get(
        "/roosts?page=3&limit=3",
        headers=_auth_headers(nomad_token),
    )
    assert page3.status_code == 200
    body3 = page3.json()
    assert len(body3["items"]) == 1

    search = client.get(
        "/roosts?page=1&limit=10&search=Porto",
        headers=_auth_headers(nomad_token),
    )
    assert search.status_code == 200
    search_body = search.json()
    assert search_body["total"] == 3
    assert all(
        item["place_name"] == "Porto" for item in search_body["items"]
    )


def test_root_pagination_and_search(client):
    _, artisan_token = _register_user(client, "artisan")
    for idx in range(5):
        payload = {
            "service_category": "Food" if idx % 2 == 0 else "Guiding",
            "service_description": f"Service {idx}",
            "service_capacity": 4,
            "place_name": "Reykjavik" if idx % 2 == 0 else "Oslo",
        }
        resp = client.post("/roots", json=payload, headers=_auth_headers(artisan_token))
        assert resp.status_code == 200

    _, nomad_token = _register_user(client, "nomad")
    page1 = client.get(
        "/roots?page=1&limit=2",
        headers=_auth_headers(nomad_token),
    )
    assert page1.status_code == 200
    body1 = page1.json()
    assert body1["total"] == 5
    assert len(body1["items"]) == 2

    search = client.get(
        "/roots?page=1&limit=10&search=Oslo",
        headers=_auth_headers(nomad_token),
    )
    assert search.status_code == 200
    search_body = search.json()
    assert search_body["total"] == 2
    assert all(item["place_name"] == "Oslo" for item in search_body["items"])


def test_superadmin_sees_all_provider_inventory(client, superadmin_token):
    _, host_token = _register_user(client, "host")
    _, other_host_token = _register_user(client, "host")
    _, artisan_token = _register_user(client, "artisan")
    _, other_artisan_token = _register_user(client, "artisan")

    for title, token in [("First Roost", host_token), ("Second Roost", other_host_token)]:
        resp = client.post(
            "/roosts",
            json={
                "title": title,
                "bedroom_type": "Private room",
                "bedroom_count": 1,
                "photos": [],
                "wifi_speed_mbps": 120,
                "place_name": "Lisbon",
            },
            headers=_auth_headers(token),
        )
        assert resp.status_code == 200

    for description, token in [
        ("First Root", artisan_token),
        ("Second Root", other_artisan_token),
    ]:
        resp = client.post(
            "/roots",
            json={
                "service_category": "Food",
                "service_description": description,
                "service_capacity": 4,
                "place_name": "Lisbon",
            },
            headers=_auth_headers(token),
        )
        assert resp.status_code == 200

    roosts = client.get("/roosts/mine", headers=_auth_headers(superadmin_token))
    roots = client.get("/roots/mine", headers=_auth_headers(superadmin_token))

    assert roosts.status_code == 200
    assert roots.status_code == 200
    assert {item["title"] for item in roosts.json()} == {"First Roost", "Second Roost"}
    assert {item["service_description"] for item in roots.json()} == {
        "First Root",
        "Second Root",
    }


def test_roost_update_and_delete(client):
    _, host_token = _register_user(client, "host")
    _, nomad_token = _register_user(client, "nomad")
    payload = {
        "title": "Harbor Loft",
        "bedroom_type": "Private room",
        "bedroom_count": 1,
        "photos": [],
        "wifi_speed_mbps": 100,
        "place_name": "Lisbon",
    }
    create = client.post("/roosts", json=payload, headers=_auth_headers(host_token))
    assert create.status_code == 200
    roost_id = create.json()["id"]

    update = client.put(
        f"/roosts/{roost_id}",
        json={"title": "Harbor Loft Updated", "place_name": "Porto"},
        headers=_auth_headers(host_token),
    )
    assert update.status_code == 200
    assert update.json()["title"] == "Harbor Loft Updated"

    delete = client.delete(
        f"/roosts/{roost_id}", headers=_auth_headers(host_token)
    )
    assert delete.status_code == 200

    mine = client.get("/roosts/mine", headers=_auth_headers(host_token))
    assert mine.status_code == 200
    assert len(mine.json()) == 0

    public = client.get("/roosts?page=1&limit=10", headers=_auth_headers(nomad_token))
    assert public.status_code == 200
    assert public.json()["total"] == 0

    update_after_delete = client.put(
        f"/roosts/{roost_id}",
        json={"title": "Should Fail"},
        headers=_auth_headers(host_token),
    )
    assert update_after_delete.status_code == 404


def test_root_update_and_delete(client):
    _, artisan_token = _register_user(client, "artisan")
    _, nomad_token = _register_user(client, "nomad")
    payload = {
        "service_category": "Craft",
        "service_description": "Weaving",
        "service_capacity": 2,
        "place_name": "Kyoto",
    }
    create = client.post("/roots", json=payload, headers=_auth_headers(artisan_token))
    assert create.status_code == 200
    root_id = create.json()["id"]

    update = client.put(
        f"/roots/{root_id}",
        json={"service_description": "Indigo weaving", "place_name": "Osaka"},
        headers=_auth_headers(artisan_token),
    )
    assert update.status_code == 200
    assert update.json()["service_description"] == "Indigo weaving"

    delete = client.delete(
        f"/roots/{root_id}", headers=_auth_headers(artisan_token)
    )
    assert delete.status_code == 200

    mine = client.get("/roots/mine", headers=_auth_headers(artisan_token))
    assert mine.status_code == 200
    assert len(mine.json()) == 0

    public = client.get("/roots?page=1&limit=10", headers=_auth_headers(nomad_token))
    assert public.status_code == 200
    assert public.json()["total"] == 0

    update_after_delete = client.put(
        f"/roots/{root_id}",
        json={"service_description": "Should Fail"},
        headers=_auth_headers(artisan_token),
    )
    assert update_after_delete.status_code == 404


def test_mine_endpoints_filter_by_owner(client):
    _, host_a = _register_user(client, "host")
    _, host_b = _register_user(client, "host")
    _, artisan_a = _register_user(client, "artisan")
    _, artisan_b = _register_user(client, "artisan")

    client.post(
        "/roosts",
        json={
            "title": "Host A Roost",
            "bedroom_type": "Private room",
            "bedroom_count": 1,
            "photos": [],
            "wifi_speed_mbps": 110,
            "place_name": "Lisbon",
        },
        headers=_auth_headers(host_a),
    )
    client.post(
        "/roosts",
        json={
            "title": "Host B Roost",
            "bedroom_type": "Shared",
            "bedroom_count": 1,
            "photos": [],
            "wifi_speed_mbps": 90,
            "place_name": "Porto",
        },
        headers=_auth_headers(host_b),
    )

    client.post(
        "/roots",
        json={
            "service_category": "Food",
            "service_description": "Dinner",
            "service_capacity": 4,
            "place_name": "Oslo",
        },
        headers=_auth_headers(artisan_a),
    )
    client.post(
        "/roots",
        json={
            "service_category": "Guiding",
            "service_description": "City walk",
            "service_capacity": 6,
            "place_name": "Bergen",
        },
        headers=_auth_headers(artisan_b),
    )

    host_a_mine = client.get("/roosts/mine", headers=_auth_headers(host_a))
    assert host_a_mine.status_code == 200
    assert len(host_a_mine.json()) == 1
    assert host_a_mine.json()[0]["title"] == "Host A Roost"

    host_b_mine = client.get("/roosts/mine", headers=_auth_headers(host_b))
    assert host_b_mine.status_code == 200
    assert len(host_b_mine.json()) == 1
    assert host_b_mine.json()[0]["title"] == "Host B Roost"

    artisan_a_mine = client.get("/roots/mine", headers=_auth_headers(artisan_a))
    assert artisan_a_mine.status_code == 200
    assert len(artisan_a_mine.json()) == 1
    assert artisan_a_mine.json()[0]["service_category"] == "Food"

    artisan_b_mine = client.get("/roots/mine", headers=_auth_headers(artisan_b))
    assert artisan_b_mine.status_code == 200
    assert len(artisan_b_mine.json()) == 1
    assert artisan_b_mine.json()[0]["service_category"] == "Guiding"
