from fastapi import FastAPI, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
from typing import Optional, Dict, Any
from datetime import datetime
import os
import secrets
from dotenv import load_dotenv
import re

load_dotenv()

app = FastAPI(
    title="Heritage Atlas API",
    description="Geographical Indication-Based Artisan Commerce Platform",
    version="1.0.0"
)

# CORS Configuration
default_cors_origins = ",".join([
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
])
cors_origins = os.getenv("CORS_ORIGINS", default_cors_origins).split(",")
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
frontend_base_url = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")


def slugify(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")
    return normalized or "artisan"


def serialize_doc(doc: Optional[Dict[str, Any]]):
    if not doc:
        return doc

    serialized = dict(doc)
    if "_id" in serialized:
        serialized["_id"] = str(serialized["_id"])
    return serialized


def normalize_barcode(barcode: str) -> str:
    code = barcode.strip().upper()
    if not code.startswith("HC-"):
        code = f"HC-{code}"
    return code


def build_verification_url(barcode: Optional[str]) -> Optional[str]:
    if not barcode:
        return None
    return f"{frontend_base_url}/verify?barcode={barcode}"


def enrich_product(doc: Optional[Dict[str, Any]]):
    product = serialize_doc(doc)
    if not product:
        return product

    product["artisan_slug"] = slugify(product.get("artisan_name", ""))
    product["verification_url"] = build_verification_url(product.get("barcode"))
    product["verification_qr_value"] = product["verification_url"]
    return product


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
            barcode_value = normalize_barcode(barcode_value)
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
            } if lat_float is not None and lng_float is not None else None,
            "cultural_story": cultural_story,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
        
        result = products_collection.insert_one(product)
        product["_id"] = result.inserted_id
        
        return {
            "success": True,
            "message": "Product created successfully",
            "product": enrich_product(product)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid number format: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/products")
async def get_products(
    q: Optional[str] = None,
    region: Optional[str] = None,
    gi_tag: Optional[str] = None,
    artisan_name: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = "newest",
    sort_order: str = "desc",
    limit: int = 50,
    skip: int = 0
):
    """Get products with optional filtering, search, and sorting."""
    try:
        pipeline = []
        
        match_stage = {"is_active": True}
        if q:
            match_stage["$or"] = [
                {"name": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}},
                {"gi_tag": {"$regex": q, "$options": "i"}},
                {"region": {"$regex": q, "$options": "i"}},
                {"artisan_name": {"$regex": q, "$options": "i"}},
                {"category": {"$regex": q, "$options": "i"}},
                {"cultural_story": {"$regex": q, "$options": "i"}},
            ]
        if region:
            match_stage["region"] = {"$regex": region, "$options": "i"}
        if gi_tag:
            match_stage["gi_tag"] = {"$regex": gi_tag, "$options": "i"}
        if artisan_name:
            match_stage["artisan_name"] = {"$regex": artisan_name, "$options": "i"}
        if category:
            match_stage["category"] = {"$regex": category, "$options": "i"}
        if min_price is not None or max_price is not None:
            price_filter: Dict[str, float] = {}
            if min_price is not None:
                price_filter["$gte"] = min_price
            if max_price is not None:
                price_filter["$lte"] = max_price
            match_stage["price"] = price_filter
        
        pipeline.append({"$match": match_stage})

        sort_field_map = {
            "newest": "created_at",
            "oldest": "created_at",
            "price": "price",
            "name": "name",
            "region": "region",
        }
        sort_field = sort_field_map.get(sort_by, "created_at")
        sort_direction = 1 if sort_order == "asc" else -1
        if sort_by == "oldest":
            sort_direction = 1
        pipeline.append({"$sort": {sort_field: sort_direction, "created_at": -1}})

        pipeline.append({"$skip": skip})
        pipeline.append({"$limit": limit})
        
        products = list(products_collection.aggregate(pipeline))
        count_pipeline = [{"$match": match_stage}, {"$count": "total"}]
        count_result = list(products_collection.aggregate(count_pipeline))
        total = count_result[0]["total"] if count_result else 0
        
        return {
            "success": True,
            "products": [enrich_product(product) for product in products],
            "total": total,
            "limit": limit,
            "skip": skip,
            "applied_filters": {
                "q": q,
                "region": region,
                "gi_tag": gi_tag,
                "artisan_name": artisan_name,
                "category": category,
                "min_price": min_price,
                "max_price": max_price,
                "sort_by": sort_by,
                "sort_order": sort_order,
            },
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
            result["products"] = [enrich_product(product) for product in result.get("products", [])]
        
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
            result["products"] = [enrich_product(product) for product in result.get("products", [])]
        
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
    code = normalize_barcode(barcode)
    try:
        product = products_collection.find_one({"barcode": code, "is_active": True})
        if not product:
            product = products_collection.find_one({"barcode": barcode.strip(), "is_active": True})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found. This barcode may be invalid or the product may be inactive.")
        return {
            "success": True,
            "verified": True,
            "product": enrich_product(product)
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
            "product": enrich_product(product)
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


@app.get("/api/categories")
async def get_categories():
    """Get all unique product categories with product counts."""
    try:
        pipeline = [
            {"$match": {"is_active": True}},
            {
                "$group": {
                    "_id": {"$ifNull": ["$category", "Traditional Craft"]},
                    "count": {"$sum": 1},
                }
            },
            {
                "$project": {
                    "category": "$_id",
                    "count": 1,
                    "_id": 0,
                }
            },
            {"$sort": {"count": -1, "category": 1}},
        ]
        categories = list(products_collection.aggregate(pipeline))
        return {"success": True, "categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/artisans")
async def get_artisans(search: Optional[str] = None, limit: int = 100, skip: int = 0):
    """Get artisans aggregated from products."""
    try:
        match_stage: Dict[str, Any] = {"is_active": True}
        if search:
            match_stage["artisan_name"] = {"$regex": search, "$options": "i"}

        pipeline = [
            {"$match": match_stage},
            {
                "$group": {
                    "_id": "$artisan_name",
                    "product_count": {"$sum": 1},
                    "regions": {"$addToSet": "$region"},
                    "gi_tags": {"$addToSet": "$gi_tag"},
                    "categories": {"$addToSet": "$category"},
                    "artisan_contact": {"$first": "$artisan_contact"},
                    "hero_image": {"$first": "$image_url"},
                    "latest_story": {"$first": "$cultural_story"},
                    "latest_product_name": {"$first": "$name"},
                }
            },
            {"$sort": {"product_count": -1, "_id": 1}},
            {"$skip": skip},
            {"$limit": limit},
        ]
        artisans = list(products_collection.aggregate(pipeline))

        total_pipeline = [
            {"$match": match_stage},
            {"$group": {"_id": "$artisan_name"}},
            {"$count": "total"},
        ]
        total_result = list(products_collection.aggregate(total_pipeline))
        total = total_result[0]["total"] if total_result else 0

        formatted = []
        for artisan in artisans:
            name = artisan["_id"]
            formatted.append(
                {
                    "name": name,
                    "slug": slugify(name),
                    "product_count": artisan["product_count"],
                    "regions": artisan.get("regions", []),
                    "gi_tags": artisan.get("gi_tags", []),
                    "categories": [category for category in artisan.get("categories", []) if category],
                    "artisan_contact": artisan.get("artisan_contact"),
                    "hero_image": artisan.get("hero_image"),
                    "latest_story": artisan.get("latest_story"),
                    "latest_product_name": artisan.get("latest_product_name"),
                }
            )

        return {"success": True, "artisans": formatted, "total": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/artisans/{artisan_slug}")
async def get_artisan_detail(artisan_slug: str):
    """Get a single artisan profile and all of their active products."""
    try:
        products = list(
            products_collection.find(
                {
                    "is_active": True,
                    "$expr": {
                        "$eq": [
                            {
                                "$replaceAll": {
                                    "input": {"$toLower": "$artisan_name"},
                                    "find": " ",
                                    "replacement": "-",
                                }
                            },
                            artisan_slug,
                        ]
                    },
                }
            ).sort("created_at", -1)
        )

        if not products:
            all_products = list(products_collection.find({"is_active": True, "artisan_name": {"$exists": True}}))
            products = [product for product in all_products if slugify(product.get("artisan_name", "")) == artisan_slug]

        if not products:
            raise HTTPException(status_code=404, detail="Artisan not found")

        first_product = products[0]
        name = first_product.get("artisan_name", "")
        profile = {
            "name": name,
            "slug": slugify(name),
            "artisan_contact": first_product.get("artisan_contact"),
            "regions": sorted({product.get("region") for product in products if product.get("region")}),
            "gi_tags": sorted({product.get("gi_tag") for product in products if product.get("gi_tag")}),
            "categories": sorted({product.get("category") for product in products if product.get("category")}),
            "product_count": len(products),
            "hero_image": first_product.get("image_url"),
            "latest_story": next((product.get("cultural_story") for product in products if product.get("cultural_story")), None),
            "products": [enrich_product(product) for product in products],
        }
        return {"success": True, "artisan": profile}
    except HTTPException:
        raise
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
