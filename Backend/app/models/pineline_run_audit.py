
from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Text,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
from app.core.database import Base


class PipelineRunAudit(Base):
    __tablename__ = "pipeline_run_audit"

    run_id = Column(String(100), primary_key=True, nullable=False)

    pipeline_name = Column(String(255), nullable=False)

    pipeline_trigger_type = Column(String(100), nullable=True)
    trigger_name = Column(String(255), nullable=True)

    source_system = Column(String(100), nullable=True)
    target_system = Column(String(100), nullable=True)

    file_name = Column(String(255), nullable=True)
    file_path = Column(Text, nullable=True)

    status = Column(
        String(50),
        nullable=False,
        doc="Succeeded, Failed, InProgress, Skipped"
    )

    error_code = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    failure_type = Column(String(100), nullable=True)

    retry_count = Column(Integer, nullable=True)

    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)

    duration_seconds = Column(Integer, nullable=True)

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    last_updated_at = Column(
        DateTime,
        nullable=True,
        onupdate=datetime.utcnow
    )
