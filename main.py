from datetime import date, datetime
from typing import Optional

from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import engine, get_db, Base
from models import Food, Meal, DailyLog

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pregnancy Diet & Nutrition Planner", version="1.0.0")


@app.on_event("startup")
def startup_seed():
    from seed_data import seed
    seed()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DAILY_RECOMMENDED = {
    "iron_mg": 27.0,
    "calcium_mg": 1000.0,
    "folic_acid_mcg": 600.0,
    "protein_g": 71.0,
}


# ── Pydantic schemas ────────────────────────────────────────────

class LogCreate(BaseModel):
    food_id: int
    quantity_g: float
    meal_type: str
    date: Optional[str] = None


class FoodOut(BaseModel):
    id: int
    name: str
    category: str
    diet_type: str
    safety: str
    safety_reason: Optional[str]
    trimester_best: str
    iron_mg: float
    calcium_mg: float
    folic_acid_mcg: float
    protein_g: float

    class Config:
        from_attributes = True


class MealOut(BaseModel):
    id: int
    name: str
    meal_type: str
    diet_type: str
    trimester: str
    description: str
    ingredients: str

    class Config:
        from_attributes = True


# ── FOOD ENDPOINTS ──────────────────────────────────────────────

@app.get("/api/foods", response_model=list[FoodOut])
def get_foods(
    search: Optional[str] = None,
    diet: Optional[str] = None,
    safety: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Food)

    if search:
        query = query.filter(Food.name.ilike(f"%{search}%"))
    if diet:
        query = query.filter(Food.diet_type == diet)
    if safety:
        query = query.filter(Food.safety == safety)
    if category:
        query = query.filter(Food.category == category)

    return query.order_by(Food.name).all()


