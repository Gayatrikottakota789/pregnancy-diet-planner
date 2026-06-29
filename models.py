from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Food(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)  # fruit, vegetable, grain, dairy, meat, seafood, beverage, nuts
    diet_type = Column(String)  # veg, non-veg, egg, vegan
    safety = Column(String)  # safe, unsafe, moderation
    safety_reason = Column(String, nullable=True)
    trimester_best = Column(String, default="all")  # 1, 2, 3, all
    iron_mg = Column(Float, default=0.0)
    calcium_mg = Column(Float, default=0.0)
    folic_acid_mcg = Column(Float, default=0.0)
    protein_g = Column(Float, default=0.0)

    logs = relationship("DailyLog", back_populates="food")


class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    meal_type = Column(String)  # breakfast, lunch, snack, dinner
    diet_type = Column(String)  # veg, non-veg, egg, vegan
    trimester = Column(String, default="all")  # 1, 2, 3, all
    description = Column(String)
    ingredients = Column(String)


class DailyLog(Base):
    __tablename__ = "daily_log"

    id = Column(Integer, primary_key=True, index=True)
    food_id = Column(Integer, ForeignKey("foods.id"))
    quantity_g = Column(Float)
    meal_type = Column(String)  # breakfast, lunch, snack, dinner
    date = Column(Date)

    food = relationship("Food", back_populates="logs")
