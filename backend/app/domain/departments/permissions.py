from app.domain.users.models import User

ROLE_OVERSIGHT = {"admin", "diretor"}


def can_see_all_initiatives(user: User) -> bool:
    """Admins e diretores veem tudo. Membros de setores de oversight (CGRP) também."""
    if user.role in ROLE_OVERSIGHT:
        return True
    dept = getattr(user, "department", None)
    if dept is not None and dept.is_oversight:
        return True
    return False