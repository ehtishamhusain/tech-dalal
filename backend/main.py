import os
import re
import sqlite3
from typing import Optional, List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Tech Dalal API - Bareilly Tech Scout")

# Enable CORS for React frontend (Vite runs on localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Absolute path ensures SQLite finds inventory.db regardless of where uvicorn was launched
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "inventory.db")

class RecommendRequest(BaseModel):
    prompt: str
    context_product_id: Optional[int] = None

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/")
def root():
    return {"status": "online", "service": "Tech Dalal Bareilly Backend"}

# 1. Spec Matrix & Inventory API: returns all products across all categories
@app.get("/api/products")
def get_products():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# 2. AI Advisor Recommendation API: handles queries for Laptops, Phones, Headphones & Smartwatches
@app.post("/api/recommend")
def recommend_products(req: RecommendRequest):
    query = req.prompt.lower().strip()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Determine requested category across all 4 categories
    is_headphone_query = any(w in query for w in [
        "headphone", "headphones", "earphone", "earphones", "earbud", "earbuds", 
        "buds", "airpod", "airpods", "anc", "noise cancell", "audio", "sound", "music", "xm5", "bose"
    ])
    is_watch_query = any(w in query for w in [
        "watch", "smartwatch", "wearable", "fitness band", "galaxy watch", "apple watch"
    ])
    is_phone_query = any(w in query for w in [
        "phone", "smartphone", "mobile", "camera phone", "5g", "amoled"
    ]) and not any(w in query for w in ["laptop", "pc", "macbook", "computer"])

    if is_headphone_query:
        target_category = "Headphones"
    elif is_watch_query:
        target_category = "Smartwatches"
    elif is_phone_query:
        target_category = "Smartphones"
    else:
        target_category = "Laptops"

    cursor.execute("SELECT * FROM products WHERE category = ?", (target_category,))
    all_cat_products = [dict(row) for row in cursor.fetchall()]
    conn.close()

    if not all_cat_products:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM products LIMIT 4")
        all_cat_products = [dict(row) for row in c.fetchall()]
        conn.close()

    # Technical ranking heuristic tailored for category-specific queries
    scored = []
    for p in all_cat_products:
        score = 0
        text_corpus = f"{p.get('name', '')} {p.get('processor', '')} {p.get('display_specs', '')} {p.get('camera_specs', '')} {p.get('battery_specs', '')} {p.get('upgrade_info', '')}".lower()

        # Category: Headphones
        if target_category == "Headphones":
            if any(w in query for w in ["anc", "noise", "cancel", "travel"]):
                if "qn1" in text_corpus or "h2" in text_corpus or "active noise cancellation" in text_corpus:
                    score += 45
            if any(w in query for w in ["sound", "audio", "bass", "music", "hi-res"]):
                if "ldac" in text_corpus or "spatial" in text_corpus or "dynaudio" in text_corpus or "aptx" in text_corpus:
                    score += 35
            if "battery" in query or "long" in query:
                if "60 hours" in text_corpus or "39 hours" in text_corpus or "30 hours" in text_corpus:
                    score += 30

        # Category: Smartwatches
        elif target_category == "Smartwatches":
            if any(w in query for w in ["health", "heart", "ecg", "fitness", "sensor", "gps"]):
                if "ecg" in text_corpus or "bioactive" in text_corpus or "gps" in text_corpus:
                    score += 45
            if "battery" in query or "battery life" in query:
                if "100 hours" in text_corpus or "36 hours" in text_corpus:
                    score += 35
            if "apple" in query and "apple" in text_corpus:
                score += 40
            if "samsung" in query and "samsung" in text_corpus:
                score += 40

        # Category: Laptops
        elif target_category == "Laptops":
            if any(w in query for w in ["cse", "engineering", "coding", "student", "programming"]):
                if "rtx" in text_corpus: score += 40
                if "16gb" in text_corpus or p.get("ram_gb", 0) >= 16: score += 30
                if "32gb" in text_corpus: score += 20
                if any(cpu in text_corpus for cpu in ["i5", "ryzen 5", "i7", "ryzen 7", "m2", "m3"]): score += 25
            elif "gaming" in query or "rtx" in query:
                if "rtx 4050" in text_corpus: score += 50
                elif "rtx 3050" in text_corpus or "rtx 2050" in text_corpus: score += 35
                if "120hz" in text_corpus or "144hz" in text_corpus: score += 20

        # Category: Smartphones
        elif target_category == "Smartphones":
            if "camera" in query or "photo" in query:
                if "ois" in text_corpus: score += 35
                if "telephoto" in text_corpus: score += 25
            if "battery" in query or "charging" in query:
                if "120w" in text_corpus or "100w" in text_corpus or "6000mah" in text_corpus: score += 30

        # Budget queries
        if any(w in query for w in ["budget", "cheap", "under"]):
            price = p.get("price", 999999)
            if price <= 25000: score += 35
            elif price <= 45000: score += 20
        else:
            score += p.get("rating", 4.0) * 10

        # Bareilly store savings
        savings = p.get("online_price", 0) - p.get("price", 0)
        if savings > 0:
            score += 15

        scored.append((score, p))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_picks = [item[1] for item in scored[:4]]

    top_name = top_picks[0]["name"] if top_picks else "verified gadget"
    top_dealer = top_picks[0].get("dealer_name", "Authorized Dealer") if top_picks else "Bareilly Store"

    # Category-specific commentary
    if target_category == "Headphones":
        commentary = (
            f"Here are the highest-rated wireless headphones & earbuds in Bareilly local stock:\n\n"
            f"• **Top Pick:** **{top_name}** leads with premium active noise cancellation (ANC) and lossless high-resolution audio.\n"
            f"• **Local Availability:** Verified and ready for in-store audition at **{top_dealer}**.\n"
            f"• **Bareilly Deal:** In stock below online MRP with manufacturer warranty."
        )
        follow_ups = [
            "Best noise cancelling under 25k",
            "Compare with AirPods Pro 2",
            "Headphones with longest battery life",
            "Check local store discount"
        ]
    elif target_category == "Smartwatches":
        commentary = (
            f"Here are the top smartwatches & fitness wearables available in Bareilly store stock:\n\n"
            f"• **Top Pick:** **{top_name}** offers the most accurate biometric sensor suite (heart rate, ECG, sleep tracking) and vibrant sapphire AMOLED display.\n"
            f"• **Local Store Deal:** Available below online MRP at **{top_dealer}** with local support."
        )
        follow_ups = [
            "Smartwatches with ECG & body composition",
            "Compare with Apple Watch SE",
            "Watches with multi-day battery",
            "Check local store discount"
        ]
    elif target_category == "Smartphones":
        commentary = (
            f"Here are the highest-rated smartphones available across Bareilly markets:\n\n"
            f"• **Top Pick:** **{top_name}** offers the best balance of chipset thermal performance, high-refresh display, and camera stability.\n"
            f"• **Local Store Deal:** Available below online MRP at verified dealers in Civil Lines and DD Puram."
        )
        follow_ups = [
            "Phones with OIS camera under 25k",
            "Check local store discount",
            "Compare with OnePlus 12R",
            "Best battery life phones in Bareilly"
        ]
    else:
        commentary = (
            f"Here are the top verified options in Bareilly stock matching your criteria:\n\n"
            f"• **Top Pick:** **{top_name}** is optimal for engineering workflows (compiling code, Docker, Android Studio, and multi-threaded tasks).\n"
            f"• **Local Availability:** In stock right now with Bareilly dealer discounts at **{top_dealer}**.\n"
            f"• **Upgrade Path:** Recommended for its high RAM capacity and dedicated graphics power."
        )
        follow_ups = [
            "Check local store discount",
            "Compare specs in Spec Matrix",
            "Show options under ₹40,000",
            "Laptops with expandable 32GB RAM"
        ]

    return {
        "ai_commentary": commentary,
        "recommendations": top_picks,
        "follow_ups": follow_ups
    }