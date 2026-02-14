from sqlalchemy import (
    Boolean,
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


class ClassificationWriteBack(Base):
    __tablename__ = "classification_write_back"

    id = Column(Integer, primary_key=True, autoincrement=True)

    raw_sds_id = Column(String(100), nullable=False)

    write_back_on = Column(DateTime, nullable=False)

    status = Column(
        Boolean,
        nullable=False,
        doc="True = success, False = failed"
    )

    last_retried_on = Column(DateTime, nullable=False)

    retries = Column(Integer, nullable=True, default=0)

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