@app.get("/api/foods/{food_id}", response_model=FoodOut)
def get_food(food_id: int, db: Session = Depends(get_db)):
    food = db.query(Food).filter(Food.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    return food


# ── MEAL ENDPOINTS ──────────────────────────────────────────────

@app.get("/api/meals", response_model=list[MealOut])
def get_meals(
    trimester: Optional[str] = None,
    diet: Optional[str] = None,
    meal_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Meal)

    if trimester:
        query = query.filter(Meal.trimester.in_([trimester, "all"]))
    if diet:
        if diet == "non-veg":
            query = query.filter(Meal.diet_type.in_(["veg", "non-veg", "egg"]))
        elif diet == "egg":
            query = query.filter(Meal.diet_type.in_(["veg", "egg"]))
        elif diet == "veg":
            query = query.filter(Meal.diet_type == "veg")
        elif diet == "vegan":
            query = query.filter(Meal.diet_type.in_(["vegan", "veg"]))
    if meal_type:
        query = query.filter(Meal.meal_type == meal_type)

    return query.order_by(Meal.meal_type, Meal.name).all()


# ── DAILY LOG ENDPOINTS ────────────────────────────────────────

@app.post("/api/log")
def add_log(entry: LogCreate, db: Session = Depends(get_db)):
    food = db.query(Food).filter(Food.id == entry.food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")

    log_date = datetime.strptime(entry.date, "%Y-%m-%d").date() if entry.date else date.today()

    log = DailyLog(
        food_id=entry.food_id,
        quantity_g=entry.quantity_g,
        meal_type=entry.meal_type,
        date=log_date,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return {
        "id": log.id,
        "food_name": food.name,
        "quantity_g": log.quantity_g,
        "meal_type": log.meal_type,
        "date": str(log.date),
    }


@app.get("/api/log")
def get_log(log_date: Optional[str] = None, db: Session = Depends(get_db)):
    target_date = datetime.strptime(log_date, "%Y-%m-%d").date() if log_date else date.today()

    logs = db.query(DailyLog).filter(DailyLog.date == target_date).all()

    result = []
    for log in logs:
        food = db.query(Food).filter(Food.id == log.food_id).first()
        result.append({
            "id": log.id,
            "food_id": log.food_id,
            "food_name": food.name if food else "Unknown",
            "quantity_g": log.quantity_g,
            "meal_type": log.meal_type,
            "date": str(log.date),
            "nutrients": {
                "iron_mg": round(food.iron_mg * log.quantity_g / 100, 2) if food else 0,
                "calcium_mg": round(food.calcium_mg * log.quantity_g / 100, 2) if food else 0,
                "folic_acid_mcg": round(food.folic_acid_mcg * log.quantity_g / 100, 2) if food else 0,
                "protein_g": round(food.protein_g * log.quantity_g / 100, 2) if food else 0,
            },
        })

    return result


@app.delete("/api/log/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(DailyLog).filter(DailyLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    db.delete(log)
    db.commit()
    return {"message": "Log entry deleted"}


# ── DASHBOARD ENDPOINT ─────────────────────────────────────────

@app.get("/api/dashboard")
def get_dashboard(log_date: Optional[str] = None, db: Session = Depends(get_db)):
    target_date = datetime.strptime(log_date, "%Y-%m-%d").date() if log_date else date.today()

    logs = db.query(DailyLog).filter(DailyLog.date == target_date).all()

    totals = {"iron_mg": 0.0, "calcium_mg": 0.0, "folic_acid_mcg": 0.0, "protein_g": 0.0}

    for log in logs:
        food = db.query(Food).filter(Food.id == log.food_id).first()
        if food:
            ratio = log.quantity_g / 100
            totals["iron_mg"] += food.iron_mg * ratio
            totals["calcium_mg"] += food.calcium_mg * ratio
            totals["folic_acid_mcg"] += food.folic_acid_mcg * ratio
            totals["protein_g"] += food.protein_g * ratio

    totals = {k: round(v, 2) for k, v in totals.items()}

    percentages = {}
    for nutrient, consumed in totals.items():
        recommended = DAILY_RECOMMENDED[nutrient]
        percentages[nutrient] = min(round((consumed / recommended) * 100, 1), 100.0) if recommended else 0

    return {
        "date": str(target_date),
        "consumed": totals,
        "recommended": DAILY_RECOMMENDED,
        "percentage": percentages,
    }


# ── FOOD SUGGESTIONS BASED ON NUTRIENT GAPS ────────────────────

NUTRIENT_COLUMN_MAP = {
    "iron_mg": "iron_mg",
    "calcium_mg": "calcium_mg",
    "folic_acid_mcg": "folic_acid_mcg",
    "protein_g": "protein_g",
}

NUTRIENT_LABELS = {
    "iron_mg": "Iron",
    "calcium_mg": "Calcium",
    "folic_acid_mcg": "Folic Acid",
    "protein_g": "Protein",
}


@app.get("/api/suggestions")
def get_suggestions(
    log_date: Optional[str] = None,
    diet: Optional[str] = None,
    db: Session = Depends(get_db),
):
    target_date = datetime.strptime(log_date, "%Y-%m-%d").date() if log_date else date.today()

    logs = db.query(DailyLog).filter(DailyLog.date == target_date).all()
    totals = {"iron_mg": 0.0, "calcium_mg": 0.0, "folic_acid_mcg": 0.0, "protein_g": 0.0}

    for log in logs:
        food = db.query(Food).filter(Food.id == log.food_id).first()
        if food:
            ratio = log.quantity_g / 100
            for key in totals:
                totals[key] += getattr(food, key) * ratio

    low_nutrients = []
    for nutrient, consumed in totals.items():
        recommended = DAILY_RECOMMENDED[nutrient]
        pct = (consumed / recommended) * 100 if recommended else 100
        if pct < 60:
            low_nutrients.append({
                "nutrient": nutrient,
                "label": NUTRIENT_LABELS[nutrient],
                "consumed": round(consumed, 2),
                "recommended": recommended,
                "percentage": round(pct, 1),
            })

    low_nutrients.sort(key=lambda x: x["percentage"])

    suggestions = []
    for low in low_nutrients:
        col = NUTRIENT_COLUMN_MAP[low["nutrient"]]
        query = db.query(Food).filter(
            Food.safety != "unsafe",
            getattr(Food, col) > 2.0,
        )
        if diet:
            if diet == "non-veg":
                query = query.filter(Food.diet_type.in_(["veg", "non-veg", "egg"]))
            elif diet == "egg":
                query = query.filter(Food.diet_type.in_(["veg", "egg"]))
            elif diet == "veg":
                query = query.filter(Food.diet_type == "veg")
            elif diet == "vegan":
                query = query.filter(Food.diet_type.in_(["vegan", "veg"]))

        top_foods = query.order_by(getattr(Food, col).desc()).limit(5).all()

        suggestions.append({
            "nutrient": low["label"],
            "percentage": low["percentage"],
            "deficit": round(low["recommended"] - low["consumed"], 2),
            "unit": "mg" if "mg" in low["nutrient"] else ("mcg" if "mcg" in low["nutrient"] else "g"),
            "foods": [
                {
                    "id": f.id,
                    "name": f.name,
                    "value": getattr(f, col),
                    "diet_type": f.diet_type,
                    "safety": f.safety,
                }
                for f in top_foods
            ],
        })

    return {"date": str(target_date), "suggestions": suggestions}


# ── UTILITY ENDPOINTS ──────────────────────────────────────────

@app.get("/api/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Food.category).distinct().order_by(Food.category).all()
    return [c[0] for c in cats]


@app.get("/", response_class=HTMLResponse)
def root():
    html_path = Path(__file__).parent / "templates" / "index.html"
    return html_path.read_text(encoding="utf-8")
