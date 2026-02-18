# Heritage Atlas - Backend API

FastAPI backend for the Heritage Atlas platform.

## Setup

1. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your MongoDB connection string
```

4. **Run the server:**
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Seed Sample Data

To populate the database with sample products:

```bash
python seed_data.py
```

## API Endpoints

### Products
- `GET /api/products` - Get all products (with optional filters)
- `GET /api/products/{id}` - Get a single product
- `POST /api/products` - Create a new product
- `GET /api/products/by-region` - Get products grouped by region
- `GET /api/products/by-gi-tag` - Get products grouped by GI tag

### Regions & GI Tags
- `GET /api/regions` - Get all regions with statistics
- `GET /api/gi-tags` - Get all GI tags with statistics

### Statistics
- `GET /api/stats` - Get platform statistics

## MongoDB Aggregation Pipelines

The backend uses MongoDB aggregation pipelines for efficient region-based filtering and grouping. Key pipelines include:

1. **Region-based grouping** - Groups products by region with counts and GI tags
2. **GI tag grouping** - Groups products by GI tag with regional distribution
3. **Statistics aggregation** - Calculates platform-wide statistics

## Deployment

Deploy to Render using the `render.yaml` configuration file.
