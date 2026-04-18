from datetime import date, timedelta
import uuid


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _register_user(client, role: str, full_name: str | None = None):
    payload = {
        "email": f"{uuid.uuid4()}@test.com",
        "password": "123456",
        "full_name": full_name or "Test User",
        "role": role,
    }
    client.post("/register", json=payload)
    resp = client.post(
        "/login", json={"email": payload["email"], "password": payload["password"]}
    )
    return payload, resp.json()["access_token"]


def _weekday_label(target: date) -> str:
    labels = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    return labels[target.weekday()]


def _create_roost(client, token: str):
    payload = {
        "title": "Loft Stay",
        "bedroom_type": "Private room",
        "bedroom_count": 1,
        "photos": [],
        "wifi_speed_mbps": 200,
        "wifi_active": True,
        "nightly_rate": 100,
        "place_name": "Lisbon",
        "latitude": 38.7223,
        "longitude": -9.1393,
    }
    resp = client.post("/roosts", json=payload, headers=_auth_headers(token))
    assert resp.status_code == 200
    return resp.json()


def _create_root(client, token: str, available_day: str):
    payload = {
        "service_category": "Food",
        "service_description": "Morning coffee",
        "service_capacity": 1,
        "available_days": available_day,
        "service_window_start": "07:00",
        "service_window_end": "10:00",
        "base_price": 25,
        "place_name": "Lisbon",
        "latitude": 38.7224,
        "longitude": -9.1392,
    }
    resp = client.post("/roots", json=payload, headers=_auth_headers(token))
    assert resp.status_code == 200
    return resp.json()


def test_nomad_personalization_preview_and_checkout_flow(client):
    _, host_token = _register_user(client, "host", "Host User")
    _, artisan_token = _register_user(client, "artisan", "Artisan User")
    nomad_payload, nomad_token = _register_user(client, "nomad", "Nomad User")

    roost = _create_roost(client, host_token)

    start_date = date(2026, 4, 10)
    end_date = date(2026, 4, 12)
    service_day = start_date + timedelta(days=1)
    root = _create_root(client, artisan_token, _weekday_label(service_day))

    personalized = client.get(
        f"/nomad/roosts/{roost['id']}/roots?max_walk_minutes=15"
        f"&stay_start={start_date}&stay_end={end_date}",
        headers=_auth_headers(nomad_token),
    )
    assert personalized.status_code == 200
    items = personalized.json()
    assert any(item["id"] == root["id"] for item in items)

    preview_payload = {
        "roost_id": roost["id"],
        "start_date": str(start_date),
        "end_date": str(end_date),
        "items": [{"root_id": root["id"], "scheduled_date": str(service_day), "quantity": 1}],
    }
    preview = client.post(
        "/nomad/bundles/preview",
        json=preview_payload,
        headers=_auth_headers(nomad_token),
    )
    assert preview.status_code == 200
    body = preview.json()
    assert body["nights"] == 2
    assert body["total_price"] == 225
    assert len(body["timeline"]) == 1

    checkout = client.post(
        "/nomad/bundles/checkout",
        json=preview_payload,
        headers=_auth_headers(nomad_token),
    )
    assert checkout.status_code == 200
    checkout_body = checkout.json()
    assert checkout_body["tickets_created"] == 1

    tickets = client.get("/artisan/tickets", headers=_auth_headers(artisan_token))
    assert tickets.status_code == 200
    tickets_body = tickets.json()
    assert len(tickets_body) == 1
    assert nomad_payload["full_name"] in tickets_body[0]["note"]
    assert tickets_body[0]["service_name"] == "Morning coffee"
    assert tickets_body[0]["service_category"] == "Food"
    assert tickets_body[0]["roost_name"] == "Loft Stay"
    assert tickets_body[0]["scheduled_date"] == str(service_day)
    assert tickets_body[0]["service_time"] == "07:00"

    partnerships = client.get(
        f"/host/roosts/{roost['id']}/partnerships",
        headers=_auth_headers(host_token),
    )
    assert partnerships.status_code == 200
    assert len(partnerships.json()) == 1

    summaries = client.get(
        "/host/stays/summary",
        headers=_auth_headers(host_token),
    )
    assert summaries.status_code == 200
    assert len(summaries.json()) == 1
    assert summaries.json()[0]["roost_title"] == "Loft Stay"


def test_wifi_status_blocks_preview(client):
    _, host_token = _register_user(client, "host")
    _, nomad_token = _register_user(client, "nomad")

    roost = _create_roost(client, host_token)

    toggle = client.put(
        f"/host/roosts/{roost['id']}/wifi-status",
        json={"wifi_active": False},
        headers=_auth_headers(host_token),
    )
    assert toggle.status_code == 200

    preview = client.post(
        "/nomad/bundles/preview",
        json={
            "roost_id": roost["id"],
            "start_date": "2026-04-10",
            "end_date": "2026-04-11",
            "items": [],
        },
        headers=_auth_headers(nomad_token),
    )
    assert preview.status_code == 400


