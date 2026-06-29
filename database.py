import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

if os.environ.get("VERCEL"):
    DATABASE_URL = "sqlite:////tmp/pregnancy_diet.db"
else:
    DATABASE_URL = "sqlite:///./pregnancy_diet.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
