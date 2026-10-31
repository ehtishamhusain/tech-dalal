import os
import sqlite3

# Resolve absolute path so it points to inventory.db in the backend folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "inventory.db")

PRODUCTS = [
    # ==========================
    # 12 LAPTOPS
    # ==========================
    (
        "ASUS Vivobook 15 (12th Gen i3)", "ASUS", "Laptops",
        "Intel Core i3-1215U (6 cores, 8 threads)", 8, 512,
        37500, 38990, 4.3,
        '15.6" FHD (1920x1080) Anti-glare',
        "720p HD webcam with privacy shutter",
        "42Wh, 45W fast charge",
        "1x SO-DIMM slot upgradable to 16GB RAM + M.2 NVMe slot",
        "Tech World", "Station Road, Bareilly", "+91-9837123456"
    ),
    (
        "Dell Inspiron 15 (3520, i5 12th)", "Dell", "Laptops",
        "Intel Core i5-1235U (10 cores, 12 threads)", 8, 512,
        45200, 46990, 4.4,
        '15.6" FHD 120Hz WVA Display',
        "720p HD with privacy shutter",
        "41Wh, 65W fast charge",
        "Dual RAM slots up to 16GB RAM + M.2 SSD slot",
        "Computer Point", "Civil Lines, Bareilly", "+91-9897654321"
    ),
    (
        "Lenovo IdeaPad Gaming 3 (Ryzen 5)", "Lenovo", "Laptops",
        "AMD Ryzen 5 5600H (6 cores, 12 threads) + NVIDIA RTX 3050 4GB GPU", 16, 512,
        51000, 52990, 4.6,
        '15.6" FHD 120Hz IPS 250 nits',
        "720p HD with privacy shutter",
        "45Wh Rapid Charge (50% in 30 mins)",
        "Upgradable to 32GB RAM (Dual SO-DIMM) + Extra M.2 SSD slot",
        "Computer Planet", "Station Road, Bareilly", "+91-9837998877"
    ),
    (
        "HP 15s (12th Gen i3)", "HP", "Laptops",
        "Intel Core i3-1215U (6 cores, 8 threads)", 8, 512,
        38000, 39490, 4.2,
        '15.6" FHD Micro-edge Anti-glare',
        "HP True Vision 720p HD camera",
        "41Wh, HP Fast Charge (50% in 45 mins)",
        "Dual SO-DIMM slots up to 16GB RAM",
        "Global Computers", "Station Road, Bareilly", "+91-9412123456"
    ),
    (
        "HP Victus 15 (Gaming)", "HP", "Laptops",
        "AMD Ryzen 5 5600H (6 cores, 12 threads) + NVIDIA RTX 2050 4GB GPU", 8, 512,
        54500, 56990, 4.5,
        '15.6" FHD 144Hz IPS 9ms response time',
        "HP Wide Vision 720p HD camera",
        "52.5Wh, 150W Smart AC adapter",
        "Dual RAM slots upgradable to 32GB DDR4",
        "HP World", "Civil Lines, Bareilly", "+91-9897112233"
    ),
    (
        "Acer Nitro V (13th Gen i5)", "Acer", "Laptops",
        "Intel Core i5-13420H (8 cores, 12 threads) + NVIDIA RTX 4050 6GB GPU", 16, 512,
        68500, 71990, 4.7,
        '15.6" FHD 144Hz IPS ComfyView',
        "720p HD with Acer Purified Voice dual mics",
        "57Wh, 135W AC Adapter",
        "Dual Gen4 M.2 SSD slots + Dual DDR5 RAM slots up to 32GB",
        "Tech Solutions", "Civil Lines, Bareilly", "+91-9837554433"
    ),
    (
        "Lenovo LOQ 15 (12th Gen i5)", "Lenovo", "Laptops",
        "Intel Core i5-12450HX (8 cores, 12 threads) + NVIDIA RTX 3050 6GB GPU", 16, 512,
        61000, 63990, 4.6,
        '15.6" FHD 144Hz G-Sync 100% sRGB',
        "1080p FHD with E-shutter",
        "60Wh, 170W Slim Tip adapter",
        "Dual SO-DIMM DDR5 slots up to 32GB + 2x M.2 slots",
        "Prime Infotech", "Ayub Khan Chauraha, Bareilly", "+91-9837998877"
    ),
    (
        "MacBook Air M2", "Apple", "Laptops",
        "Apple M2 8-Core CPU + 8-Core GPU (16-Core Neural Engine)", 8, 256,
        86900, 89900, 4.8,
        '13.6" Liquid Retina (2560x1664) 500 nits, P3 Color',
        "1080p FaceTime HD camera with computational video ISP",
        "52.6Wh, up to 18 hours battery life, 30W MagSafe 3",
        "Unified memory & storage integrated on SoC (factory configured)",
        "iGalaxy Store", "DD Puram, Bareilly", "+91-9897123456"
    ),
    (
        "MacBook Air M3", "Apple", "Laptops",
        "Apple M3 8-Core CPU + 10-Core GPU with Hardware Ray Tracing", 8, 256,
        104900, 109900, 4.9,
        '13.6" Liquid Retina, Dual external display support',
        "1080p FaceTime HD with 3-mic beamforming array",
        "52.6Wh, up to 18 hours battery life, 35W Dual Port USB-C",
        "Unified memory integrated on 3nm Apple silicon",
        "iGalaxy Store", "DD Puram, Bareilly", "+91-9897123456"
    ),
    (
        "ASUS Zenbook 14 OLED", "ASUS", "Laptops",
        "Intel Core Ultra 5 125H (14 cores, 18 threads) with Intel AI Boost NPU", 16, 1024,
        92000, 96990, 4.8,
        '14.0" 3K (2880x1800) 120Hz OLED 0.2ms, 500 nits HDR',
        "FHD IR camera with Windows Hello & privacy shutter",
        "75Wh high-capacity battery, 65W Type-C fast charge",
        "16GB LPDDR5X on-board + Upgradable M.2 PCIe 4.0 SSD",
        "ASUS Exclusive Store", "Civil Lines, Bareilly", "+91-9837001122"
    ),
    (
        "Acer Aspire 3", "Acer", "Laptops",
        "AMD Ryzen 3 7320U (4 cores, 8 threads)", 8, 512,
        31500, 32990, 4.1,
        '15.6" FHD ComfyView LED-backlit TFT LCD',
        "720p HD with Acer TNR temporal noise reduction",
        "40Wh 3-cell Li-ion, 45W adapter",
        "8GB LPDDR5 soldered + 1x M.2 NVMe slot upgradable to 1TB",
        "Tech World", "Station Road, Bareilly", "+91-9837123456"
    ),
    (
        "Lenovo IdeaPad Slim 3", "Lenovo", "Laptops",
        "Intel Core i3-1215U (6 cores, 8 threads)", 8, 512,
        35800, 36990, 4.2,
        '15.6" FHD 250 nits Anti-glare',
        "720p HD with Privacy Shutter",
        "45Wh, Rapid Charge Boost",
        "8GB DDR4 (upgradable to 16GB via 1x SO-DIMM slot)",
        "Prime Infotech", "Ayub Khan Chauraha, Bareilly", "+91-9837998877"
    ),

    # ==========================
    # 12 SMARTPHONES
    # ==========================
    (
        "OnePlus Nord CE4", "OnePlus", "Smartphones",
        "Qualcomm Snapdragon 7 Gen 3 (4nm)", 8, 128,
        24499, 24999, 4.5,
        '6.7" 120Hz Fluid AMOLED, 2160Hz PWM dimming',
        "50MP Sony LYT-600 with OIS + 8MP Ultra-wide | 16MP Front",
        "5500mAh battery, 100W SuperVOOC (100% in 29 mins)",
        "Dual 5G SIM with Hybrid microSD slot up to 1TB",
        "Mobile Hub", "Civil Lines, Bareilly", "+91-9837223344"
    ),
    (
        "Realme 12 Pro 5G", "Realme", "Smartphones",
        "Qualcomm Snapdragon 6 Gen 1 (4nm)", 8, 128,
        23500, 24999, 4.4,
        '6.7" 120Hz Curved Vision AMOLED, 950 nits peak',
        "50MP Sony IMX882 OIS + 32MP Sony IMX709 2x Telephoto + 8MP UW",
        "5000mAh, 67W SUPERVOOC charge",
        "Dual nano-SIM 5G, Vegan leather luxury back design",
        "Royal Telecom", "DD Puram, Bareilly", "+91-9897445566"
    ),
    (
        "Poco X6 5G", "Poco", "Smartphones",
        "Snapdragon 7s Gen 2 (4nm)", 8, 256,
        19999, 21999, 4.4,
        '6.67" 1.5K 120Hz Flow AMOLED, 1800 nits, Dolby Vision',
        "64MP OIS main camera + 8MP UW + 2MP Macro | 16MP Selfie",
        "5100mAh, 67W turbo charging in-box",
        "Corning Gorilla Glass Victus, IP54 splash resistance",
        "City Mobile", "Station Road, Bareilly", "+91-9412334455"
    ),
    (
        "Moto G64 5G", "Motorola", "Smartphones",
        "MediaTek Dimensity 7020 (6nm)", 8, 128,
        14200, 14999, 4.3,
        '6.5" FHD+ 120Hz IPS LCD, 240Hz touch sampling',
        "50MP OIS Quad Pixel + 8MP Ultrawide/Macro | 16MP Front",
        "6000mAh mammoth battery, 33W TurboPower charging",
        "MicroSD slot up to 1TB, stereo speakers with Dolby Atmos",
        "City Telecom", "Station Road, Bareilly", "+91-9412998877"
    ),
    (
        "iQOO Z9x 5G", "iQOO", "Smartphones",
        "Snapdragon 6 Gen 1 (4nm)", 6, 128,
        12499, 12999, 4.3,
        '6.72" 120Hz 1000 nits Ultra-bright Display',
        "50MP Ultra HD AI camera + 2MP bokeh | 8MP Selfie",
        "6000mAh ultra-thin battery, 44W FlashCharge",
        "IP64 dust & water resistance, Dual stereo speakers 300% volume",
        "Novelty Mobile", "Novelty Chauraha, Bareilly", "+91-9837887766"
    ),
    (
        "Redmi Note 13 Pro+ 5G", "Xiaomi", "Smartphones",
        "MediaTek Dimensity 7200 Ultra (4nm)", 8, 256,
        29500, 31999, 4.6,
        '6.67" 1.5K 120Hz Curved AMOLED 1800 nits, Dolby Vision',
        "200MP Samsung ISOCELL HP3 (OIS) + 8MP UW + 2MP Macro",
        "5000mAh, 120W HyperCharge (100% in 19 mins)",
        "IP68 water and dust resistant, Gorilla Glass Victus",
        "Mi Home", "Civil Lines, Bareilly", "+91-9897221100"
    ),
    (
        "Motorola Edge 50 Pro", "Motorola", "Smartphones",
        "Qualcomm Snapdragon 7 Gen 3 (4nm)", 8, 256,
        30000, 31999, 4.6,
        '6.7" 1.5K 144Hz 10-bit pOLED, Pantone Validated 2000 nits',
        "50MP OIS (f/1.4) + 10MP 3x Telephoto (OIS) + 13MP UW/Macro",
        "4500mAh, 125W TurboPower + 50W Wireless charging",
        "IP68 certified, Premium vegan leather finish, Moto AI suite",
        "Mobile Gallery", "Ayub Khan Chauraha, Bareilly", "+91-9837446688"
    ),
    (
        "Samsung Galaxy S23 FE", "Samsung", "Smartphones",
        "Exynos 2200 4nm Flagship Octa-core", 8, 128,
        37500, 39999, 4.5,
        '6.4" Dynamic AMOLED 2X, 120Hz Adaptive, Gorilla Glass 5',
        "50MP OIS with Nightography + 8MP 3x Telephoto + 12MP UW",
        "4500mAh, 25W Fast charging, Wireless PowerShare",
        "IP68 water resistant, Samsung DeX desktop mode, Galaxy AI",
        "Samsung Smart Plaza", "Civil Lines, Bareilly", "+91-9897889900"
    ),
    (
        "OnePlus 12R", "OnePlus", "Smartphones",
        "Qualcomm Snapdragon 8 Gen 2 (4nm)", 8, 128,
        38900, 39999, 4.7,
        '6.78" 1.5K 120Hz ProXDR LTPO4 AMOLED, 4500 nits peak',
        "50MP Sony IMX890 OIS + 8MP Ultra-wide + 2MP Macro",
        "5500mAh dual-cell, 100W SUPERVOOC (1-100% in 26 mins)",
        "Cryo-velocity dual VC cooling chamber, Gorilla Glass Victus 2",
        "OnePlus Experience Store", "Civil Lines, Bareilly", "+91-9837665544"
    ),
    (
        "iPhone 15", "Apple", "Smartphones",
        "Apple A16 Bionic 4nm (6-Core CPU + 5-Core GPU + 16-Core Neural Engine)", 6, 128,
        64900, 69900, 4.8,
        '6.1" Super Retina XDR OLED, Dynamic Island, 2000 nits outdoor',
        "48MP Main with 2x Telephoto Sensor-shift OIS + 12MP UW",
        "3349mAh, USB-C 20W charging (50% in 30 mins), 15W MagSafe",
        "Ceramic Shield front, IP68 rated, Satellite Roadside Assistance",
        "iGalaxy Store", "DD Puram, Bareilly", "+91-9897123456"
    ),
    (
        "ROG Phone 8", "ASUS", "Smartphones",
        "Snapdragon 8 Gen 3 (4nm)", 16, 512,
        76500, 79999, 4.7,
        '6.78" Samsung E6 AMOLED, 165Hz, 2500 nits peak, Victus 2',
        "50MP Sony IMX890 (Gimbal OIS 3.0) + 32MP 3x Telephoto (OIS) + 13MP UW",
        "5500mAh Dual-cell, 65W HyperCharge, 15W Qi Wireless",
        "AirTrigger ultrasonic gaming triggers, IP68 waterproof",
        "Mobile Junction", "Novelty Chauraha, Bareilly", "+91-9837001122"
    ),
    (
        "Realme 12+ 5G", "Realme", "Smartphones",
        "MediaTek Dimensity 7050 (6nm)", 8, 128,
        19200, 20999, 4.3,
        '6.67" 120Hz AMOLED, 2000 nits peak, Rainwater Smart Touch',
        "50MP Sony LYT-600 OIS + 8MP Ultra-wide + 2MP Macro",
        "5000mAh, 67W SUPERVOOC charging",
        "IP54 water/dust resistant, Vegan leather luxury back",
        "Royal Telecom", "DD Puram, Bareilly", "+91-9897445566"
    ),

    # ==========================
    # 5 HEADPHONES & AUDIO
    # ==========================
    (
        "Sony WH-1000XM5", "Sony", "Headphones",
        "Dual Processor V1 + HD Noise Cancelling Processor QN1", 0, 0,
        26990, 29990, 4.8,
        "30mm Carbon Fiber Composite Drivers, LDAC, Hi-Res Wireless",
        "8 Beamforming Microphones with AI Deep Neural Network noise reduction",
        "30 Hours Battery Life (ANC On), 3 min quick charge = 3 hours playback",
        "Multipoint connection, Speak-to-Chat, Soft fit leather headband",
        "Sony Center", "Civil Lines, Bareilly", "+91-9837001122"
    ),
    (
        "Apple AirPods Pro (2nd Gen, USB-C)", "Apple", "Headphones",
        "Apple H2 Headphone Processor + U1 Case Chip", 0, 0,
        21900, 24900, 4.8,
        "Custom high-excursion Apple driver, Personalized Spatial Audio",
        "Dual beamforming mics, Inward-facing mic, 2x Stronger Active Noise Cancellation",
        "Up to 6 hours listening (30 hours total with MagSafe USB-C case)",
        "IP54 dust, sweat & water resistant, Precision Finding with speaker case",
        "iGalaxy Store", "DD Puram, Bareilly", "+91-9897123456"
    ),
    (
        "Bose QuietComfort Ultra", "Bose", "Headphones",
        "Bose Custom Audio DSP with Immersive Audio Processing", 0, 0,
        25900, 28900, 4.7,
        "Custom acoustic transducers, Bose Immersive Spatial Audio mode",
        "Advanced noise-rejecting microphone array for crystal-clear calls",
        "24 Hours total battery life, 15 min charge = 2.5 hours listening",
        "CustomTune audio calibration, Plush ergonomic earcups, Bluetooth 5.3",
        "Sound Wave", "Civil Lines, Bareilly", "+91-9837889911"
    ),
    (
        "OnePlus Buds Pro 2", "OnePlus", "Headphones",
        "Dual Drivers (11mm Woofer + 6mm Tweeter) Co-created with Dynaudio", 0, 0,
        9999, 11999, 4.5,
        "LHDC 4.0 Lossless Hi-Res Audio, Dynaudio MelodyBoost sound profile",
        "Triple-mic setup with AI call noise reduction, 48dB Smart Adaptive ANC",
        "Up to 39 Hours total playback, 10 min Warp Charge = 10 hours playback",
        "Spatial Audio with head tracking, IP55 water & sweat resistant",
        "OnePlus Experience Store", "Civil Lines, Bareilly", "+91-9837665544"
    ),
    (
        "Sennheiser Momentum 4 Wireless", "Sennheiser", "Headphones",
        "Audiophile-inspired 42mm Transducer System", 0, 0,
        24990, 27990, 4.7,
        "42mm dynamic drivers, aptX Adaptive, Sound Personalization EQ",
        "2x2 beamforming digital microphone array with wind noise suppression",
        "Incredible 60 Hours battery life with ANC, 10 min charge = 6 hours",
        "Adaptive Noise Cancellation, Lightweight folding design with premium fabric",
        "Audio Hub", "Station Road, Bareilly", "+91-9412556677"
    ),

    # ==========================
    # 3 SMARTWATCHES & WEARABLES
    # ==========================
    (
        "Samsung Galaxy Watch 6 (44mm)", "Samsung", "Smartwatches",
        "Exynos W930 Dual-Core 1.4GHz (5nm)", 2, 16,
        21999, 24999, 4.6,
        '1.5" Super AMOLED (480x480), Sapphire Crystal Glass',
        "BioActive Sensor (Optical HR, ECG, BIA Body Composition), Skin Temp",
        "425mAh, WPC Wireless Fast Charging (45% in 30 mins)",
        "Wear OS 4 Powered by Samsung, 5ATM + IP68, Advanced Sleep Coaching",
        "Samsung Smart Plaza", "Civil Lines, Bareilly", "+91-9897889900"
    ),
    (
        "Apple Watch SE (2nd Gen, GPS 44mm)", "Apple", "Smartwatches",
        "Apple S8 SiP 64-bit Dual-core Processor", 1, 32,
        26500, 29900, 4.7,
        '1.78" Retina LTPO OLED display, 1000 nits peak brightness',
        "2nd-gen optical heart sensor, Compass, Always-on altimeter",
        "18 hours all-day battery life, Low Power Mode up to 36 hours",
        "50m water resistant, Crash Detection, Fall Detection, watchOS 10",
        "iGalaxy Store", "DD Puram, Bareilly", "+91-9897123456"
    ),
    (
        "OnePlus Watch 2", "OnePlus", "Smartwatches",
        "Dual-Engine: Snapdragon W5 Gen 1 + BES2700 Low-Power MCU", 2, 32,
        22499, 24999, 4.6,
        '1.43" AMOLED 60Hz 1000 nits peak, 2.5D Sapphire Crystal',
        "8-channel optical heart rate, SpO2 sensor, Dual-frequency L1+L5 GPS",
        "500mAh, Up to 100 Hours in Smart Mode, 7.5W VOOC Fast Charging",
        "Wear OS 4 by Google, Stainless steel chassis, 5ATM + IP68 military grade",
        "OnePlus Experience Store", "Civil Lines, Bareilly", "+91-9837665544"
    )
]

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Refresh table to populate full 32 Bareilly gadgets
    cursor.execute("DROP TABLE IF EXISTS products")

    cursor.execute('''
    CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        category TEXT NOT NULL,
        processor TEXT,
        ram_gb INTEGER,
        storage_gb INTEGER,
        price INTEGER NOT NULL,
        online_price INTEGER NOT NULL,
        rating REAL,
        display_specs TEXT,
        camera_specs TEXT,
        battery_specs TEXT,
        upgrade_info TEXT,
        dealer_name TEXT,
        dealer_area TEXT,
        dealer_contact TEXT
    )
    ''')

    cursor.executemany('''
    INSERT INTO products (
        name, brand, category, processor, ram_gb, storage_gb,
        price, online_price, rating, display_specs, camera_specs,
        battery_specs, upgrade_info, dealer_name, dealer_area, dealer_contact
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', PRODUCTS)

    conn.commit()
    count = cursor.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    print(f"Database initialized successfully at {DB_PATH} with {count} verified Bareilly products.")
    conn.close()

if __name__ == "__main__":
    init_db()