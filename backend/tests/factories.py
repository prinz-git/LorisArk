import uuid

def create_user():
    return {
        "email": f"{uuid.uuid4()}@test.com",
        "password": "123456",
        "full_name": "Factory User",
        "role": "nomad",
    }