def test_capacity_limits_enforced(client):
    _, host_token = _register_user(client, "host")
    _, artisan_token = _register_user(client, "artisan")
    _, nomad_token = _register_user(client, "nomad")

    roost = _create_roost(client, host_token)
    service_day = date(2026, 4, 11)
    root = _create_root(client, artisan_token, _weekday_label(service_day))

    checkout_payload = {
        "roost_id": roost["id"],
        "start_date": "2026-04-10",
        "end_date": "2026-04-12",
        "items": [{"root_id": root["id"], "scheduled_date": str(service_day), "quantity": 1}],
    }
    first = client.post(
        "/nomad/bundles/checkout",
        json=checkout_payload,
        headers=_auth_headers(nomad_token),
    )
    assert first.status_code == 200

    second = client.post(
        "/nomad/bundles/checkout",
        json=checkout_payload,
        headers=_auth_headers(nomad_token),
    )
    assert second.status_code == 400


def test_service_date_outside_stay_rejected(client):
    _, host_token = _register_user(client, "host")
    _, artisan_token = _register_user(client, "artisan")
    _, nomad_token = _register_user(client, "nomad")

    roost = _create_roost(client, host_token)
    service_day = date(2026, 4, 15)
    root = _create_root(client, artisan_token, _weekday_label(service_day))

    preview = client.post(
        "/nomad/bundles/preview",
        json={
            "roost_id": roost["id"],
            "start_date": "2026-04-10",
            "end_date": "2026-04-12",
            "items": [
                {
                    "root_id": root["id"],
                    "scheduled_date": str(service_day),
                    "quantity": 1,
                }
            ],
        },
        headers=_auth_headers(nomad_token),
    )
    assert preview.status_code == 400


def test_service_unavailable_day_rejected(client):
    _, host_token = _register_user(client, "host")
    _, artisan_token = _register_user(client, "artisan")
    _, nomad_token = _register_user(client, "nomad")

    roost = _create_roost(client, host_token)
    service_day = date(2026, 4, 11)
    unavailable = "mon"
    root = _create_root(client, artisan_token, unavailable)

    preview = client.post(
        "/nomad/bundles/preview",
        json={
            "roost_id": roost["id"],
            "start_date": "2026-04-10",
            "end_date": "2026-04-12",
            "items": [
                {
                    "root_id": root["id"],
                    "scheduled_date": str(service_day),
                    "quantity": 1,
                }
            ],
        },
        headers=_auth_headers(nomad_token),
    )
    assert preview.status_code == 400


def test_walk_time_filter_excludes_far_services(client):
    _, host_token = _register_user(client, "host")
    _, artisan_token = _register_user(client, "artisan")
    _, nomad_token = _register_user(client, "nomad")

    roost = _create_roost(client, host_token)
    payload = {
        "service_category": "Guide",
        "service_description": "Far hike",
        "service_capacity": 2,
        "available_days": "fri",
        "base_price": 30,
        "place_name": "Far Town",
        "latitude": 40.4168,
        "longitude": -3.7038,
    }
    resp = client.post("/roots", json=payload, headers=_auth_headers(artisan_token))
    assert resp.status_code == 200

    personalized = client.get(
        f"/nomad/roosts/{roost['id']}/roots?max_walk_minutes=15",
        headers=_auth_headers(nomad_token),
    )
    assert personalized.status_code == 200
    assert all(item["place_name"] != "Far Town" for item in personalized.json())


def test_soft_deleted_root_hidden_from_personalized_results(client):
    _, host_token = _register_user(client, "host")
    _, artisan_token = _register_user(client, "artisan")
    _, nomad_token = _register_user(client, "nomad")

    roost = _create_roost(client, host_token)
    service_day = date(2026, 4, 11)
    root = _create_root(client, artisan_token, _weekday_label(service_day))

    delete = client.delete(
        f"/roots/{root['id']}",
        headers=_auth_headers(artisan_token),
    )
    assert delete.status_code == 200

    personalized = client.get(
        f"/nomad/roosts/{roost['id']}/roots?max_walk_minutes=15"
        f"&stay_start=2026-04-10&stay_end=2026-04-12",
        headers=_auth_headers(nomad_token),
    )
    assert personalized.status_code == 200
    items = personalized.json()
    assert all(item["id"] != root["id"] for item in items)


def test_host_cannot_access_other_host_partnerships(client):
    _, host_token = _register_user(client, "host")
    _, other_host_token = _register_user(client, "host")

    roost = _create_roost(client, host_token)
    resp = client.get(
        f"/host/roosts/{roost['id']}/partnerships",
        headers=_auth_headers(other_host_token),
    )
    assert resp.status_code == 404


def test_capacity_override_for_specific_date(client):
    _, host_token = _register_user(client, "host")
    _, artisan_token = _register_user(client, "artisan")
    _, nomad_token = _register_user(client, "nomad")

    roost = _create_roost(client, host_token)
    service_day = date(2026, 4, 11)
    root = _create_root(client, artisan_token, _weekday_label(service_day))

    limit_update = client.put(
        f"/artisan/roots/{root['id']}/capacity",
        json={"daily_limit": 2, "date": str(service_day)},
        headers=_auth_headers(artisan_token),
    )
    assert limit_update.status_code == 200

    checkout_payload = {
        "roost_id": roost["id"],
        "start_date": "2026-04-10",
        "end_date": "2026-04-12",
        "items": [{"root_id": root["id"], "scheduled_date": str(service_day), "quantity": 2}],
    }
    first = client.post(
        "/nomad/bundles/checkout",
        json=checkout_payload,
        headers=_auth_headers(nomad_token),
    )
    assert first.status_code == 200
