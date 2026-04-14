from fastapi import FastAPI, HTTPException, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
from typing import Optional, Dict, Any
from datetime import datetime
import os
import secrets
from dotenv import load_dotenv
import re
from seed_data import sample_products

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
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", default_cors_origins).split(",")
    if origin.strip()
]
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

client = MongoClient(
    mongodb_uri,
    serverSelectionTimeoutMS=2000,
    connectTimeoutMS=2000,
    socketTimeoutMS=2000,
)
db = client[database_name]
products_collection = db.products
frontend_base_url = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")


def slugify(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")
    return normalized or "artisan"


def build_contains_regex(value: Optional[str]) -> Optional[Dict[str, str]]:
    if not value or not value.strip():
        return None
    return {"$regex": re.escape(value.strip()), "$options": "i"}


def clean_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def resolve_query_value(value: Any) -> Any:
    return value.default if hasattr(value, "default") else value


def normalize_pagination(limit: Any, skip: Any) -> tuple[int, int]:
    limit_value = resolve_query_value(limit)
    skip_value = resolve_query_value(skip)

    if limit_value < 1 or limit_value > 200:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 200")
    if skip_value < 0:
        raise HTTPException(status_code=400, detail="skip must be greater than or equal to 0")

    return int(limit_value), int(skip_value)


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


def is_database_available() -> bool:
    try:
        client.admin.command("ping")
        return True
    except Exception:
        return False


def get_fallback_products() -> list[Dict[str, Any]]:
    fallback_products = []
    for index, product in enumerate(sample_products):
        fallback_product = dict(product)
        fallback_product["_id"] = fallback_product.get("barcode") or f"sample-{index + 1}"
        fallback_products.append(fallback_product)
    return fallback_products


def filter_fallback_products(
    products: list[Dict[str, Any]],
    q: Optional[str] = None,
    region: Optional[str] = None,
    gi_tag: Optional[str] = None,
    artisan_name: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[Dict[str, Any]]:
    q = clean_text(q)
    region = clean_text(region)
    gi_tag = clean_text(gi_tag)
    artisan_name = clean_text(artisan_name)
    category = clean_text(category)

    def matches(value: Optional[str], query: Optional[str]) -> bool:
        if not query:
            return True
        return query.lower() in (value or "").lower()

    filtered = []
    for product in products:
        if not product.get("is_active", True):
            continue

        if q:
            searchable_fields = [
                product.get("name"),
                product.get("description"),
                product.get("gi_tag"),
                product.get("region"),
                product.get("artisan_name"),
                product.get("category"),
                product.get("cultural_story"),
            ]
            if not any(matches(field, q) for field in searchable_fields):
                continue

        if not matches(product.get("region"), region):
            continue
        if not matches(product.get("gi_tag"), gi_tag):
            continue
        if not matches(product.get("artisan_name"), artisan_name):
            continue
        if not matches(product.get("category"), category):
            continue

        price = product.get("price")
        if min_price is not None and (price is None or price < min_price):
            continue
        if max_price is not None and (price is None or price > max_price):
            continue

        filtered.append(product)

    return filtered


def sort_fallback_products(
    products: list[Dict[str, Any]],
    sort_by: str,
    sort_order: str,
) -> list[Dict[str, Any]]:
    sort_field_map = {
        "newest": "created_at",
        "oldest": "created_at",
        "price": "price",
        "name": "name",
        "region": "region",
    }
    sort_field = sort_field_map.get(sort_by, "created_at")
    reverse = False if sort_by == "oldest" else sort_order != "asc"

    def sort_key(product: Dict[str, Any]):
        value = product.get(sort_field)
        if value is None:
            return ""
        return value

    return sorted(products, key=sort_key, reverse=reverse)


def build_fallback_artisans(products: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
    artisan_map: Dict[str, Dict[str, Any]] = {}
    for product in products:
        name = product.get("artisan_name")
        if not name:
            continue

        artisan = artisan_map.setdefault(
            name,
            {
                "name": name,
                "slug": slugify(name),
                "product_count": 0,
                "regions": set(),
                "gi_tags": set(),
                "categories": set(),
                "artisan_contact": product.get("artisan_contact"),
                "hero_image": product.get("image_url"),
                "latest_story": product.get("cultural_story"),
                "latest_product_name": product.get("name"),
            },
        )
        artisan["product_count"] += 1
        if product.get("region"):
            artisan["regions"].add(product["region"])
        if product.get("gi_tag"):
            artisan["gi_tags"].add(product["gi_tag"])
        if product.get("category"):
            artisan["categories"].add(product["category"])

    formatted = []
    for artisan in artisan_map.values():
        formatted.append(
            {
                **artisan,
                "regions": sorted(artisan["regions"]),
                "gi_tags": sorted(artisan["gi_tags"]),
                "categories": sorted(artisan["categories"]),
            }
        )

    return sorted(formatted, key=lambda artisan: (-artisan["product_count"], artisan["name"]))


@app.get("/")
async def root():
    return {
        "message": "Heritage Atlas API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    if is_database_available():
        return {"status": "healthy", "database": "connected"}
    return {"status": "degraded", "database": "fallback-sample-data"}


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
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0)
):
    """Get products with optional filtering, search, and sorting."""
    try:
        limit, skip = normalize_pagination(limit, skip)
        if not is_database_available():
            filtered_products = filter_fallback_products(
                get_fallback_products(),
                q=q,
                region=region,
                gi_tag=gi_tag,
                artisan_name=artisan_name,
                category=category,
                min_price=min_price,
                max_price=max_price,
            )
            sorted_products = sort_fallback_products(filtered_products, sort_by, sort_order)
            paginated_products = sorted_products[skip: skip + limit]
            return {
                "success": True,
                "products": [enrich_product(product) for product in paginated_products],
                "total": len(filtered_products),
                "limit": limit,
                "skip": skip,
                "applied_filters": {
                    "q": clean_text(q),
                    "region": clean_text(region),
                    "gi_tag": clean_text(gi_tag),
                    "artisan_name": clean_text(artisan_name),
                    "category": clean_text(category),
                    "min_price": min_price,
                    "max_price": max_price,
                    "sort_by": sort_by,
                    "sort_order": sort_order,
                },
                "data_source": "fallback",
            }

        pipeline = []

        q = clean_text(q)
        region = clean_text(region)
        gi_tag = clean_text(gi_tag)
        artisan_name = clean_text(artisan_name)
        category = clean_text(category)

        match_stage = {"is_active": True}
        q_regex = build_contains_regex(q)
        if q_regex:
            match_stage["$or"] = [
                {"name": q_regex},
                {"description": q_regex},
                {"gi_tag": q_regex},
                {"region": q_regex},
                {"artisan_name": q_regex},
                {"category": q_regex},
                {"cultural_story": q_regex},
            ]
        if region:
            region_regex = build_contains_regex(region)
            if region_regex:
                match_stage["region"] = region_regex
        if gi_tag:
            gi_tag_regex = build_contains_regex(gi_tag)
            if gi_tag_regex:
                match_stage["gi_tag"] = gi_tag_regex
        if artisan_name:
            artisan_regex = build_contains_regex(artisan_name)
            if artisan_regex:
                match_stage["artisan_name"] = artisan_regex
        if category:
            category_regex = build_contains_regex(category)
            if category_regex:
                match_stage["category"] = category_regex
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

        sort_stage = {sort_field: sort_direction}
        if sort_field != "created_at":
            sort_stage["created_at"] = -1
        pipeline.append({"$sort": sort_stage})

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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/products/by-region")
async def get_products_by_region():
    """Get products grouped by region using aggregation pipeline"""
    try:
        if not is_database_available():
            region_map: Dict[str, Dict[str, Any]] = {}
            for product in get_fallback_products():
                if not product.get("is_active", True):
                    continue
                region_name = product.get("region")
                if not region_name:
                    continue
                region_entry = region_map.setdefault(
                    region_name,
                    {
                        "region": region_name,
                        "products": [],
                        "count": 0,
                        "gi_tags": set(),
                        "latitudes": [],
                        "longitudes": [],
                    },
                )
                region_entry["products"].append(enrich_product(product))
                region_entry["count"] += 1
                if product.get("gi_tag"):
                    region_entry["gi_tags"].add(product["gi_tag"])
                location = product.get("location") or {}
                if location.get("latitude") is not None:
                    region_entry["latitudes"].append(location["latitude"])
                if location.get("longitude") is not None:
                    region_entry["longitudes"].append(location["longitude"])

            regions = []
            for region_entry in region_map.values():
                latitudes = region_entry.pop("latitudes")
                longitudes = region_entry.pop("longitudes")
                regions.append(
                    {
                        **region_entry,
                        "gi_tags": sorted(region_entry["gi_tags"]),
                        "location": {
                            "latitude": sum(latitudes) / len(latitudes) if latitudes else None,
                            "longitude": sum(longitudes) / len(longitudes) if longitudes else None,
                        },
                    }
                )

            regions.sort(key=lambda item: (-item["count"], item["region"]))
            return {"success": True, "regions": regions, "data_source": "fallback"}

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
        if not is_database_available():
            gi_tag_map: Dict[str, Dict[str, Any]] = {}
            for product in get_fallback_products():
                if not product.get("is_active", True):
                    continue
                gi_tag_name = product.get("gi_tag")
                if not gi_tag_name:
                    continue
                gi_tag_entry = gi_tag_map.setdefault(
                    gi_tag_name,
                    {"gi_tag": gi_tag_name, "products": [], "count": 0, "regions": set()},
                )
                gi_tag_entry["products"].append(enrich_product(product))
                gi_tag_entry["count"] += 1
                if product.get("region"):
                    gi_tag_entry["regions"].add(product["region"])

            gi_tags = [
                {
                    "gi_tag": gi_tag_entry["gi_tag"],
                    "products": gi_tag_entry["products"],
                    "count": gi_tag_entry["count"],
                    "regions": sorted(gi_tag_entry["regions"]),
                }
                for gi_tag_entry in gi_tag_map.values()
            ]
            gi_tags.sort(key=lambda item: (-item["count"], item["gi_tag"]))
            return {"success": True, "gi_tags": gi_tags, "data_source": "fallback"}

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
        if not is_database_available():
            product = next(
                (
                    product
                    for product in get_fallback_products()
                    if product.get("is_active", True)
                    and product.get("barcode") in {code, barcode.strip()}
                ),
                None,
            )
            if not product:
                raise HTTPException(status_code=404, detail="Product not found. This barcode may be invalid or the product may be inactive.")
            return {"success": True, "verified": True, "product": enrich_product(product), "data_source": "fallback"}

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
        if not is_database_available():
            product = next(
                (
                    product
                    for product in get_fallback_products()
                    if str(product.get("_id")) == product_id or product.get("barcode") == product_id
                ),
                None,
            )
            if not product:
                raise HTTPException(status_code=404, detail="Product not found")
            return {"success": True, "product": enrich_product(product), "data_source": "fallback"}

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
        if not is_database_available():
            region_map: Dict[str, Dict[str, Any]] = {}
            for product in get_fallback_products():
                if not product.get("is_active", True):
                    continue
                region_name = product.get("region")
                if not region_name:
                    continue
                region_entry = region_map.setdefault(
                    region_name,
                    {
                        "region": region_name,
                        "count": 0,
                        "gi_tags": set(),
                        "latitudes": [],
                        "longitudes": [],
                    },
                )
                region_entry["count"] += 1
                if product.get("gi_tag"):
                    region_entry["gi_tags"].add(product["gi_tag"])
                location = product.get("location") or {}
                if location.get("latitude") is not None:
                    region_entry["latitudes"].append(location["latitude"])
                if location.get("longitude") is not None:
                    region_entry["longitudes"].append(location["longitude"])

            regions = []
            for region_entry in region_map.values():
                latitudes = region_entry.pop("latitudes")
                longitudes = region_entry.pop("longitudes")
                regions.append(
                    {
                        **region_entry,
                        "gi_tags": sorted(region_entry["gi_tags"]),
                        "location": {
                            "latitude": sum(latitudes) / len(latitudes) if latitudes else None,
                            "longitude": sum(longitudes) / len(longitudes) if longitudes else None,
                        },
                    }
                )

            regions.sort(key=lambda region_item: (-region_item["count"], region_item["region"]))
            return {"success": True, "regions": regions, "data_source": "fallback"}

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
        if not is_database_available():
            gi_tag_map: Dict[str, Dict[str, Any]] = {}
            for product in get_fallback_products():
                if not product.get("is_active", True):
                    continue
                gi_tag_name = product.get("gi_tag")
                if not gi_tag_name:
                    continue
                gi_tag_entry = gi_tag_map.setdefault(
                    gi_tag_name,
                    {"gi_tag": gi_tag_name, "count": 0, "regions": set()},
                )
                gi_tag_entry["count"] += 1
                if product.get("region"):
                    gi_tag_entry["regions"].add(product["region"])

            gi_tags = [
                {
                    "gi_tag": gi_tag_entry["gi_tag"],
                    "count": gi_tag_entry["count"],
                    "regions": sorted(gi_tag_entry["regions"]),
                }
                for gi_tag_entry in gi_tag_map.values()
            ]
            gi_tags.sort(key=lambda item: (-item["count"], item["gi_tag"]))
            return {"success": True, "gi_tags": gi_tags, "data_source": "fallback"}

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
        if not is_database_available():
            category_map: Dict[str, int] = {}
            for product in get_fallback_products():
                if not product.get("is_active", True):
                    continue
                category_name = product.get("category") or "Traditional Craft"
                category_map[category_name] = category_map.get(category_name, 0) + 1

            categories = [
                {"category": category_name, "count": count}
                for category_name, count in category_map.items()
            ]
            categories.sort(key=lambda item: (-item["count"], item["category"]))
            return {"success": True, "categories": categories, "data_source": "fallback"}

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
async def get_artisans(
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=200),
    skip: int = Query(0, ge=0)
):
    """Get artisans aggregated from products."""
    try:
        limit, skip = normalize_pagination(limit, skip)
        if not is_database_available():
            filtered_products = filter_fallback_products(get_fallback_products(), artisan_name=search)
            artisans = build_fallback_artisans(filtered_products)
            paginated_artisans = artisans[skip: skip + limit]
            return {
                "success": True,
                "artisans": paginated_artisans,
                "total": len(artisans),
                "data_source": "fallback",
            }

        match_stage: Dict[str, Any] = {"is_active": True}
        search = clean_text(search)
        if search:
            search_regex = build_contains_regex(search)
            if search_regex:
                match_stage["artisan_name"] = search_regex

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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/artisans/{artisan_slug}")
async def get_artisan_detail(artisan_slug: str):
    """Get a single artisan profile and all of their active products."""
    try:
        if not is_database_available():
            products = [
                product
                for product in get_fallback_products()
                if product.get("is_active", True) and slugify(product.get("artisan_name", "")) == artisan_slug
            ]
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
            return {"success": True, "artisan": profile, "data_source": "fallback"}

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
        if not is_database_available():
            products = [product for product in get_fallback_products() if product.get("is_active", True)]
            regions = {product.get("region") for product in products if product.get("region")}
            gi_tags = {product.get("gi_tag") for product in products if product.get("gi_tag")}
            artisans = {product.get("artisan_name") for product in products if product.get("artisan_name")}

            region_counts: Dict[str, int] = {}
            gi_tag_counts: Dict[str, int] = {}
            for product in products:
                if product.get("region"):
                    region_counts[product["region"]] = region_counts.get(product["region"], 0) + 1
                if product.get("gi_tag"):
                    gi_tag_counts[product["gi_tag"]] = gi_tag_counts.get(product["gi_tag"], 0) + 1

            top_regions = [
                {"_id": region_name, "count": count}
                for region_name, count in sorted(region_counts.items(), key=lambda item: (-item[1], item[0]))[:10]
            ]
            top_gi_tags = [
                {"_id": gi_tag_name, "count": count}
                for gi_tag_name, count in sorted(gi_tag_counts.items(), key=lambda item: (-item[1], item[0]))[:10]
            ]

            return {
                "success": True,
                "statistics": {
                    "total_products": len(products),
                    "unique_regions": len(regions),
                    "unique_gi_tags": len(gi_tags),
                    "unique_artisans": len(artisans),
                    "top_regions": top_regions,
                    "top_gi_tags": top_gi_tags,
                },
                "data_source": "fallback",
            }

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
