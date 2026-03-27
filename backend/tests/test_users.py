def test_profile_requires_auth(client):
    resp = client.get("/profile")
    assert resp.status_code == 401


def test_profile_with_token(client, auth_token, registered_user):
    resp = client.get(
        "/profile",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert resp.status_code == 200
    assert resp.json()["email"] == registered_user["email"]
    assert resp.json()["role"] == registered_user["role"]


def test_edit_profile(client, auth_token):
    resp = client.put(
        "/profile",
        headers={"Authorization": f"Bearer {auth_token}"},
        params={"full_name": "Updated User", "role": "artisan"}
    )

    assert resp.status_code == 200

    updated = client.get(
        "/profile",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert updated.json()["role"] == "artisan"


def test_delete_own_profile(client, auth_token):
    resp = client.delete(
        "/profile",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert resp.status_code == 200


def test_list_users(client, auth_token):
    resp = client.get(
        "/users",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert "role" in resp.json()[0]


def test_edit_user(client, auth_token, registered_user):
    users = client.get(
        "/users",
        headers={"Authorization": f"Bearer {auth_token}"}
    ).json()

    user_id = users[0]["id"]

    resp = client.put(
        f"/users/{user_id}",
        headers={"Authorization": f"Bearer {auth_token}"},
        params={"full_name": "Edited Name", "role": "nomad"}
    )

    assert resp.status_code == 200

    updated_users = client.get(
        "/users",
        headers={"Authorization": f"Bearer {auth_token}"}
    ).json()
    updated_user = next(user for user in updated_users if user["id"] == user_id)
    assert updated_user["role"] == "nomad"


def test_roles_list(client):
    resp = client.get("/roles")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert resp.json()[0]["id"] in {"nomad", "host", "artisan"}


def test_delete_user(client, auth_token):
    users = client.get(
        "/users",
        headers={"Authorization": f"Bearer {auth_token}"}
    ).json()

    user_id = users[0]["id"]

    resp = client.delete(
        f"/users/{user_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert resp.status_code == 200
