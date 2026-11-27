import pytest
from sqlalchemy import select

from app.domain.import_spreadsheet import services
from app.domain.import_spreadsheet.models import ImportMode, ImportUpload


@pytest.mark.asyncio
async def test_record_import_creates_row(db_session, admin_user):
    counts = {
        "strategic_perspectives_created": 1,
        "strategic_objectives_created": 2,
        "initiatives_created": 3,
        "key_results_created": 4,
        "steps_upserted": 10,
        "steps_deleted": 0,
        "justificativas_upserted": 5,
    }

    upload = await services.record_import(
        db_session,
        user=admin_user,
        source_file_name="PA_2026.xlsx",
        mode="append",
        counts=counts,
        duration_ms=1234,
        request_id="req-abc",
    )
    await db_session.commit()

    assert upload.id is not None
    assert upload.user_id == admin_user.id
    assert upload.user_name == admin_user.name
    assert upload.source_file_name == "PA_2026.xlsx"
    assert upload.mode == ImportMode.APPEND
    assert upload.initiatives_created == 3
    assert upload.key_results_created == 4
    assert upload.steps_upserted == 10
    assert upload.duration_ms == 1234
    assert upload.request_id == "req-abc"