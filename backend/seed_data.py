"""
Sample data seeding script for Heritage Atlas
Run this script to populate the database with sample GI-tagged products
"""
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Connection
mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/heritagecraft")
database_name = os.getenv("DATABASE_NAME", "heritagecraft")

client = MongoClient(mongodb_uri)
db = client[database_name]
products_collection = db.products

# Sample products with GI tags
sample_products = [
    {
        "name": "Kondapalli Bommalu (Toys)",
        "description": "Traditional wooden toys from Kondapalli village, handcrafted with intricate designs and vibrant colors. These toys are made from softwood and painted with natural dyes.",
        "gi_tag": "Kondapalli",
        "region": "Andhra Pradesh",
        "artisan_name": "Venkatesh Rao",
        "artisan_contact": "",
        "price": 1500.00,
        "category": "Traditional Toys",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Kondapalli_toys_at_a_house_in_Vijayawada.jpg/800px-Kondapalli_toys_at_a_house_in_Vijayawada.jpg",  # Kondapalli wooden toys
        "location": {
            "latitude": 16.5062,
            "longitude": 80.6480
        },
        "cultural_story": "Kondapalli toys have a history of over 400 years. The craft was introduced by artisans from Rajasthan who settled in Kondapalli village. These toys are traditionally made during the festival of Sankranti and are considered auspicious.",
        "barcode": "HC-KOND-001",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    },
    {
        "name": "Kalamkari Saree",
        "description": "Hand-painted cotton saree featuring traditional Kalamkari motifs. The art form uses natural dyes and involves intricate hand-painting techniques.",
        "gi_tag": "Kalamkari",
        "region": "Andhra Pradesh",
        "artisan_name": "Lakshmi Devi",
        "artisan_contact": "",
        "price": 8500.00,
        "category": "Textiles",
        "image_url": "https://www.bhavanahandlooms.com/cdn/shop/files/209080616_4065995486847362_8987217239981869358_n.jpg",  # Kalamkari hand-painted saree
        "location": {
            "latitude": 17.3850,
            "longitude": 78.4867
        },
        "cultural_story": "Kalamkari is a 3000-year-old art form that involves hand-painting or block-printing on fabric. The name comes from 'kalam' (pen) and 'kari' (work). This art form flourished under the patronage of the Golconda sultans.",
        "barcode": "HC-KAL-002",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    },
    {
        "name": "Pochampally Ikat Saree",
        "description": "Traditional Ikat weave saree from Pochampally, known for its geometric patterns and vibrant colors. Made using the tie-and-dye technique.",
        "gi_tag": "Pochampally Ikat",
        "region": "Telangana",
        "artisan_name": "Ramesh Kumar",
        "artisan_contact": "",
        "price": 12000.00,
        "category": "Textiles",
        "image_url": "https://s7ap1.scene7.com/is/image/incredibleindia/pochampally-ikat-telangana-craft-hero?qlt=80&wid=800",  # Pochampally Ikat saree
        "location": {
            "latitude": 17.3850,
            "longitude": 78.4867
        },
        "cultural_story": "Pochampally Ikat is a traditional form of weaving that originated in the Pochampally village. The technique involves resist-dyeing the yarns before weaving, creating intricate geometric patterns. This craft has been practiced for over 200 years.",
        "barcode": "HC-POCH-003",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    },
    {
        "name": "Bidriware Vase",
        "description": "Handcrafted Bidriware metal vase with intricate silver inlay work. Made using a unique technique involving zinc and copper alloy.",
        "gi_tag": "Bidriware",
        "region": "Karnataka",
        "artisan_name": "Ahmed Ali",
        "artisan_contact": "",
        "price": 3500.00,
        "category": "Metalwork",
        "image_url": "https://www.giheritage.com/uploads/product/Black-Metal-Crafts-Bidriware-Decorative-Showpiece-Flower-Vase-h.jpg",  # Bidriware metal vase with silver inlay
        "location": {
            "latitude": 17.9149,
            "longitude": 77.5041
        },
        "cultural_story": "Bidriware is a traditional metal handicraft from Bidar, Karnataka. The craft involves inlaying silver or gold on a blackened zinc and copper alloy. This art form dates back to the 14th century and was brought to India by Persian artisans.",
        "barcode": "HC-BIDR-004",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    },
    {
        "name": "Channapatna Toys Set",
        "description": "Set of traditional wooden toys from Channapatna, made from ivory wood and colored with natural dyes. Safe for children and eco-friendly.",
        "gi_tag": "Channapatna Toys",
        "region": "Karnataka",
        "artisan_name": "Muniraju",
        "artisan_contact": "",
        "price": 800.00,
        "category": "Traditional Toys",
        "image_url": "https://s7ap1.scene7.com/is/image/incredibleindia/channapatna-toys-and-dolls-Karnataka-1-craft-hero?qlt=82&ts=1726641410733",  # Channapatna wooden toys
        "location": {
            "latitude": 12.6548,
            "longitude": 77.2088
        },
        "cultural_story": "Channapatna toys are traditional wooden toys from the town of Channapatna in Karnataka. The craft was introduced by Tipu Sultan in the 18th century. These toys are made from ivory wood and colored with vegetable dyes, making them safe for children.",
        "barcode": "HC-CHAN-005",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    },
    {
        "name": "Kanjivaram Silk Saree",
        "description": "Luxurious handwoven silk saree from Kanchipuram, featuring traditional temple borders and intricate zari work. A timeless piece of South Indian heritage.",
        "gi_tag": "Kanjivaram",
        "region": "Tamil Nadu",
        "artisan_name": "Meenakshi Ammal",
        "artisan_contact": "",
        "price": 25000.00,
        "category": "Textiles",
        "image_url": "https://framemark.vam.ac.uk/collections/2018KP0398/full/735,/0/default.jpg",  # Kanjivaram silk saree with zari work
        "location": {
            "latitude": 12.8300,
            "longitude": 79.7000
        },
        "cultural_story": "Kanjivaram sarees are one of India's most luxurious silk sarees, originating from Kanchipuram, Tamil Nadu. The craft dates back over 400 years. These sarees are known for their durability, rich colors, and intricate zari (gold thread) work, often featuring temple motifs.",
        "barcode": "HC-KANJ-006",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    },
    {
        "name": "Madhubani Painting",
        "description": "Traditional Mithila art painting on handmade paper, depicting scenes from Hindu mythology and nature. Created using natural colors and fine brushwork.",
        "gi_tag": "Madhubani",
        "region": "Bihar",
        "artisan_name": "Kumari Devi",
        "artisan_contact": "",
        "price": 5000.00,
        "category": "Paintings",
        "image_url": "https://cdn.s3waas.gov.in/s35ef0b4eba35ab2d6180b0bca7e46b6f9/uploads/2018/03/2018031421-1024x768.jpg",  # Madhubani painting
        "location": {
            "latitude": 26.3537,
            "longitude": 86.0750
        },
        "cultural_story": "Madhubani or Mithila painting is a traditional art form from the Mithila region of Bihar. This art form dates back to the time of the Ramayana. Traditionally, women painted these on the walls of their homes during festivals and special occasions. The paintings feature geometric patterns and scenes from mythology.",
        "barcode": "HC-MADH-007",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    },
    {
        "name": "Pattachitra Scroll",
        "description": "Traditional cloth-based scroll painting from Odisha, depicting mythological stories. Made using natural colors and traditional techniques.",
        "gi_tag": "Pattachitra",
        "region": "Odisha",
        "artisan_name": "Rabindra Behera",
        "artisan_contact": "",
        "price": 6000.00,
        "category": "Paintings",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/2/2b/Odisha_Pattachitra_DSCN1052_02.jpg",  # Pattachitra scroll painting
        "location": {
            "latitude": 20.2961,
            "longitude": 85.8245
        },
        "cultural_story": "Pattachitra is a traditional cloth-based scroll painting from Odisha. The name comes from 'patta' (cloth) and 'chitra' (picture). This art form dates back to the 5th century BC and is closely associated with the Jagannath Temple in Puri. Artists use natural colors derived from minerals and vegetables.",
        "barcode": "HC-PATT-008",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    },
    {
        "name": "Warli Painting",
        "description": "Traditional Warli tribal art painting on canvas, depicting daily life and nature. Created using white paint on mud-colored background with simple geometric shapes.",
        "gi_tag": "Warli",
        "region": "Maharashtra",
        "artisan_name": "Rani Devi",
        "artisan_contact": "",
        "price": 3500.00,
        "category": "Paintings",
        "image_url": "https://s7ap1.scene7.com/is/image/incredibleindia/warli-paintings-maharashtra-craft-hero?qlt=80&wid=800",  # Warli tribal painting
        "location": {
            "latitude": 19.7515,
            "longitude": 75.7139
        },
        "cultural_story": "Warli painting is a tribal art form from Maharashtra, dating back to 2500-3000 BCE. These paintings are traditionally done by Warli women on the walls of their mud houses. The art uses basic geometric shapes like circles, triangles, and squares to depict human figures, animals, and daily activities.",
        "barcode": "HC-WARL-009",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    },
    {
        "name": "Phulkari Dupatta",
        "description": "Hand-embroidered Phulkari dupatta from Punjab, featuring intricate floral patterns in vibrant colors. Made using traditional embroidery techniques passed down through generations.",
        "gi_tag": "Phulkari",
        "region": "Punjab",
        "artisan_name": "Harpreet Kaur",
        "artisan_contact": "",
        "price": 4500.00,
        "category": "Textiles",
        "image_url": "https://cdn.exoticindia.com/images/products/original/textiles-2019/taa538-bluedepths.webp",  # Phulkari embroidered dupatta
        "location": {
            "latitude": 30.7333,
            "longitude": 76.7794
        },
        "cultural_story": "Phulkari, meaning 'flower work', is a traditional embroidery technique from Punjab. This craft has been practiced for centuries and was traditionally made by women for their dowries. Each Phulkari piece tells a story through its intricate patterns and vibrant colors.",
        "barcode": "HC-PHUL-010",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    },
    {
        "name": "Blue Pottery Vase",
        "description": "Traditional blue pottery vase from Rajasthan, featuring intricate Persian-inspired designs. Made using a unique technique that doesn't use clay.",
        "gi_tag": "Blue Pottery",
        "region": "Rajasthan",
        "artisan_name": "Mohammed Rafiq",
        "artisan_contact": "",
        "price": 2800.00,
        "category": "Pottery",
        "image_url": "https://s7ap1.scene7.com/is/image/incredibleindia/blue-pottery-jaipur-rajasthan-craft-hero?qlt=80&wid=800",  # Blue pottery vase from Jaipur
        "location": {
            "latitude": 26.9124,
            "longitude": 75.7873
        },
        "cultural_story": "Blue Pottery is a traditional craft from Jaipur, Rajasthan. Unlike regular pottery, it doesn't use clay but instead uses a dough-like mixture of quartz stone powder, glass, and Multani Mitti. The craft was introduced to India by Persian artisans in the 14th century.",
        "barcode": "HC-BLUE-011",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    },
    {
        "name": "Kashmiri Pashmina Shawl",
        "description": "Luxurious handwoven Pashmina shawl from Kashmir, made from the finest cashmere wool. Features intricate hand-embroidered patterns.",
        "gi_tag": "Kashmiri Pashmina",
        "region": "Jammu and Kashmir",
        "artisan_name": "Abdul Majeed",
        "artisan_contact": "",
        "price": 18000.00,
        "category": "Textiles",
        "image_url": "https://purekashmir.com/cdn/shop/files/jamawar-embroidery-artisan_600x600.jpg",  # Kashmiri Pashmina shawl
        "location": {
            "latitude": 34.0837,
            "longitude": 74.7973
        },
        "cultural_story": "Kashmiri Pashmina is one of the finest and most luxurious textiles in the world. Made from the undercoat of the Changthangi goat found in the high altitudes of Ladakh. The craft has been practiced for over 500 years and was once reserved for royalty.",
        "barcode": "HC-PASH-012",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    },
    {
        "name": "Terracotta Pot Set",
        "description": "Set of traditional terracotta pots from West Bengal, handcrafted using ancient techniques. Perfect for cooking and storage.",
        "gi_tag": "Bankura Terracotta",
        "region": "West Bengal",
        "artisan_name": "Gopal Das",
        "artisan_contact": "",
        "price": 1200.00,
        "category": "Pottery",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/8/86/Bankura_Terracotta_Horses.jpg",  # Bankura Terracotta
        "location": {
            "latitude": 23.2325,
            "longitude": 87.0715
        },
        "cultural_story": "Bankura Terracotta is a traditional craft from West Bengal, known for its distinctive red clay pottery. The craft has been practiced for centuries and is particularly famous for the Bankura Horse, a traditional terracotta sculpture.",
        "barcode": "HC-BANK-013",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    },
    {
        "name": "Rogan Art Cloth",
        "description": "Traditional Rogan art fabric from Gujarat, featuring intricate patterns painted using castor oil-based paint. A rare and dying art form.",
        "gi_tag": "Rogan Art",
        "region": "Gujarat",
        "artisan_name": "Abdul Gafur Khatri",
        "artisan_contact": "",
        "price": 5500.00,
        "category": "Textiles",
        "image_url": "https://s7ap1.scene7.com/is/image/incredibleindia/rogan-art-kutch-gujarat-craft-hero?qlt=80&wid=800",  # Rogan art fabric from Kutch
        "location": {
            "latitude": 23.0225,
            "longitude": 72.5714
        },
        "cultural_story": "Rogan art is a 300-year-old craft from Kutch, Gujarat. The art involves painting intricate designs on fabric using a castor oil-based paint. This craft is practiced by only a few families in India, making it extremely rare and valuable.",
        "barcode": "HC-ROGN-014",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    },
    {
        "name": "Dhokra Metal Sculpture",
        "description": "Traditional Dhokra metal sculpture from Chhattisgarh, featuring tribal motifs. Made using the lost-wax casting technique.",
        "gi_tag": "Dhokra",
        "region": "Chhattisgarh",
        "artisan_name": "Sukra Ram",
        "artisan_contact": "",
        "price": 4200.00,
        "category": "Metalwork",
        "image_url": "https://s7ap1.scene7.com/is/image/incredibleindia/bastar-dhokra-chhattisgarh-craft-hero?qlt=80&wid=800",  # Dhokra metal sculpture from Chhattisgarh
        "location": {
            "latitude": 21.2787,
            "longitude": 81.8661
        },
        "cultural_story": "Dhokra is a traditional metal casting technique practiced by tribal communities in Chhattisgarh. The craft uses the lost-wax casting method, which dates back over 4000 years. Each piece is unique and reflects the rich tribal culture of the region.",
        "barcode": "HC-DHOK-015",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    }
]

def seed_database():
    """Seed the database with sample products"""
    try:
        # Clear existing products before seeding
        products_collection.delete_many({})
        print("🗑️  Cleared existing products")
        
        # Insert sample products
        result = products_collection.insert_many(sample_products)
        print(f"✅ Successfully inserted {len(result.inserted_ids)} products")
        
        # Display summary
        total = products_collection.count_documents({})
        print(f"📊 Total products in database: {total}")
        
        # Show regions
        regions = products_collection.distinct("region")
        print(f"🗺️  Regions: {', '.join(regions)}")
        
        # Show GI tags
        gi_tags = products_collection.distinct("gi_tag")
        print(f"🏷️  GI Tags: {', '.join(gi_tags)}")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")

if __name__ == "__main__":
    print("🌱 Seeding Heritage Atlas database...")
    seed_database()
    print("✨ Seeding complete!")
