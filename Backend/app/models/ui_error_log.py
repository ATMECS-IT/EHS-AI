

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

class UIErrorLog(Base):
    __tablename__ = "ui_error_log"

    id = Column(Integer, primary_key=True, autoincrement=True)

    error_code = Column(String(100), nullable=False)

    error_type = Column(
        String(50),
        nullable=False,
        doc="UI_RENDER / API_ERROR / VALIDATION / PERMISSION / PERFORMANCE"
    )

    error_message = Column(Text, nullable=False)

    component_name = Column(String(255), nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

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

    # Relationship
    user = relationship("User", back_populates="error_logs")
