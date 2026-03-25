import uuid
from datetime import date as date_type

from sqlalchemy import Date, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class WaterLog(Base):
    __tablename__ = "water_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    total_ml: Mapped[int] = mapped_column(Integer, default=0)

    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_water_user_date"),)
