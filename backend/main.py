from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import List

import os

app = FastAPI(title="AURELIA Luxury Fashion")

@app.middleware("http")
async def force_https_middleware(request: Request, call_next):
    # Check for X-Forwarded-Proto header (standard for Cloud Run)
    if request.headers.get("x-forwarded-proto") == "https":
        # Force the scope scheme to https so url_for generates correct URLs
        request.scope["scheme"] = "https"
    response = await call_next(request)
    return response

# Base directory for the backend folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "../frontend")

# Mount static files
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")
else:
    # Fallback for different container structures
    FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
    if not os.path.exists(FRONTEND_DIR):
        FRONTEND_DIR = "/app/frontend"
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

# Templates setup
templates = Jinja2Templates(directory=FRONTEND_DIR)

# Models for API endpoints
class ChatRequest(BaseModel):
    message: str

# Mock Database for Products
PRODUCTS = [
    {
        "id": "AUR-001",
        "name": "Obsidian Silk Evening Gown",
        "price": 2450.00,
        "image_url": "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=1887&auto=format&fit=crop"
    },
    {
        "id": "AUR-002",
        "name": "Champagne Cashmere Overcoat",
        "price": 3200.00,
        "image_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1888&auto=format&fit=crop"
    },
    {
        "id": "AUR-003",
        "name": "Tailored Obsidian Tuxedo",
        "price": 2800.00,
        "image_url": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920&auto=format&fit=crop"
    },
    {
        "id": "AUR-004",
        "name": "Gold-Trimmed Merino Sweater",
        "price": 850.00,
        "image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1887&auto=format&fit=crop"
    }
]

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "title": "Home"})

@app.get("/about", response_class=HTMLResponse)
async def about(request: Request):
    return templates.TemplateResponse("about.html", {"request": request, "title": "Brand Story"})

@app.get("/contact", response_class=HTMLResponse)
async def contact_page(request: Request):
    return templates.TemplateResponse("contact.html", {"request": request, "title": "Inquiry"})

@app.get("/checkout", response_class=HTMLResponse)
async def checkout_page(request: Request):
    return templates.TemplateResponse("checkout.html", {"request": request, "title": "Checkout"})

@app.get("/products")
async def get_products():
    return JSONResponse(content=PRODUCTS)

@app.post("/chat")
async def chat(request: ChatRequest):
    user_message = request.message.lower()
    response_text = "Welcome to AURELIA. I am your personal concierge. How may I assist you today?"
    
    if "shipping" in user_message:
        response_text = "AURELIA provides complimentary white-glove delivery worldwide on all orders."
    elif "size" in user_message or "fit" in user_message:
        response_text = "Our garments feature a modern editorial fit. Please consult the concierge for bespoke tailoring options."
    elif "material" in user_message or "fabric" in user_message:
        response_text = "We use only the finest sustainable materials: pure obsidian silk, champagne gold threading, and ethically sourced cashmere."
    elif "return" in user_message:
        response_text = "We offer a seamless 30-day return policy for all unaltered pieces."
        
    return JSONResponse(content={"response": response_text})

@app.post("/contact")
async def submit_contact(
    name: str = Form(...),
    email: str = Form(...),
    message: str = Form(...)
):
    return JSONResponse(content={"success": True, "message": f"Thank you, {name}. Your inquiry has been received. Our concierge will contact you shortly."})
