def test_register_user(client, user_data):
    resp = client.post("/register", json=user_data)

    assert resp.status_code == 200
    assert "registered" in resp.json()["message"].lower()


def test_login_user(client, registered_user):
    resp = client.post("/login", json={
        "email": registered_user["email"],
        "password": registered_user["password"]
    })

    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_logout(client):
    resp = client.post("/logout")
    assert resp.status_code == 200