from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine

from app.config import settings
from app.database.base import Base
from app.domain.action_plan_step import models as action_plan_step_models
from app.domain.strategic_initiative import models as strategic_initiative_models
from app.domain.key_result import models as kr_models
from app.domain.strategic_objective import models as strategic_objective_models
from app.domain.strategic_perspective import models as strategic_perspective_models
from app.domain.delay_justification import models as delay_justification_models
from app.domain.users import models as user_models

sync_db_url = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")

config = context.config
config.set_main_option("sqlalchemy.url", sync_db_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    context.configure(url=sync_db_url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = create_engine(sync_db_url)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
