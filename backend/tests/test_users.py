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


def test_list_users_requires_superadmin(client, auth_token):
    resp = client.get(
        "/users",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert resp.status_code == 403


def test_list_users(client, superadmin_token):
    resp = client.get(
        "/users",
        headers={"Authorization": f"Bearer {superadmin_token}"}
    )

    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert "role" in resp.json()[0]


def test_edit_user(client, superadmin_token, registered_user):
    users = client.get(
        "/users",
        headers={"Authorization": f"Bearer {superadmin_token}"}
    ).json()

    user_id = next(user for user in users if user["email"] == registered_user["email"])["id"]

    resp = client.put(
        f"/users/{user_id}",
        headers={"Authorization": f"Bearer {superadmin_token}"},
        params={"full_name": "Edited Name", "role": "nomad"}
    )

    assert resp.status_code == 200

    updated_users = client.get(
        "/users",
        headers={"Authorization": f"Bearer {superadmin_token}"}
    ).json()
    updated_user = next(user for user in updated_users if user["id"] == user_id)
    assert updated_user["role"] == "nomad"


def test_roles_list(client):
    resp = client.get("/roles")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert resp.json()[0]["id"] in {"nomad", "host", "artisan"}


def test_delete_user(client, superadmin_token, registered_user):
    users = client.get(
        "/users",
        headers={"Authorization": f"Bearer {superadmin_token}"}
    ).json()

    user_id = next(user for user in users if user["email"] == registered_user["email"])["id"]

    resp = client.delete(
        f"/users/{user_id}",
        headers={"Authorization": f"Bearer {superadmin_token}"}
    )

    assert resp.status_code == 200


def test_superadmin_user_cannot_be_deleted(client, superadmin_token):
    users = client.get(
        "/users",
        headers={"Authorization": f"Bearer {superadmin_token}"}
    ).json()
    superadmin_id = next(user for user in users if user["email"] == "superadmin")["id"]

    resp = client.delete(
        f"/users/{superadmin_id}",
        headers={"Authorization": f"Bearer {superadmin_token}"}
    )

    assert resp.status_code == 403
