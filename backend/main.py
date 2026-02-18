from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from typing import Optional, List, Dict
from datetime import datetime
import os
import secrets
from dotenv import load_dotenv
import json

load_dotenv()

app = FastAPI(
    title="Heritage Atlas API",
    description="Geographical Indication–Based Artisan Commerce Platform",
    version="1.0.0"
)

# CORS Configuration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/heritagecraft")
database_name = os.getenv("DATABASE_NAME", "heritagecraft")

client = MongoClient(mongodb_uri)
db = client[database_name]
products_collection = db.products
regions_collection = db.regions
artisans_collection = db.artisans


# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


@app.get("/")
async def root():
    return {
        "message": "Heritage Atlas API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    try:
        client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


def generate_barcode() -> str:
    """Generate a unique verification barcode (e.g. HC-A1B2C3D4)."""
    return "HC-" + secrets.token_hex(4).upper()


@app.post("/api/products")
async def create_product(
    name: str = Form(...),
    description: str = Form(...),
    gi_tag: str = Form(...),
    region: str = Form(...),
    artisan_name: str = Form(...),
    artisan_contact: Optional[str] = Form(None),
    price: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    image_url: Optional[str] = Form(None),
    latitude: Optional[str] = Form(None),
    longitude: Optional[str] = Form(None),
    cultural_story: Optional[str] = Form(None),
    barcode: Optional[str] = Form(None)
):
    """Create a new artisan product with GI metadata"""
    try:
        # Convert price, latitude, longitude to float if provided
        price_float = float(price) if price and price.strip() else None
        lat_float = float(latitude) if latitude and latitude.strip() else None
        lng_float = float(longitude) if longitude and longitude.strip() else None
        
        # Barcode: use provided or auto-generate unique code
        barcode_value = (barcode or "").strip() or None
        if barcode_value:
            existing = products_collection.find_one({"barcode": barcode_value})
            if existing:
                raise HTTPException(status_code=400, detail="A product with this barcode already exists")
        else:
            barcode_value = generate_barcode()
            while products_collection.find_one({"barcode": barcode_value}):
                barcode_value = generate_barcode()
        
        product = {
            "name": name,
            "description": description,
            "gi_tag": gi_tag,
            "region": region,
            "artisan_name": artisan_name,
            "artisan_contact": artisan_contact,
            "price": price_float,
            "category": category or "Traditional Craft",
            "image_url": image_url,
            "barcode": barcode_value,
            "location": {
                "latitude": lat_float,
                "longitude": lng_float
            } if lat_float and lng_float else None,
            "cultural_story": cultural_story,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
        
        result = products_collection.insert_one(product)
        product["_id"] = str(result.inserted_id)
        
        return {
            "success": True,
            "message": "Product created successfully",
            "product": serialize_doc(product)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid number format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/products")
async def get_products(
    region: Optional[str] = None,
    gi_tag: Optional[str] = None,
    artisan_name: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get products with optional filtering by region, GI tag, or artisan"""
    try:
        pipeline = []
        
        # Match stage for filtering
        match_stage = {"is_active": True}
        if region:
            match_stage["region"] = {"$regex": region, "$options": "i"}
        if gi_tag:
            match_stage["gi_tag"] = {"$regex": gi_tag, "$options": "i"}
        if artisan_name:
            match_stage["artisan_name"] = {"$regex": artisan_name, "$options": "i"}
        
        pipeline.append({"$match": match_stage})
        
        # Sort by creation date (newest first)
        pipeline.append({"$sort": {"created_at": -1}})
        
        # Pagination
        pipeline.append({"$skip": skip})
        pipeline.append({"$limit": limit})
        
        products = list(products_collection.aggregate(pipeline))
        
        # Get total count for pagination
        count_pipeline = [{"$match": match_stage}, {"$count": "total"}]
        count_result = list(products_collection.aggregate(count_pipeline))
        total = count_result[0]["total"] if count_result else 0
        
        for product in products:
            product = serialize_doc(product)
        
        return {
            "success": True,
            "products": products,
            "total": total,
            "limit": limit,
            "skip": skip
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/products/by-region")
async def get_products_by_region():
    """Get products grouped by region using aggregation pipeline"""
    try:
        pipeline = [
            {"$match": {"is_active": True}},
            {
                "$group": {
                    "_id": "$region",
                    "products": {
                        "$push": {
                            "_id": "$_id",
                            "name": "$name",
                            "gi_tag": "$gi_tag",
                            "image_url": "$image_url",
                            "artisan_name": "$artisan_name",
                            "price": "$price",
                            "location": "$location",
                            "description": "$description"
                        }
                    },
                    "count": {"$sum": 1},
                    "gi_tags": {"$addToSet": "$gi_tag"},
                    "avg_latitude": {"$avg": "$location.latitude"},
                    "avg_longitude": {"$avg": "$location.longitude"}
                }
            },
            {
                "$project": {
                    "region": "$_id",
                    "products": 1,
                    "count": 1,
                    "gi_tags": 1,
                    "location": {
                        "latitude": "$avg_latitude",
                        "longitude": "$avg_longitude"
                    },
                    "_id": 0
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        results = list(products_collection.aggregate(pipeline))
        
        # Serialize ObjectIds
        for result in results:
            for product in result.get("products", []):
                if "_id" in product:
                    product["_id"] = str(product["_id"])
        
        return {
            "success": True,
            "regions": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/products/by-gi-tag")
async def get_products_by_gi_tag():
    """Get products grouped by GI tag using aggregation pipeline"""
    try:
        pipeline = [
            {"$match": {"is_active": True}},
            {
                "$group": {
                    "_id": "$gi_tag",
                    "products": {
                        "$push": {
                            "_id": "$_id",
                            "name": "$name",
                            "region": "$region",
                            "image_url": "$image_url",
                            "artisan_name": "$artisan_name",
                            "price": "$price",
                            "cultural_story": "$cultural_story"
                        }
                    },
                    "count": {"$sum": 1},
                    "regions": {"$addToSet": "$region"}
                }
            },
            {
                "$project": {
                    "gi_tag": "$_id",
                    "products": 1,
                    "count": 1,
                    "regions": 1,
                    "_id": 0
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        results = list(products_collection.aggregate(pipeline))
        
        # Serialize ObjectIds
        for result in results:
            for product in result.get("products", []):
                if "_id" in product:
                    product["_id"] = str(product["_id"])
        
        return {
            "success": True,
            "gi_tags": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/products/verify")
async def verify_product_by_barcode(barcode: Optional[str] = None):
    """Verify a product by barcode or verification code. Returns product if found."""
    if not barcode or not barcode.strip():
        raise HTTPException(status_code=400, detail="Barcode or verification code is required")
    code = barcode.strip().upper()
    if not code.startswith("HC-"):
        code = "HC-" + code
    try:
        product = products_collection.find_one({"barcode": code, "is_active": True})
        if not product:
            product = products_collection.find_one({"barcode": barcode.strip(), "is_active": True})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found. This barcode may be invalid or the product may be inactive.")
        return {
            "success": True,
            "verified": True,
            "product": serialize_doc(product)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    """Get a single product by ID"""
    try:
        if not ObjectId.is_valid(product_id):
            raise HTTPException(status_code=400, detail="Invalid product ID")
        
        product = products_collection.find_one({"_id": ObjectId(product_id)})
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {
            "success": True,
            "product": serialize_doc(product)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/regions")
async def get_regions():
    """Get all unique regions with product counts"""
    try:
        pipeline = [
            {"$match": {"is_active": True}},
            {
                "$group": {
                    "_id": "$region",
                    "count": {"$sum": 1},
                    "gi_tags": {"$addToSet": "$gi_tag"},
                    "avg_latitude": {"$avg": "$location.latitude"},
                    "avg_longitude": {"$avg": "$location.longitude"}
                }
            },
            {
                "$project": {
                    "region": "$_id",
                    "count": 1,
                    "gi_tags": 1,
                    "location": {
                        "latitude": "$avg_latitude",
                        "longitude": "$avg_longitude"
                    },
                    "_id": 0
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        regions = list(products_collection.aggregate(pipeline))
        
        return {
            "success": True,
            "regions": regions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/gi-tags")
async def get_gi_tags():
    """Get all unique GI tags with product counts"""
    try:
        pipeline = [
            {"$match": {"is_active": True}},
            {
                "$group": {
                    "_id": "$gi_tag",
                    "count": {"$sum": 1},
                    "regions": {"$addToSet": "$region"}
                }
            },
            {
                "$project": {
                    "gi_tag": "$_id",
                    "count": 1,
                    "regions": 1,
                    "_id": 0
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        gi_tags = list(products_collection.aggregate(pipeline))
        
        return {
            "success": True,
            "gi_tags": gi_tags
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats")
async def get_statistics():
    """Get platform statistics"""
    try:
        pipeline = [
            {
                "$facet": {
                    "total_products": [
                        {"$match": {"is_active": True}},
                        {"$count": "count"}
                    ],
                    "by_region": [
                        {"$match": {"is_active": True}},
                        {
                            "$group": {
                                "_id": "$region",
                                "count": {"$sum": 1}
                            }
                        },
                        {"$sort": {"count": -1}},
                        {"$limit": 10}
                    ],
                    "by_gi_tag": [
                        {"$match": {"is_active": True}},
                        {
                            "$group": {
                                "_id": "$gi_tag",
                                "count": {"$sum": 1}
                            }
                        },
                        {"$sort": {"count": -1}},
                        {"$limit": 10}
                    ],
                    "unique_artisans": [
                        {"$match": {"is_active": True}},
                        {
                            "$group": {
                                "_id": "$artisan_name"
                            }
                        },
                        {"$count": "count"}
                    ]
                }
            }
        ]
        
        results = list(products_collection.aggregate(pipeline))
        
        if results:
            stats = results[0]
            return {
                "success": True,
                "statistics": {
                    "total_products": stats["total_products"][0]["count"] if stats["total_products"] else 0,
                    "unique_regions": len(stats["by_region"]),
                    "unique_gi_tags": len(stats["by_gi_tag"]),
                    "unique_artisans": stats["unique_artisans"][0]["count"] if stats["unique_artisans"] else 0,
                    "top_regions": stats["by_region"],
                    "top_gi_tags": stats["by_gi_tag"]
                }
            }
        else:
            return {
                "success": True,
                "statistics": {
                    "total_products": 0,
                    "unique_regions": 0,
                    "unique_gi_tags": 0,
                    "unique_artisans": 0,
                    "top_regions": [],
                    "top_gi_tags": []
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
