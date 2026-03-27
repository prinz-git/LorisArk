from enum import Enum


class RoleEnum(str, Enum):
    nomad = "nomad"
    host = "host"
    artisan = "artisan"


ROLE_OPTIONS = [
    {
        "id": RoleEnum.nomad.value,
        "title": "Nomad",
        "label": "Guest",
        "copy": "Stay in village homes and earn trust through respectful travel.",
    },
    {
        "id": RoleEnum.host.value,
        "title": "Host",
        "label": "Accommodation",
        "copy": "Open your home and manage bookings with confidence.",
    },
    {
        "id": RoleEnum.artisan.value,
        "title": "Artisan",
        "label": "Service",
        "copy": "Offer local services and build a reputation across the Ark.",
    },
]


def normalize_role(role: str | None) -> str:
    if not role:
        return RoleEnum.nomad.value
    return role.lower()
