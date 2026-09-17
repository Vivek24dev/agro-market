const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const os = require('os');
const bcrypt = require('bcryptjs');

let pgPool = null;
let usePg = false;

// Path for embedded fallback database (uses /tmp on Vercel/serverless where /var/task is read-only)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless ? path.join(os.tmpdir(), 'agro-data') : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Initial seed data for embedded engine
const INITIAL_USERS = [
  {
    id: 1,
    name: 'Farmer Demo',
    email: 'farmer@example.com',
    password: bcrypt.hashSync('password123', 10),
    user_type: 'farmer',
    district: 'Bengaluru',
    city_or_village: 'Devanahalli Village Hub',
    lat: 13.2483,
    lng: 77.7126,
    phone: '9876543210',
    whatsapp_number: '9876543210',
    profile_image_url: null,
    is_verified: true,
    created_at: new Date('2026-09-01T08:00:00Z').toISOString(),
    updated_at: new Date('2026-09-01T08:00:00Z').toISOString()
  },
  {
    id: 2,
    name: 'Buyer Demo',
    email: 'buyer@example.com',
    password: bcrypt.hashSync('password123', 10),
    user_type: 'buyer',
    district: 'Bengaluru',
    city_or_village: 'Yeshwantpur Mandi City',
    lat: 13.0234,
    lng: 77.5456,
    phone: '9876543211',
    whatsapp_number: '9876543211',
    profile_image_url: null,
    is_verified: true,
    created_at: new Date('2026-09-02T09:00:00Z').toISOString(),
    updated_at: new Date('2026-09-02T09:00:00Z').toISOString()
  },
  {
    id: 3,
    name: 'Admin',
    email: 'vivek24307@gmail.com',
    password: bcrypt.hashSync('12345678a', 10),
    user_type: 'admin',
    district: 'Bengaluru',
    city_or_village: 'K.R. Market Central',
    lat: 12.9698,
    lng: 77.5684,
    phone: '9876543212',
    whatsapp_number: '9876543212',
    profile_image_url: null,
    is_verified: true,
    created_at: new Date('2026-08-15T10:00:00Z').toISOString(),
    updated_at: new Date('2026-08-15T10:00:00Z').toISOString()
  },
  {
    id: 4,
    name: 'Ramesh Kumar',
    email: 'ramesh@example.com',
    password: bcrypt.hashSync('password123', 10),
    user_type: 'farmer',
    district: 'Kolar',
    city_or_village: 'Malur Farm Village',
    lat: 13.0048,
    lng: 77.9405,
    phone: '9988776655',
    whatsapp_number: '9988776655',
    profile_image_url: null,
    is_verified: true,
    created_at: new Date('2026-09-03T11:00:00Z').toISOString(),
    updated_at: new Date('2026-09-03T11:00:00Z').toISOString()
  },
  {
    id: 5,
    name: 'Suresh Gowda',
    email: 'suresh@example.com',
    password: bcrypt.hashSync('password123', 10),
    user_type: 'farmer',
    district: 'Mandya',
    city_or_village: 'Maddur Jaggery Village',
    lat: 12.5844,
    lng: 77.0456,
    phone: '9988112233',
    whatsapp_number: '9988112233',
    profile_image_url: null,
    is_verified: true,
    created_at: new Date('2026-09-04T12:00:00Z').toISOString(),
    updated_at: new Date('2026-09-04T12:00:00Z').toISOString()
  }
];

const INITIAL_MANDI_PRICES = [
  { id: 1, crop_type: 'Tomato', district: 'Bengaluru', price: 25.0, min_price: 20.0, max_price: 30.0, market_name: 'Yeshwantpur APMC Market', updated_at: new Date().toISOString() },
  { id: 2, crop_type: 'Tomato', district: 'Belagavi', price: 22.0, min_price: 18.0, max_price: 28.0, market_name: 'Belagavi Central Mandi', updated_at: new Date().toISOString() },
  { id: 3, crop_type: 'Tomato', district: 'Kolar', price: 21.0, min_price: 17.0, max_price: 26.0, market_name: 'Kolar Tomato Market Yard', updated_at: new Date().toISOString() },
  { id: 4, crop_type: 'Tomato', district: 'Tumkur', price: 23.5, min_price: 19.0, max_price: 28.0, market_name: 'Tumkur APMC Sub-Yard', updated_at: new Date().toISOString() },
  { id: 5, crop_type: 'Tomato', district: 'Mysuru', price: 26.0, min_price: 21.0, max_price: 31.0, market_name: 'Bandipalya APMC Mysuru', updated_at: new Date().toISOString() },
  { id: 6, crop_type: 'Potato', district: 'Bengaluru', price: 30.0, min_price: 25.0, max_price: 35.0, market_name: 'Binny Mill Market', updated_at: new Date().toISOString() },
  { id: 7, crop_type: 'Potato', district: 'Belagavi', price: 28.0, min_price: 24.0, max_price: 33.0, market_name: 'Belagavi Agri Hub', updated_at: new Date().toISOString() },
  { id: 8, crop_type: 'Potato', district: 'Hassan', price: 27.5, min_price: 22.0, max_price: 32.0, market_name: 'Hassan Potato Trading Yard', updated_at: new Date().toISOString() },
  { id: 9, crop_type: 'Potato', district: 'Mysuru', price: 29.0, min_price: 24.0, max_price: 34.0, market_name: 'Mysuru APMC Mandi', updated_at: new Date().toISOString() },
  { id: 10, crop_type: 'Onion', district: 'Bengaluru', price: 35.0, min_price: 30.0, max_price: 42.0, market_name: 'Yeshwantpur Onion Yard', updated_at: new Date().toISOString() },
  { id: 11, crop_type: 'Onion', district: 'Ballari', price: 31.0, min_price: 26.0, max_price: 38.0, market_name: 'Ballari Onion Market', updated_at: new Date().toISOString() },
  { id: 12, crop_type: 'Onion', district: 'Raichur', price: 32.5, min_price: 27.0, max_price: 39.0, market_name: 'Raichur Central Mandi', updated_at: new Date().toISOString() },
  { id: 13, crop_type: 'Carrot', district: 'Bengaluru', price: 40.0, min_price: 32.0, max_price: 48.0, market_name: 'K.R. Market Bengaluru', updated_at: new Date().toISOString() },
  { id: 14, crop_type: 'Carrot', district: 'Chikmagalur', price: 38.0, min_price: 30.0, max_price: 45.0, market_name: 'Chikmagalur Valley Mandi', updated_at: new Date().toISOString() },
  { id: 15, crop_type: 'Cabbage', district: 'Bengaluru', price: 18.0, min_price: 14.0, max_price: 22.0, market_name: 'Yeshwantpur Market', updated_at: new Date().toISOString() },
  { id: 16, crop_type: 'Cabbage', district: 'Kolar', price: 15.0, min_price: 12.0, max_price: 20.0, market_name: 'Kolar APMC Yard', updated_at: new Date().toISOString() },
  { id: 17, crop_type: 'Cucumber', district: 'Bengaluru', price: 22.0, min_price: 16.0, max_price: 28.0, market_name: 'K.R. Market', updated_at: new Date().toISOString() },
  { id: 18, crop_type: 'Cucumber', district: 'Tumkur', price: 19.0, min_price: 15.0, max_price: 25.0, market_name: 'Tumkur Vegetable Yard', updated_at: new Date().toISOString() },
  { id: 19, crop_type: 'Brinjal', district: 'Bengaluru', price: 28.0, min_price: 22.0, max_price: 35.0, market_name: 'Yeshwantpur Market', updated_at: new Date().toISOString() },
  { id: 20, crop_type: 'Brinjal', district: 'Mandya', price: 24.0, min_price: 19.0, max_price: 30.0, market_name: 'Mandya Farmer Market', updated_at: new Date().toISOString() },
  { id: 21, crop_type: 'Rice', district: 'Raichur', price: 48.0, min_price: 42.0, max_price: 56.0, market_name: 'Raichur Sona Masoori Hub', updated_at: new Date().toISOString() },
  { id: 22, crop_type: 'Rice', district: 'Mandya', price: 45.0, min_price: 39.0, max_price: 52.0, market_name: 'Mandya Rice Market Yard', updated_at: new Date().toISOString() },
  { id: 23, crop_type: 'Wheat', district: 'Belagavi', price: 34.0, min_price: 30.0, max_price: 40.0, market_name: 'Belagavi Grain Mandi', updated_at: new Date().toISOString() },
  { id: 24, crop_type: 'Wheat', district: 'Ballari', price: 36.0, min_price: 31.0, max_price: 42.0, market_name: 'Ballari Grain Exchange', updated_at: new Date().toISOString() },
  { id: 25, crop_type: 'Chilli', district: 'Ballari', price: 120.0, min_price: 100.0, max_price: 145.0, market_name: 'Byadgi Chilli Market Hub', updated_at: new Date().toISOString() },
  { id: 26, crop_type: 'Garlic', district: 'Bengaluru', price: 160.0, min_price: 130.0, max_price: 190.0, market_name: 'Yeshwantpur Spice Yard', updated_at: new Date().toISOString() },
  { id: 27, crop_type: 'Pepper', district: 'Kodagu', price: 450.0, min_price: 400.0, max_price: 510.0, market_name: 'Madikeri Spice Mandi', updated_at: new Date().toISOString() },
  { id: 28, crop_type: 'Pepper', district: 'Chikmagalur', price: 440.0, min_price: 390.0, max_price: 500.0, market_name: 'Chikmagalur Planters Exchange', updated_at: new Date().toISOString() },
  { id: 29, crop_type: 'Sugarcane', district: 'Mandya', price: 3.2, min_price: 2.8, max_price: 3.8, market_name: 'Mandya Sugar Mill Yard', updated_at: new Date().toISOString() },
  { id: 30, crop_type: 'Coconut', district: 'Tumkur', price: 28.0, min_price: 22.0, max_price: 35.0, market_name: 'Tiptur Coconut Market Yard', updated_at: new Date().toISOString() },
  { id: 31, crop_type: 'Coconut', district: 'Hassan', price: 26.0, min_price: 20.0, max_price: 32.0, market_name: 'Arasikere Coconut Exchange', updated_at: new Date().toISOString() },
  { id: 32, crop_type: 'Banana', district: 'Mysuru', price: 30.0, min_price: 24.0, max_price: 38.0, market_name: 'Nanjangud Rasabale Mandi', updated_at: new Date().toISOString() },
  { id: 33, crop_type: 'Mango', district: 'Kolar', price: 65.0, min_price: 50.0, max_price: 85.0, market_name: 'Srinivaspur Mango Yard', updated_at: new Date().toISOString() },
  { id: 34, crop_type: 'Orange', district: 'Kodagu', price: 55.0, min_price: 45.0, max_price: 70.0, market_name: 'Coorg Orange Farmers Market', updated_at: new Date().toISOString() },
  { id: 35, crop_type: 'Milk', district: 'Bengaluru', price: 42.0, min_price: 38.0, max_price: 46.0, market_name: 'Bengaluru Dairy Cooperative', updated_at: new Date().toISOString() },
  { id: 36, crop_type: 'Eggs', district: 'Bengaluru', price: 5.5, min_price: 5.0, max_price: 6.2, market_name: 'Bengaluru Poultry Exchange', updated_at: new Date().toISOString() }
];

const INITIAL_POSTS = [
  {
    id: 1,
    user_id: 1,
    title: 'Fresh Premium Hybrid Tomatoes',
    description: 'Harvested this morning at Devanahalli. Grade A quality, uniform red ripeness, firm texture, ready for immediate dispatch.',
    category: 'produce',
    crop_type: 'Tomato',
    quantity: 500.0,
    price_per_unit: 25.0,
    grade: 'A',
    city_or_village: 'Devanahalli Village Hub',
    district: 'Bengaluru',
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    user_type: 'farmer',
    is_active: true,
    created_at: new Date('2026-09-15T09:30:00Z').toISOString(),
    updated_at: new Date('2026-09-15T09:30:00Z').toISOString()
  },
  {
    id: 2,
    user_id: 4,
    title: 'Grade A Seed Potatoes',
    description: 'Crisp and clean stored potatoes from Malur farm belt, suitable for chips or wholesale kitchen supply.',
    category: 'produce',
    crop_type: 'Potato',
    quantity: 1200.0,
    price_per_unit: 28.0,
    grade: 'A',
    city_or_village: 'Malur Farm Village',
    district: 'Kolar',
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
    user_type: 'farmer',
    is_active: true,
    created_at: new Date('2026-09-15T11:20:00Z').toISOString(),
    updated_at: new Date('2026-09-15T11:20:00Z').toISOString()
  },
  {
    id: 3,
    user_id: 5,
    title: 'Pure Organic Jaggery Blocks & Sugarcane',
    description: 'Traditional wood-boiled natural jaggery blocks from Maddur village cluster, chemical-free and golden brown.',
    category: 'produce',
    crop_type: 'Sugarcane',
    quantity: 800.0,
    price_per_unit: 45.0,
    grade: 'A',
    city_or_village: 'Maddur Jaggery Village',
    district: 'Mandya',
    image_url: 'https://images.unsplash.com/photo-1543083477-4f785aeafaa9?w=600&auto=format&fit=crop&q=80',
    user_type: 'farmer',
    is_active: true,
    created_at: new Date('2026-09-16T06:40:00Z').toISOString(),
    updated_at: new Date('2026-09-16T06:40:00Z').toISOString()
  },
  {
    id: 4,
    user_id: 1,
    title: 'Crisp Crunchy Orange Carrots',
    description: 'Sweet fresh carrots freshly pulled from Doddaballapura alluvial soil, pre-washed and graded.',
    category: 'produce',
    crop_type: 'Carrot',
    quantity: 650.0,
    price_per_unit: 38.0,
    grade: 'A',
    city_or_village: 'Doddaballapura Town',
    district: 'Bengaluru',
    image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80',
    user_type: 'farmer',
    is_active: true,
    created_at: new Date('2026-09-16T07:20:00Z').toISOString(),
    updated_at: new Date('2026-09-16T07:20:00Z').toISOString()
  },
  {
    id: 5,
    user_id: 4,
    title: 'GI-Tagged Nanjangud Rasabale Bananas',
    description: 'Authentic sweet aromatic Nanjangud Rasabale variety bunches. Naturally ripened without chemicals.',
    category: 'produce',
    crop_type: 'Banana',
    quantity: 400.0,
    price_per_unit: 32.0,
    grade: 'A',
    city_or_village: 'Nanjangud Banana Village',
    district: 'Mysuru',
    image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
    user_type: 'farmer',
    is_active: true,
    created_at: new Date('2026-09-16T08:00:00Z').toISOString(),
    updated_at: new Date('2026-09-16T08:00:00Z').toISOString()
  },
  {
    id: 6,
    user_id: 5,
    title: 'Tiptur Tender & Copra Coconuts',
    description: 'High oil-content Grade A coconuts harvested from traditional groves in Tiptur.',
    category: 'produce',
    crop_type: 'Coconut',
    quantity: 1500.0,
    price_per_unit: 26.0,
    grade: 'A',
    city_or_village: 'Tiptur Coconut Village',
    district: 'Tumkur',
    image_url: 'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?w=600&auto=format&fit=crop&q=80',
    user_type: 'farmer',
    is_active: true,
    created_at: new Date('2026-09-16T08:30:00Z').toISOString(),
    updated_at: new Date('2026-09-16T08:30:00Z').toISOString()
  },
  {
    id: 7,
    user_id: 1,
    title: 'Byadgi Stemless Red Chillies',
    description: 'Deep red color, high oleoresin content, low pungency. Perfect for spice extract and culinary masalas.',
    category: 'produce',
    crop_type: 'Chilli',
    quantity: 350.0,
    price_per_unit: 125.0,
    grade: 'A',
    city_or_village: 'Byadgi Red Chilli Village',
    district: 'Haveri',
    image_url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
    user_type: 'farmer',
    is_active: true,
    created_at: new Date('2026-09-16T09:00:00Z').toISOString(),
    updated_at: new Date('2026-09-16T09:00:00Z').toISOString()
  },
  {
    id: 8,
    user_id: 4,
    title: 'Sindhanur Sona Masoori Aged Rice',
    description: 'Single-origin Sona Masoori raw paddy milled and aged for 12 months. Fluffy, aromatic, non-sticky.',
    category: 'produce',
    crop_type: 'Rice',
    quantity: 2000.0,
    price_per_unit: 48.0,
    grade: 'A',
    city_or_village: 'Sindhanur Sona Masoori Village',
    district: 'Raichur',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    user_type: 'farmer',
    is_active: true,
    created_at: new Date('2026-09-16T09:30:00Z').toISOString(),
    updated_at: new Date('2026-09-16T09:30:00Z').toISOString()
  },
  {
    id: 9,
    user_id: 2,
    title: 'Need High Quality Tomatoes for Restaurant Chain',
    description: 'Bulk requirement for hotel kitchen supply across Bengaluru. Urgent delivery needed.',
    category: 'requirement',
    crop_type: 'Tomato',
    quantity: 1000.0,
    price_per_unit: 24.0,
    grade: 'A',
    city_or_village: 'Yeshwantpur Mandi City',
    district: 'Bengaluru',
    image_url: null,
    user_type: 'buyer',
    is_active: true,
    created_at: new Date('2026-09-16T08:15:00Z').toISOString(),
    updated_at: new Date('2026-09-16T08:15:00Z').toISOString()
  },
  {
    id: 10,
    user_id: 2,
    title: 'Urgent: Bulk Potatoes Required for Processing',
    description: 'Required for wholesale snack processing unit. Looking for Grade A or B potatoes with high solid content.',
    category: 'requirement',
    crop_type: 'Potato',
    quantity: 2500.0,
    price_per_unit: 27.0,
    grade: 'B',
    city_or_village: 'Yeshwantpur Mandi City',
    district: 'Bengaluru',
    image_url: null,
    user_type: 'buyer',
    is_active: true,
    created_at: new Date('2026-09-16T09:00:00Z').toISOString(),
    updated_at: new Date('2026-09-16T09:00:00Z').toISOString()
  }
];

const INITIAL_FPO = [
  {
    id: 1,
    creator_id: 1,
    crop_type: 'Tomato',
    required_quantity: 200.0,
    current_quantity: 125.0,
    grade: 'A',
    location: 'Devanahalli Farm Cluster, Bengaluru Rural',
    district: 'Bengaluru',
    price: 25.0,
    is_active: true,
    created_at: new Date('2026-09-14T10:00:00Z').toISOString(),
    updated_at: new Date('2026-09-14T10:00:00Z').toISOString()
  },
  {
    id: 2,
    creator_id: 4,
    crop_type: 'Potato',
    required_quantity: 300.0,
    current_quantity: 150.0,
    grade: 'A',
    location: 'Malur Aggregation Center, Kolar',
    district: 'Kolar',
    price: 27.0,
    is_active: true,
    created_at: new Date('2026-09-14T14:30:00Z').toISOString(),
    updated_at: new Date('2026-09-14T14:30:00Z').toISOString()
  }
];

const INITIAL_FPO_JOINS = [
  { id: 1, fpo_id: 1, farmer_id: 1, quantity_contributed: 75.0, created_at: new Date('2026-09-14T10:05:00Z').toISOString() },
  { id: 2, fpo_id: 1, farmer_id: 4, quantity_contributed: 50.0, created_at: new Date('2026-09-14T11:00:00Z').toISOString() },
  { id: 3, fpo_id: 2, farmer_id: 4, quantity_contributed: 150.0, created_at: new Date('2026-09-14T14:35:00Z').toISOString() }
];

const INITIAL_CARRIERS = [
  {
    id: 1,
    name: 'FastTransport Agro Cargo',
    phone: '9876543220',
    email: 'contact@fasttransport.in',
    vehicle_type: 'truck',
    vehicle_model: 'Tata 407 Heavy Truck',
    capacity_kg: 2500,
    base_rate: 350.0,
    rate_per_km: 18.0,
    base_location_lat: 12.9716,
    base_location_lng: 77.5946,
    base_district: 'Bengaluru',
    service_radius_km: 60,
    rating: 4.8,
    total_deliveries: 342,
    is_active: true,
    verified_by_admin: true,
    estimated_speed_kmh: 40
  },
  {
    id: 2,
    name: 'KisanExpress Pickups',
    phone: '9876543221',
    email: 'kisanexpress@transport.com',
    vehicle_type: 'pickup',
    vehicle_model: 'Mahindra Bolero Maxi Truck Plus',
    capacity_kg: 1200,
    base_rate: 220.0,
    rate_per_km: 14.0,
    base_location_lat: 13.1362,
    base_location_lng: 78.1291,
    base_district: 'Kolar',
    service_radius_km: 45,
    rating: 4.9,
    total_deliveries: 512,
    is_active: true,
    verified_by_admin: true,
    estimated_speed_kmh: 45
  },
  {
    id: 3,
    name: 'GreenHaul Eco-Mini Logistics',
    phone: '9876543222',
    email: 'greenhaul@cleanagro.in',
    vehicle_type: 'mini_truck',
    vehicle_model: 'Tata Ace Gold EV / Diesel',
    capacity_kg: 750,
    base_rate: 150.0,
    rate_per_km: 11.0,
    base_location_lat: 12.2958,
    base_location_lng: 76.6394,
    base_district: 'Mysuru',
    service_radius_km: 35,
    rating: 4.7,
    total_deliveries: 218,
    is_active: true,
    verified_by_admin: true,
    estimated_speed_kmh: 38
  },
  {
    id: 4,
    name: 'RaithaBandhu E-Loaders',
    phone: '9876543223',
    email: 'support@raithabandhutransport.com',
    vehicle_type: 'e_loader',
    vehicle_model: 'Piaggio Ape E-Xtra Cargo',
    capacity_kg: 500,
    base_rate: 100.0,
    rate_per_km: 8.5,
    base_location_lat: 13.3409,
    base_location_lng: 77.1010,
    base_district: 'Tumkur',
    service_radius_km: 25,
    rating: 4.6,
    total_deliveries: 184,
    is_active: true,
    verified_by_admin: true,
    estimated_speed_kmh: 32
  },
  {
    id: 5,
    name: 'Belagavi Agro Freight Carriers',
    phone: '9876543224',
    email: 'belagavifreight@logistics.com',
    vehicle_type: 'truck',
    vehicle_model: 'Ashok Leyland Ecomet 1214',
    capacity_kg: 5000,
    base_rate: 600.0,
    rate_per_km: 24.0,
    base_location_lat: 15.8497,
    base_location_lng: 74.4977,
    base_district: 'Belagavi',
    service_radius_km: 100,
    rating: 4.85,
    total_deliveries: 620,
    is_active: true,
    verified_by_admin: true,
    estimated_speed_kmh: 42
  },
  {
    id: 6,
    name: 'Mandya Rural Speedy Transport',
    phone: '9876543225',
    email: 'mandyaexpress@karnataka.in',
    vehicle_type: 'pickup',
    vehicle_model: 'Ashok Leyland DOST Strong',
    capacity_kg: 1500,
    base_rate: 250.0,
    rate_per_km: 15.0,
    base_location_lat: 12.5218,
    base_location_lng: 76.8951,
    base_district: 'Mandya',
    service_radius_km: 50,
    rating: 4.75,
    total_deliveries: 289,
    is_active: true,
    verified_by_admin: true,
    estimated_speed_kmh: 44
  }
];

const INITIAL_STORAGES = [
  // 1. Bengaluru - Devanahalli
  {
    id: 1,
    name: 'CoolStore Agri-Cold Logistics Hub',
    location_type: 'cold_storage',
    address: 'Plot 42, KIADB Hardware & Agro Park, Devanahalli',
    city: 'Devanahalli Village Hub',
    district: 'Bengaluru',
    latitude: 13.2483,
    longitude: 77.7126,
    total_capacity_kg: 30000,
    current_used_kg: 8500,
    available_kg: 21500,
    has_temperature_control: true,
    has_humidity_control: true,
    temperature_range_min: 2,
    temperature_range_max: 8,
    humidity_range_min: 85,
    humidity_range_max: 95,
    price_per_kg_per_day: 0.30,
    min_storage_days: 2,
    operating_hours_open: '07:00',
    operating_hours_close: '21:00',
    accepts_weekend: true,
    phone: '9876543230',
    email: 'devanahalli@coolstore.in',
    contact_person: 'Ramesh Hegde',
    rating: 4.85,
    is_active: true,
    is_verified: true,
    special_features: ['24/7 CCTV & Thermal Sensors', 'Ethylene Gas Scrubbing', 'Backup Power Generator', 'Loading Docks for Trucks']
  },
  // 2. Bengaluru - Hoskote
  {
    id: 2,
    name: 'Hoskote Farmer Village Cold Chambers',
    location_type: 'cold_storage',
    address: 'Survey 88, Chintamani Road, Hoskote Village Belt',
    city: 'Hoskote Farmer Village',
    district: 'Bengaluru',
    latitude: 13.0712,
    longitude: 77.7981,
    total_capacity_kg: 28000,
    current_used_kg: 9200,
    available_kg: 18800,
    has_temperature_control: true,
    has_humidity_control: true,
    temperature_range_min: 3,
    temperature_range_max: 10,
    humidity_range_min: 80,
    humidity_range_max: 92,
    price_per_kg_per_day: 0.28,
    min_storage_days: 2,
    operating_hours_open: '06:00',
    operating_hours_close: '22:00',
    accepts_weekend: true,
    phone: '9876543241',
    email: 'hoskote.cold@agrohub.in',
    contact_person: 'Muniyappa Gowda',
    rating: 4.78,
    is_active: true,
    is_verified: true,
    special_features: ['Pre-Cooling Tunnel', 'Vegetable Crates Available', 'Digital In-Out Weighing']
  },
  // 3. Bengaluru - Doddaballapura
  {
    id: 3,
    name: 'Doddaballapura Multi-Agri Covered Depot',
    location_type: 'covered',
    address: 'Opp. APMC Yard, Industrial Area Phase 2, Doddaballapura',
    city: 'Doddaballapura Town',
    district: 'Bengaluru',
    latitude: 13.2924,
    longitude: 77.5412,
    total_capacity_kg: 45000,
    current_used_kg: 17500,
    available_kg: 27500,
    has_temperature_control: false,
    has_humidity_control: false,
    temperature_range_min: 20,
    temperature_range_max: 30,
    humidity_range_min: 45,
    humidity_range_max: 70,
    price_per_kg_per_day: 0.14,
    min_storage_days: 1,
    operating_hours_open: '07:30',
    operating_hours_close: '20:00',
    accepts_weekend: true,
    phone: '9876543242',
    email: 'doddaballapur.depot@karnatakaagro.in',
    contact_person: 'Narayanaswamy',
    rating: 4.65,
    is_active: true,
    is_verified: true,
    special_features: ['Elevated Moisture Proof Floor', '24/7 Security Guard', 'Direct Tractor Bay']
  },
  // 4. Bengaluru - Nelamangala
  {
    id: 4,
    name: 'Nelamangala Highway Cold Hub & Warehousing',
    location_type: 'cold_storage',
    address: 'NH 48 Bypass, Near Toll Plaza, Nelamangala',
    city: 'Nelamangala Taluk',
    district: 'Bengaluru',
    latitude: 13.0973,
    longitude: 77.3918,
    total_capacity_kg: 55000,
    current_used_kg: 21000,
    available_kg: 34000,
    has_temperature_control: true,
    has_humidity_control: true,
    temperature_range_min: 0,
    temperature_range_max: 6,
    humidity_range_min: 85,
    humidity_range_max: 95,
    price_per_kg_per_day: 0.32,
    min_storage_days: 3,
    operating_hours_open: '00:00',
    operating_hours_close: '23:59',
    accepts_weekend: true,
    phone: '9876543243',
    email: 'nelamangala.hub@coldlogistics.in',
    contact_person: 'Kiran Kumar',
    rating: 4.9,
    is_active: true,
    is_verified: true,
    special_features: ['24/7 Round the Clock Access', 'Reefer Truck Plug Points', 'Multi-Chamber Zoning']
  },
  // 5. Bengaluru - Yeshwantpur
  {
    id: 5,
    name: 'Yeshwantpur APMC Perishable Cold Vault',
    location_type: 'cold_storage',
    address: 'Gate 3, Yeshwantpur APMC Market Yard, Bengaluru',
    city: 'Yeshwantpur Mandi City',
    district: 'Bengaluru',
    latitude: 13.0234,
    longitude: 77.5456,
    total_capacity_kg: 40000,
    current_used_kg: 24000,
    available_kg: 16000,
    has_temperature_control: true,
    has_humidity_control: true,
    temperature_range_min: 2,
    temperature_range_max: 7,
    humidity_range_min: 88,
    humidity_range_max: 96,
    price_per_kg_per_day: 0.35,
    min_storage_days: 1,
    operating_hours_open: '04:00',
    operating_hours_close: '22:00',
    accepts_weekend: true,
    phone: '9876543244',
    email: 'yeshwantpur.vault@mandi.gov.in',
    contact_person: 'Shivanna',
    rating: 4.82,
    is_active: true,
    is_verified: true,
    special_features: ['Direct Market Access', 'Auction Hall Connectivity', 'Instant Electronic Invoicing']
  },
  // 6. Kolar - APMC
  {
    id: 6,
    name: 'Kolar District APMC Cold Warehouse',
    location_type: 'cold_storage',
    address: 'APMC Market Yard Gate 2, Bangarpet Road, Kolar',
    city: 'Kolar APMC City',
    district: 'Kolar',
    latitude: 13.1362,
    longitude: 78.1291,
    total_capacity_kg: 35000,
    current_used_kg: 14000,
    available_kg: 21000,
    has_temperature_control: true,
    has_humidity_control: true,
    temperature_range_min: 4,
    temperature_range_max: 8,
    humidity_range_min: 80,
    humidity_range_max: 90,
    price_per_kg_per_day: 0.25,
    min_storage_days: 3,
    operating_hours_open: '06:00',
    operating_hours_close: '20:00',
    accepts_weekend: true,
    phone: '9876543231',
    email: 'kolar.apmc.storage@gov.in',
    contact_person: 'Srinivasa Murthy',
    rating: 4.9,
    is_active: true,
    is_verified: true,
    special_features: ['Govt Subsidized Rate for Farmers', 'Pre-cooling Chambers', 'Forklift Assistance']
  },
  // 7. Kolar - Malur
  {
    id: 7,
    name: 'Malur Agri Grain & Produce Warehouse',
    location_type: 'warehouse',
    address: 'Plot 18, KIADB Agro Industrial Area, Malur',
    city: 'Malur Farm Village',
    district: 'Kolar',
    latitude: 13.0048,
    longitude: 77.9405,
    total_capacity_kg: 50000,
    current_used_kg: 22000,
    available_kg: 28000,
    has_temperature_control: false,
    has_humidity_control: true,
    temperature_range_min: 18,
    temperature_range_max: 26,
    humidity_range_min: 50,
    humidity_range_max: 65,
    price_per_kg_per_day: 0.18,
    min_storage_days: 5,
    operating_hours_open: '08:00',
    operating_hours_close: '19:00',
    accepts_weekend: false,
    phone: '9876543232',
    email: 'malur.warehouse@agrostorage.com',
    contact_person: 'Venkatesh Rao',
    rating: 4.6,
    is_active: true,
    is_verified: true,
    special_features: ['Fumigated Dry Storage', 'Rodent Proofing', 'Electronic Weighbridge']
  },
  // 8. Kolar - Srinivaspur
  {
    id: 8,
    name: 'Srinivaspur Mango & Fruit Cold Vault',
    location_type: 'cold_storage',
    address: 'State Highway 82, Near Horticulture Farm, Srinivaspur',
    city: 'Srinivaspur Mango Cluster',
    district: 'Kolar',
    latitude: 13.3364,
    longitude: 78.2144,
    total_capacity_kg: 42000,
    current_used_kg: 12500,
    available_kg: 29500,
    has_temperature_control: true,
    has_humidity_control: true,
    temperature_range_min: 5,
    temperature_range_max: 12,
    humidity_range_min: 85,
    humidity_range_max: 95,
    price_per_kg_per_day: 0.27,
    min_storage_days: 2,
    operating_hours_open: '06:00',
    operating_hours_close: '21:00',
    accepts_weekend: true,
    phone: '9876543245',
    email: 'srinivaspur.mango@agrivault.in',
    contact_person: 'Venkat Reddy',
    rating: 4.88,
    is_active: true,
    is_verified: true,
    special_features: ['Mango Hot Water Treatment', 'Controlled Ripening Chambers', 'Govt e-NWR Receipt']
  },
  // 9. Kolar - Mulbagal
  {
    id: 9,
    name: 'Mulbagal Solar-Powered Tomato Cold Store',
    location_type: 'cold_storage',
    address: 'Bylahalli Road, Near Rural Cooperative, Mulbagal',
    city: 'Mulbagal Tomato Village',
    district: 'Kolar',
    latitude: 13.1633,
    longitude: 78.3975,
    total_capacity_kg: 20000,
    current_used_kg: 6800,
    available_kg: 13200,
    has_temperature_control: true,
    has_humidity_control: true,
    temperature_range_min: 8,
    temperature_range_max: 13,
    humidity_range_min: 80,
    humidity_range_max: 90,
    price_per_kg_per_day: 0.22,
    min_storage_days: 2,
    operating_hours_open: '07:00',
    operating_hours_close: '20:00',
    accepts_weekend: true,
    phone: '9876543246',
    email: 'mulbagal.solar@greenagri.org',
    contact_person: 'Krishnappa',
    rating: 4.75,
    is_active: true,
    is_verified: true,
    special_features: ['100% Solar Powered Micro-Cold Room', 'Zero Carbon Storage', 'Small Farmer Priority']
  },
  // 10. Mandya - Maddur
  {
    id: 10,
    name: 'Maddur Jaggery & Perishables Covered Depot',
    location_type: 'covered',
    address: 'Old Bengaluru-Mysuru Road, Industrial Sector, Maddur',
    city: 'Maddur Jaggery Village',
    district: 'Mandya',
    latitude: 12.5844,
    longitude: 77.0456,
    total_capacity_kg: 38000,
    current_used_kg: 14000,
    available_kg: 24000,
    has_temperature_control: false,
    has_humidity_control: true,
    temperature_range_min: 22,
    temperature_range_max: 29,
    humidity_range_min: 40,
    humidity_range_max: 60,
    price_per_kg_per_day: 0.15,
    min_storage_days: 2,
    operating_hours_open: '07:00',
    operating_hours_close: '20:00',
    accepts_weekend: true,
    phone: '9876543247',
    email: 'maddur.depot@mandyafarmers.coop',
    contact_person: 'Channe Gowda',
    rating: 4.7,
    is_active: true,
    is_verified: true,
    special_features: ['Dry Air Circulation for Jaggery', 'Pest Proof Slotted Racks', 'FPO Bulk Discount']
  },
  // 11. Mandya - Central
  {
    id: 11,
    name: 'Mandya Sugar & Agro Central Warehouse',
    location_type: 'warehouse',
    address: 'Mysore-Bangalore Highway, Sugar Town, Mandya',
    city: 'Mandya City APMC',
    district: 'Mandya',
    latitude: 12.5218,
    longitude: 76.8951,
    total_capacity_kg: 65000,
    current_used_kg: 29000,
    available_kg: 36000,
    has_temperature_control: false,
    has_humidity_control: false,
    temperature_range_min: 20,
    temperature_range_max: 32,
    humidity_range_min: 40,
    humidity_range_max: 70,
    price_per_kg_per_day: 0.16,
    min_storage_days: 3,
    operating_hours_open: '08:00',
    operating_hours_close: '19:00',
    accepts_weekend: true,
    phone: '9876543248',
    email: 'mandya.central@sugaragri.in',
    contact_person: 'Basavaraj Patil',
    rating: 4.62,
    is_active: true,
    is_verified: true,
    special_features: ['Heavy Duty Weighbridge (60T)', 'Rail Siding Nearby', 'Fire Extinguisher Sprinklers']
  },
  // 12. Mandya - Srirangapatna
  {
    id: 12,
    name: 'Srirangapatna River-Valley Cold Storage',
    location_type: 'cold_storage',
    address: 'KRS Road, Paschimavahini Enclave, Srirangapatna',
    city: 'Srirangapatna Farm Belt',
    district: 'Mandya',
    latitude: 12.4238,
    longitude: 76.6947,
    total_capacity_kg: 25000,
    current_used_kg: 8900,
    available_kg: 16100,
    has_temperature_control: true,
    has_humidity_control: true,
    temperature_range_min: 3,
    temperature_range_max: 8,
    humidity_range_min: 85,
    humidity_range_max: 95,
    price_per_kg_per_day: 0.29,
    min_storage_days: 2,
    operating_hours_open: '06:30',
    operating_hours_close: '21:00',
    accepts_weekend: true,
    phone: '9876543249',
    email: 'srirangapatna.cold@cauveryagri.in',
    contact_person: 'Naveen Kumar',
    rating: 4.84,
    is_active: true,
    is_verified: true,
    special_features: ['Constant Humidity Regulation', 'Backup Generator 50kVA', 'Tomato & Capsicum Rooms']
  },
  // 13. Mysuru - Bandipalya
  {
    id: 13,
    name: 'Mysuru Agro Cold Chain Terminal',
    location_type: 'cold_storage',
    address: 'Bandipalya Market Enclave, Ooty Road, Mysuru',
    city: 'Mysuru City Bandipalya',
    district: 'Mysuru',
    latitude: 12.2785,
    longitude: 76.6715,
    total_capacity_kg: 32000,
    current_used_kg: 11500,
    available_kg: 20500,
    has_temperature_control: true,
    has_humidity_control: true,
    temperature_range_min: 3,
    temperature_range_max: 7,
    humidity_range_min: 85,
    humidity_range_max: 95,
    price_per_kg_per_day: 0.28,
    min_storage_days: 2,
    operating_hours_open: '06:30',
    operating_hours_close: '21:30',
    accepts_weekend: true,
    phone: '9876543233',
    email: 'mysuru.coldchain@agri.org',
    contact_person: 'Anand Swamy',
    rating: 4.75,
    is_active: true,
    is_verified: true,
    special_features: ['Banana & Fruit Ripening Rooms', 'Individual Cold Chambers', 'Solar Powered Backup']
  },
  // 14. Mysuru - Nanjangud
  {
    id: 14,
    name: 'Nanjangud Rasabale & Fruit Ripening Hub',
    location_type: 'cold_storage',
    address: 'Gundlupet Main Road, Near APMC Sub-Yard, Nanjangud',
    city: 'Nanjangud Banana Village',
    district: 'Mysuru',
    latitude: 12.1197,
    longitude: 76.6806,
    total_capacity_kg: 26000,
    current_used_kg: 9800,
    available_kg: 16200,
    has_temperature_control: true,
    has_humidity_control: true,
    temperature_range_min: 12,
    temperature_range_max: 16,
    humidity_range_min: 85,
    humidity_range_max: 92,
    price_per_kg_per_day: 0.26,
    min_storage_days: 3,
    operating_hours_open: '07:00',
    operating_hours_close: '21:00',
    accepts_weekend: true,
    phone: '9876543250',
    email: 'nanjangud.banana@heritageagro.in',
    contact_person: 'Mahadevappa',
    rating: 4.92,
    is_active: true,
    is_verified: true,
    special_features: ['Rasabale Banana Specialized Climate', 'Microbial Air Filtration', 'Local Farmer Subsidies']
  },
  // 15. Mysuru - Hunsur
  {
    id: 15,
    name: 'Hunsur Tobacco & Grain Depo',
    location_type: 'warehouse',
    address: 'B.M. Road, Near Industrial Area, Hunsur',
    city: 'Hunsur Tobacco & Grain Village',
    district: 'Mysuru',
    latitude: 12.3086,
    longitude: 76.2917,
    total_capacity_kg: 48000,
    current_used_kg: 19000,
    available_kg: 29000,
    has_temperature_control: false,
    has_humidity_control: true,
    temperature_range_min: 19,
    temperature_range_max: 28,
    humidity_range_min: 45,
    humidity_range_max: 60,
    price_per_kg_per_day: 0.17,
    min_storage_days: 5,
    operating_hours_open: '08:00',
    operating_hours_close: '18:30',
    accepts_weekend: false,
    phone: '9876543251',
    email: 'hunsur.depo@grainvault.in',
    contact_person: 'Somashekar',
    rating: 4.65,
    is_active: true,
    is_verified: true,
    special_features: ['Grain De-moisturizer', 'Airtight Poly-Liners', 'Electronic Moisture Meter']
  },
  // 16. Tumkur - Central
  {
    id: 16,
    name: 'Tumkur Covered Agro Shed & Depo',
    location_type: 'covered',
    address: 'B.H. Road, Industrial Estate, Tumkur',
    city: 'Tumkur City APMC',
    district: 'Tumkur',
    latitude: 13.3409,
    longitude: 77.1010,
    total_capacity_kg: 40000,
    current_used_kg: 18000,
    available_kg: 22000,
    has_temperature_control: false,
    has_humidity_control: false,
    temperature_range_min: 20,
    temperature_range_max: 30,
    humidity_range_min: 40,
    humidity_range_max: 70,
    price_per_kg_per_day: 0.12,
    min_storage_days: 1,
    operating_hours_open: '08:00',
    operating_hours_close: '18:00',
    accepts_weekend: true,
    phone: '9876543234',
    email: 'tumkur.depo@agro.in',
    contact_person: 'Manjunath Gowda',
    rating: 4.5,
    is_active: true,
    is_verified: true,
    special_features: ['Waterproof Covered Shed', 'CCTV Security', 'Direct Truck Access Ramp']
  },
  // 17. Tumkur - Tiptur
  {
    id: 17,
    name: 'Tiptur Coconut & Copra Desiccated Warehouse',
    location_type: 'warehouse',
    address: 'K.R. Extension, Near APMC Copra Yard, Tiptur',
    city: 'Tiptur Coconut Village',
    district: 'Tumkur',
    latitude: 13.2625,
    longitude: 76.4789,
    total_capacity_kg: 85000,
    current_used_kg: 34000,
    available_kg: 51000,
    has_temperature_control: false,
    has_humidity_control: true,
    temperature_range_min: 22,
    temperature_range_max: 31,
    humidity_range_min: 40,
    humidity_range_max: 55,
    price_per_kg_per_day: 0.15,
    min_storage_days: 3,
    operating_hours_open: '07:30',
    operating_hours_close: '19:30',
    accepts_weekend: true,
    phone: '9876543252',
    email: 'tiptur.copra@coconutboard.in',
    contact_person: 'Lokesh Murthy',
    rating: 4.86,
    is_active: true,
    is_verified: true,
    special_features: ['Copra Moisture Control Chamber', 'Stacking Conveyor Belts', 'Govt Warehousing Certified']
  },
  // 18. Tumkur - Sira
  {
    id: 18,
    name: 'Sira Groundnut & Oilseed Storage Shed',
    location_type: 'covered',
    address: 'NH 48 Service Road, APMC Yard, Sira',
    city: 'Sira Groundnut Village',
    district: 'Tumkur',
    latitude: 13.7436,
    longitude: 76.9083,
    total_capacity_kg: 35000,
    current_used_kg: 13000,
    available_kg: 22000,
    has_temperature_control: false,
    has_humidity_control: false,
    temperature_range_min: 22,
    temperature_range_max: 34,
    humidity_range_min: 35,
    humidity_range_max: 65,
    price_per_kg_per_day: 0.13,
    min_storage_days: 1,
    operating_hours_open: '08:00',
    operating_hours_close: '19:00',
    accepts_weekend: true,
    phone: '9876543253',
    email: 'sira.oilseeds@agrostorage.in',
    contact_person: 'Govindappa',
    rating: 4.6,
    is_active: true,
    is_verified: true,
    special_features: ['Pest fumigation quarterly', 'Raised platforms for gunny bags', 'Tractor unloading zone']
  },
  // 19. Belagavi - Central
  {
    id: 19,
    name: 'Belagavi Multi-Commodity Cold Vault',
    location_type: 'cold_storage',
    address: 'Khanapur Road, Auto Nagar, Belagavi',
    city: 'Belagavi Central City',
    district: 'Belagavi',
    latitude: 15.8497,
    longitude: 74.4977,
    total_capacity_kg: 30000,
    current_used_kg: 9500,
    available_kg: 20500,
    has_temperature_control: true,
    has_humidity_control: true,
    temperature_range_min: 0,
    temperature_range_max: 5,
    humidity_range_min: 88,
    humidity_range_max: 98,
    price_per_kg_per_day: 0.32,
    min_storage_days: 3,
    operating_hours_open: '07:00',
    operating_hours_close: '22:00',
    accepts_weekend: true,
    phone: '9876543235',
    email: 'belagavi.coldvault@cargo.in',
    contact_person: 'Prashant Kulkarni',
    rating: 4.88,
    is_active: true,
    is_verified: true,
    special_features: ['Sub-zero Frozen Section', 'Controlled Atmosphere', 'Insurance Included']
  },
  // 20. Belagavi - Chikodi
  {
    id: 20,
    name: 'Chikodi Grape & Raisin Cold Storage',
    location_type: 'cold_storage',
    address: 'Miraj-Chikodi Highway, Near Cooperative Sugar Factory, Chikodi',
    city: 'Chikodi Grape & Sugarcane Village',
    district: 'Belagavi',
    latitude: 16.4317,
    longitude: 74.5989,
    total_capacity_kg: 32000,
    current_used_kg: 10800,
    available_kg: 21200,
    has_temperature_control: true,
    has_humidity_control: true,
    temperature_range_min: -1,
    temperature_range_max: 4,
    humidity_range_min: 90,
    humidity_range_max: 95,
    price_per_kg_per_day: 0.31,
    min_storage_days: 5,
    operating_hours_open: '06:00',
    operating_hours_close: '21:00',
    accepts_weekend: true,
    phone: '9876543254',
    email: 'chikodi.grape@belagaviagri.in',
    contact_person: 'Sachin Patil',
    rating: 4.91,
    is_active: true,
    is_verified: true,
    special_features: ['Sulfur Pad Preservation for Grapes', 'Automated Temp Loggers', 'Pre-cooling Racks']
  },
  // 21. Belagavi - Gokak
  {
    id: 21,
    name: 'Gokak Produce & Grain Warehouse',
    location_type: 'warehouse',
    address: 'Gokak Falls Road, APMC Yard, Gokak',
    city: 'Gokak Falls Village Cluster',
    district: 'Belagavi',
    latitude: 16.1689,
    longitude: 74.8256,
    total_capacity_kg: 42000,
    current_used_kg: 15500,
    available_kg: 26500,
    has_temperature_control: false,
    has_humidity_control: false,
    temperature_range_min: 20,
    temperature_range_max: 32,
    humidity_range_min: 40,
    humidity_range_max: 70,
    price_per_kg_per_day: 0.16,
    min_storage_days: 2,
    operating_hours_open: '08:00',
    operating_hours_close: '19:00',
    accepts_weekend: true,
    phone: '9876543255',
    email: 'gokak.produce@karnatakawarehousing.in',
    contact_person: 'Mallikarjun Hiremath',
    rating: 4.68,
    is_active: true,
    is_verified: true,
    special_features: ['Fumigated Grain Bays', 'Electronic Gate Scale', 'Loading Labor Pool']
  },
  // 22. Ballari - Central
  {
    id: 22,
    name: 'Ballari APMC Grain & Onion Warehouse',
    location_type: 'warehouse',
    address: 'Kudligi Road, APMC Market Yard Complex, Ballari',
    city: 'Ballari City Yard',
    district: 'Ballari',
    latitude: 15.1394,
    longitude: 76.9214,
    total_capacity_kg: 70000,
    current_used_kg: 28000,
    available_kg: 42000,
    has_temperature_control: false,
    has_humidity_control: true,
    temperature_range_min: 22,
    temperature_range_max: 33,
    humidity_range_min: 50,
    humidity_range_max: 65,
    price_per_kg_per_day: 0.17,
    min_storage_days: 4,
    operating_hours_open: '07:00',
    operating_hours_close: '20:00',
    accepts_weekend: true,
    phone: '9876543256',
    email: 'ballari.onion@apmcmarket.in',
    contact_person: 'Virupakshappa',
    rating: 4.74,
    is_active: true,
    is_verified: true,
    special_features: ['Natural Cross-Ventilation for Onions', 'Curing Racks', 'Truck Weighbridge (50T)']
  },
  // 23. Raichur - Sindhanur
  {
    id: 23,
    name: 'Sindhanur Sona Masoori Modern Silo & Warehouse',
    location_type: 'warehouse',
    address: 'Kushtagi Road, Industrial Area, Sindhanur',
    city: 'Sindhanur Sona Masoori Village',
    district: 'Raichur',
    latitude: 15.7667,
    longitude: 76.7667,
    total_capacity_kg: 95000,
    current_used_kg: 38000,
    available_kg: 57000,
    has_temperature_control: false,
    has_humidity_control: true,
    temperature_range_min: 20,
    temperature_range_max: 30,
    humidity_range_min: 45,
    humidity_range_max: 60,
    price_per_kg_per_day: 0.16,
    min_storage_days: 7,
    operating_hours_open: '06:00',
    operating_hours_close: '21:00',
    accepts_weekend: true,
    phone: '9876543257',
    email: 'sindhanur.paddy@paddycorridor.in',
    contact_person: 'Hanumantha Rao',
    rating: 4.95,
    is_active: true,
    is_verified: true,
    special_features: ['Scientific Steel Silos for Paddy', 'Grain Aeration Fans', 'Pest-Free Moisture Control']
  },
  // 24. Haveri - Byadgi
  {
    id: 24,
    name: 'Byadgi Spices & Red Chilli Dehumidified Warehouse',
    location_type: 'warehouse',
    address: 'APMC Chilli Market Yard Gate 1, Byadgi',
    city: 'Byadgi Red Chilli Village',
    district: 'Haveri',
    latitude: 14.6811,
    longitude: 75.4917,
    total_capacity_kg: 80000,
    current_used_kg: 31000,
    available_kg: 49000,
    has_temperature_control: true,
    has_humidity_control: true,
    temperature_range_min: 15,
    temperature_range_max: 22,
    humidity_range_min: 40,
    humidity_range_max: 55,
    price_per_kg_per_day: 0.20,
    min_storage_days: 5,
    operating_hours_open: '07:00',
    operating_hours_close: '20:30',
    accepts_weekend: true,
    phone: '9876543258',
    email: 'byadgi.chilli@spicesboard.in',
    contact_person: 'Shankarappa Bellary',
    rating: 4.93,
    is_active: true,
    is_verified: true,
    special_features: ['Dehumidified Cold Chamber (preserves red colour & capsaicin)', 'Cold Dry Stacking', 'Direct APMC Yard Conveyor']
  },
  // 25. Hassan - Central
  {
    id: 25,
    name: 'Hassan Potato & Cold Vegetable Terminal',
    location_type: 'cold_storage',
    address: 'Industrial Growth Centre, Thimmanahalli, Hassan',
    city: 'Hassan City Potato Hub',
    district: 'Hassan',
    latitude: 13.0033,
    longitude: 76.1004,
    total_capacity_kg: 36000,
    current_used_kg: 13200,
    available_kg: 22800,
    has_temperature_control: true,
    has_humidity_control: true,
    temperature_range_min: 4,
    temperature_range_max: 9,
    humidity_range_min: 85,
    humidity_range_max: 95,
    price_per_kg_per_day: 0.28,
    min_storage_days: 3,
    operating_hours_open: '07:00',
    operating_hours_close: '21:00',
    accepts_weekend: true,
    phone: '9876543259',
    email: 'hassan.potato@coldchain.in',
    contact_person: 'Rudrappa Gowda',
    rating: 4.87,
    is_active: true,
    is_verified: true,
    special_features: ['Potato Sprout Inhibition Temperature', 'Automated CO2 Purging', 'Palletised Storage']
  },
  // 26. Hassan - Arasikere
  {
    id: 26,
    name: 'Arasikere Agro Produce Covered Depo',
    location_type: 'covered',
    address: 'Tiptur Road, Near APMC Yard, Arasikere',
    city: 'Arasikere Coconut Village',
    district: 'Hassan',
    latitude: 13.3142,
    longitude: 76.2575,
    total_capacity_kg: 38000,
    current_used_kg: 14500,
    available_kg: 23500,
    has_temperature_control: false,
    has_humidity_control: false,
    temperature_range_min: 20,
    temperature_range_max: 32,
    humidity_range_min: 40,
    humidity_range_max: 70,
    price_per_kg_per_day: 0.13,
    min_storage_days: 1,
    operating_hours_open: '08:00',
    operating_hours_close: '19:00',
    accepts_weekend: true,
    phone: '9876543260',
    email: 'arasikere.depo@agro.in',
    contact_person: 'Manju Nathan',
    rating: 4.64,
    is_active: true,
    is_verified: true,
    special_features: ['Covered Copra and Grain Deck', 'All-weather Asphalt Yard', 'Loading Assistance']
  },
  // 27. Chikmagalur - Central
  {
    id: 27,
    name: 'Chikkamagaluru Coffee & Spice Vault',
    location_type: 'warehouse',
    address: 'Kadur-Mangalore Highway, Planters Enclave, Chikkamagaluru',
    city: 'Chikkamagaluru Coffee Town',
    district: 'Chikmagalur',
    latitude: 13.3161,
    longitude: 75.7720,
    total_capacity_kg: 40000,
    current_used_kg: 16000,
    available_kg: 24000,
    has_temperature_control: false,
    has_humidity_control: true,
    temperature_range_min: 18,
    temperature_range_max: 25,
    humidity_range_min: 50,
    humidity_range_max: 65,
    price_per_kg_per_day: 0.19,
    min_storage_days: 5,
    operating_hours_open: '08:30',
    operating_hours_close: '18:30',
    accepts_weekend: false,
    phone: '9876543261',
    email: 'chikmagalur.spices@plantersguild.in',
    contact_person: 'Harish Poovaiah',
    rating: 4.89,
    is_active: true,
    is_verified: true,
    special_features: ['Aroma Sealed Spice Chambers', 'Coffee Bean Climate Stacking', 'Fumigation On Demand']
  },
  // 28. Shimoga - Central
  {
    id: 28,
    name: 'Shivamogga Arecanut & Paddy Central Warehouse',
    location_type: 'warehouse',
    address: 'Sagar Road, Industrial Area, Shivamogga',
    city: 'Shivamogga City APMC',
    district: 'Shimoga',
    latitude: 13.9299,
    longitude: 75.5681,
    total_capacity_kg: 60000,
    current_used_kg: 23000,
    available_kg: 37000,
    has_temperature_control: false,
    has_humidity_control: true,
    temperature_range_min: 20,
    temperature_range_max: 30,
    humidity_range_min: 45,
    humidity_range_max: 60,
    price_per_kg_per_day: 0.17,
    min_storage_days: 4,
    operating_hours_open: '08:00',
    operating_hours_close: '19:30',
    accepts_weekend: true,
    phone: '9876543262',
    email: 'shivamogga.warehouse@agribelt.in',
    contact_person: 'Nagaraja Rao',
    rating: 4.79,
    is_active: true,
    is_verified: true,
    special_features: ['Arecanut Moisture Proof Wooden Slats', 'Fire Protection System', 'CCTV 360 Coverage']
  }
];

const INITIAL_LOGISTICS_BOOKINGS = [
  {
    id: 101,
    user_id: 1,
    carrier_id: 1,
    post_id: 1,
    carrier_name: 'FastTransport Agro Cargo',
    carrier_phone: '9876543220',
    vehicle_type: 'truck',
    vehicle_model: 'Tata 407 Heavy Truck',
    pickup_address: 'Devanahalli Farm Cluster, Bengaluru Rural',
    pickup_lat: 13.2483,
    pickup_lng: 77.7126,
    pickup_time: new Date(Date.now() - 3600000 * 2).toISOString(),
    delivery_address: 'Yeshwantpur APMC Mandi, Bengaluru',
    delivery_lat: 13.0234,
    delivery_lng: 77.5456,
    delivery_time: new Date(Date.now() + 3600000 * 1.5).toISOString(),
    crop_type: 'Tomato',
    quantity_kg: 250,
    distance_km: 34.2,
    duration_minutes: 52,
    base_rate: 350.0,
    distance_rate: 18.0,
    total_cost: 965.60,
    status: 'in_transit',
    tracking_enabled: true,
    carrier_lat: 13.1120,
    carrier_lng: 77.6180,
    carrier_speed_kmh: 42,
    carrier_heading: 215,
    distance_remaining_km: 12.4,
    estimated_arrival_minutes: 18,
    eta: new Date(Date.now() + 18 * 60000).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    milestones: [
      { time: '07:30 AM', title: 'Booking Confirmed', description: 'Carrier accepted assignment and dispatched vehicle.', done: true },
      { time: '08:15 AM', title: 'Produce Loaded', description: '250 kg Tomato loaded and inspected at farm gate.', done: true },
      { time: '08:40 AM', title: 'In Transit', description: 'Vehicle moving along NH 44 towards Yeshwantpur APMC.', done: true },
      { time: 'ETA 09:25 AM', title: 'Arrival & Offloading', description: 'Consignment approaching APMC Gate 4.', done: false }
    ]
  }
];

const INITIAL_STORAGE_BOOKINGS = [
  {
    id: 201,
    farmer_id: 1,
    storage_id: 1,
    storage_name: 'CoolStore Agri-Cold Logistics Hub',
    storage_address: '456 Cold Chain Corridor, Yeshwantpur Industrial Area',
    quantity_kg: 500,
    crop_type: 'Tomato',
    produce_grade: 'A',
    booking_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    check_in_date: '2026-09-17',
    check_out_date: '2026-09-25',
    days: 8,
    price_per_kg_per_day: 0.30,
    total_cost: 1200.0,
    status: 'stored',
    receipt_code: 'STR-BLR-8492',
    farmer_checked_in: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

let embeddedDb = null;

function loadEmbeddedDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // Read-only filesystem on serverless
  }

  const bundledFile = path.join(__dirname, 'data', 'database.json');
  let sourceFile = null;
  if (fs.existsSync(DB_FILE)) {
    sourceFile = DB_FILE;
  } else if (fs.existsSync(bundledFile)) {
    sourceFile = bundledFile;
  }

  if (sourceFile) {
    try {
      const data = JSON.parse(fs.readFileSync(sourceFile, 'utf-8'));
      // Ensure new tables and expanded storages are seeded
      let modified = false;
      if (!data.logistics_carriers || data.logistics_carriers.length === 0) {
        data.logistics_carriers = INITIAL_CARRIERS;
        modified = true;
      }
      if (!data.storage_locations || data.storage_locations.length < 20) {
        data.storage_locations = INITIAL_STORAGES;
        modified = true;
      }
      if (!data.posts || data.posts.length < 8) {
        data.posts = INITIAL_POSTS;
        modified = true;
      }
      if (!data.logistics_bookings) {
        data.logistics_bookings = INITIAL_LOGISTICS_BOOKINGS;
        modified = true;
      }
      if (!data.storage_bookings) {
        data.storage_bookings = INITIAL_STORAGE_BOOKINGS;
        modified = true;
      }
      // Ensure all existing users have city_or_village and coordinates
      if (data.users && Array.isArray(data.users)) {
        data.users = data.users.map(u => {
          if (!u.city_or_village) {
            if (u.id === 1) { u.city_or_village = 'Devanahalli Village Hub'; u.district = 'Bengaluru'; u.lat = 13.2483; u.lng = 77.7126; modified = true; }
            else if (u.id === 2) { u.city_or_village = 'Yeshwantpur Mandi City'; u.district = 'Bengaluru'; u.lat = 13.0234; u.lng = 77.5456; modified = true; }
            else if (u.id === 3) { u.city_or_village = 'K.R. Market Central'; u.district = 'Bengaluru'; u.lat = 12.9698; u.lng = 77.5684; modified = true; }
            else if (u.id === 4) { u.city_or_village = 'Malur Farm Village'; u.district = 'Kolar'; u.lat = 13.0048; u.lng = 77.9405; modified = true; }
            else if (u.id === 5) { u.city_or_village = 'Maddur Jaggery Village'; u.district = 'Mandya'; u.lat = 12.5844; u.lng = 77.0456; modified = true; }
            else { u.city_or_village = 'Devanahalli Village Hub'; u.district = u.district || 'Bengaluru'; u.lat = 13.2483; u.lng = 77.7126; modified = true; }
          }
          return u;
        });
      }
      embeddedDb = data;
      if (modified) {
        saveEmbeddedDb();
      }
      return data;
    } catch (e) {
      console.warn('[DB] Could not parse existing database.json, re-initializing seed.');
    }
  }

  const initialDb = {
    users: INITIAL_USERS,
    posts: INITIAL_POSTS,
    fpo: INITIAL_FPO,
    fpo_joins: INITIAL_FPO_JOINS,
    mandi_prices: INITIAL_MANDI_PRICES,
    cv_grades: [],
    logistics_carriers: INITIAL_CARRIERS,
    storage_locations: INITIAL_STORAGES,
    logistics_bookings: INITIAL_LOGISTICS_BOOKINGS,
    storage_bookings: INITIAL_STORAGE_BOOKINGS
  };

  embeddedDb = initialDb;
  saveEmbeddedDb();
  return initialDb;
}

function saveEmbeddedDb() {
  if (embeddedDb) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(embeddedDb, null, 2), 'utf-8');
    } catch (err) {
      // In read-only serverless environments, state continues in memory
      console.warn('[DB] Could not persist to disk, continuing in-memory:', err.message);
    }
  }
}

// Check PostgreSQL availability
async function initDb() {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    try {
      pgPool = new Pool({
        connectionString,
        connectionTimeoutMillis: 2000
      });
      // Test connection
      const client = await pgPool.connect();
      client.release();
      usePg = true;
      console.log('[DB] Connected successfully to PostgreSQL.');
      return;
    } catch (err) {
      console.log(`[DB] PostgreSQL not reachable (${err.message}). Using seamless local embedded database.`);
      usePg = false;
      if (pgPool) {
        pgPool.end().catch(() => {});
        pgPool = null;
      }
    }
  } else {
    console.log('[DB] No DATABASE_URL set. Using seamless local embedded database.');
  }

  embeddedDb = loadEmbeddedDb();
  console.log(`[DB] Embedded database active with ${embeddedDb.users.length} users, ${embeddedDb.mandi_prices.length} mandi prices, ${embeddedDb.posts.length} posts.`);
}

// Embedded query executor that responds with { rows, rowCount }
function queryEmbedded(text, params = []) {
  if (!embeddedDb) {
    embeddedDb = loadEmbeddedDb();
  }

  const sql = text.trim();
  const normalizedSql = sql.replace(/\s+/g, ' ');

  // 1. SELECT * FROM users WHERE email = $1
  if (/^SELECT \* FROM users WHERE email =/i.test(normalizedSql)) {
    const email = (params[0] || '').toLowerCase().trim();
    const user = embeddedDb.users.find(u => u.email.toLowerCase() === email);
    return { rows: user ? [{ ...user }] : [], rowCount: user ? 1 : 0 };
  }

  // 2. SELECT * FROM users WHERE id = $1
  if (/^SELECT \* FROM users WHERE id =/i.test(normalizedSql)) {
    const id = Number(params[0]);
    const user = embeddedDb.users.find(u => u.id === id);
    return { rows: user ? [{ ...user }] : [], rowCount: user ? 1 : 0 };
  }

  // 3. INSERT INTO users
  if (/^INSERT INTO users/i.test(normalizedSql)) {
    const [name, email, password, user_type, district, phone, whatsapp_number, is_verified, city_or_village, lat, lng] = params;
    const newId = embeddedDb.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const now = new Date().toISOString();
    const newUser = {
      id: newId,
      name,
      email: email.toLowerCase().trim(),
      password,
      user_type,
      district: district || 'Bengaluru',
      city_or_village: city_or_village || 'Devanahalli Village Hub',
      lat: lat ? Number(lat) : 13.2483,
      lng: lng ? Number(lng) : 77.7126,
      phone: phone || '',
      whatsapp_number: whatsapp_number || phone || '',
      profile_image_url: null,
      is_verified: is_verified || false,
      created_at: now,
      updated_at: now
    };
    embeddedDb.users.push(newUser);
    saveEmbeddedDb();
    return { rows: [{ ...newUser }], rowCount: 1 };
  }

  // 4. SELECT users FOR ADMIN
  if (/^SELECT id, name, email, user_type, district, phone/i.test(normalizedSql)) {
    let users = [...embeddedDb.users].map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      user_type: u.user_type,
      district: u.district,
      phone: u.phone,
      whatsapp_number: u.whatsapp_number,
      is_verified: u.is_verified,
      created_at: u.created_at
    }));
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: users, rowCount: users.length };
  }

  // 5. POSTS: INSERT INTO posts
  if (/^INSERT INTO posts/i.test(normalizedSql)) {
    const [user_id, title, description, category, crop_type, quantity, price_per_unit, grade, image_url, user_type] = params;
    const newId = embeddedDb.posts.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const now = new Date().toISOString();
    const newPost = {
      id: newId,
      user_id: Number(user_id),
      title,
      description,
      category,
      crop_type,
      quantity: Number(quantity),
      price_per_unit: Number(price_per_unit),
      grade: grade || 'N/A',
      image_url: image_url || null,
      user_type,
      is_active: true,
      created_at: now,
      updated_at: now
    };
    embeddedDb.posts.push(newPost);
    saveEmbeddedDb();
    return { rows: [{ ...newPost }], rowCount: 1 };
  }

  // 6. POSTS: SELECT Feed (with user JOIN)
  if (/^SELECT p\.\*, u\.name/i.test(normalizedSql) || /^SELECT posts\.\*/i.test(normalizedSql)) {
    let posts = [...embeddedDb.posts].filter(p => p.is_active);

    // Check query params if user filtered by target user_type or crop or category
    // In our routes we pass params
    return executePostsQuery(normalizedSql, params);
  }

  // 7. POSTS: User posts (GET /posts/user/:userId)
  if (/FROM posts p JOIN users u ON p\.user_id = u\.id WHERE p\.user_id =/i.test(normalizedSql) || /FROM posts WHERE user_id =/i.test(normalizedSql)) {
    const userId = Number(params[0]);
    const user = embeddedDb.users.find(u => u.id === userId);
    let posts = embeddedDb.posts
      .filter(p => p.user_id === userId && p.is_active)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(p => ({
        ...p,
        user_name: user?.name || '',
        name: user?.name || '',
        phone: user?.phone || '',
        district: user?.district || '',
        whatsapp_number: user?.whatsapp_number || user?.phone || ''
      }));
    return { rows: posts, rowCount: posts.length };
  }

  // 8. POSTS: Dealing Done (UPDATE posts SET is_active = false WHERE id = $1)
  if (/UPDATE posts SET is_active = false/i.test(normalizedSql)) {
    const postId = Number(params[0]);
    const post = embeddedDb.posts.find(p => p.id === postId);
    if (post) {
      post.is_active = false;
      post.updated_at = new Date().toISOString();
      saveEmbeddedDb();
      return { rows: [{ ...post }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 9. FPO: INSERT INTO fpo
  if (/^INSERT INTO fpo/i.test(normalizedSql)) {
    const [creator_id, crop_type, required_quantity, grade, location, district, price] = params;
    const newId = embeddedDb.fpo.reduce((max, f) => Math.max(max, f.id), 0) + 1;
    const now = new Date().toISOString();
    const newFpo = {
      id: newId,
      creator_id: Number(creator_id),
      crop_type,
      required_quantity: Number(required_quantity),
      current_quantity: 0,
      grade: grade || 'A',
      location: location || '',
      district: district || 'Bengaluru',
      price: Number(price),
      is_active: true,
      created_at: now,
      updated_at: now
    };
    embeddedDb.fpo.push(newFpo);
    saveEmbeddedDb();
    return { rows: [{ ...newFpo }], rowCount: 1 };
  }

  // 10. FPO: SELECT active FPOs
  if (/FROM fpo f JOIN users u ON f\.creator_id = u\.id/i.test(normalizedSql) && /f\.id =/i.test(normalizedSql)) {
    const fpoId = Number(params[0]);
    const fpo = embeddedDb.fpo.find(f => f.id === fpoId);
    if (!fpo) return { rows: [], rowCount: 0 };
    const creator = embeddedDb.users.find(u => u.id === fpo.creator_id);
    return {
      rows: [{
        ...fpo,
        creator_name: creator?.name || 'Unknown',
        creator_phone: creator?.phone || '',
        creator_whatsapp: creator?.whatsapp_number || creator?.phone || ''
      }],
      rowCount: 1
    };
  }

  if (/FROM fpo f JOIN users u ON f\.creator_id = u\.id/i.test(normalizedSql)) {
    let fpos = embeddedDb.fpo.filter(f => f.is_active);
    if (params.length > 0 && params[0]) {
      const districtFilter = params[0].toLowerCase();
      fpos = fpos.filter(f => f.district.toLowerCase() === districtFilter);
    }
    const result = fpos
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(f => {
        const creator = embeddedDb.users.find(u => u.id === f.creator_id);
        return {
          ...f,
          creator_name: creator?.name || 'Unknown',
          creator_phone: creator?.phone || '',
          creator_whatsapp: creator?.whatsapp_number || creator?.phone || ''
        };
      });
    return { rows: result, rowCount: result.length };
  }

  // 11. FPO_JOINS: INSERT INTO fpo_joins
  if (/^INSERT INTO fpo_joins/i.test(normalizedSql)) {
    const [fpo_id, farmer_id, quantity_contributed] = params;
    const newId = embeddedDb.fpo_joins.reduce((max, j) => Math.max(max, j.id), 0) + 1;
    const now = new Date().toISOString();
    const newJoin = {
      id: newId,
      fpo_id: Number(fpo_id),
      farmer_id: Number(farmer_id),
      quantity_contributed: Number(quantity_contributed),
      created_at: now
    };
    embeddedDb.fpo_joins.push(newJoin);
    saveEmbeddedDb();
    return { rows: [{ ...newJoin }], rowCount: 1 };
  }

  // 12. FPO: UPDATE current_quantity
  if (/UPDATE fpo SET current_quantity = current_quantity \+/i.test(normalizedSql)) {
    const [addedQty, fpoId] = params;
    const fpo = embeddedDb.fpo.find(f => f.id === Number(fpoId));
    if (fpo) {
      fpo.current_quantity = Number((Number(fpo.current_quantity || 0) + Number(addedQty)).toFixed(2));
      fpo.updated_at = new Date().toISOString();
      saveEmbeddedDb();
      return { rows: [{ ...fpo }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 13. FPO_JOINS: List joined farmers for FPO
  if (/FROM fpo_joins j JOIN users u ON j\.farmer_id = u\.id WHERE j\.fpo_id =/i.test(normalizedSql)) {
    const fpoId = Number(params[0]);
    const joins = embeddedDb.fpo_joins
      .filter(j => j.fpo_id === fpoId)
      .map(j => {
        const farmer = embeddedDb.users.find(u => u.id === j.farmer_id);
        return {
          id: j.id,
          fpo_id: j.fpo_id,
          farmer_id: j.farmer_id,
          farmer_name: farmer?.name || 'Farmer',
          farmer_phone: farmer?.phone || '',
          farmer_whatsapp: farmer?.whatsapp_number || farmer?.phone || '',
          quantity_contributed: j.quantity_contributed,
          created_at: j.created_at
        };
      });
    return { rows: joins, rowCount: joins.length };
  }

  // 14. FPO: COMPLETE (UPDATE fpo SET is_active = false WHERE id = $1)
  if (/UPDATE fpo SET is_active = false/i.test(normalizedSql)) {
    const fpoId = Number(params[0]);
    const fpo = embeddedDb.fpo.find(f => f.id === fpoId);
    if (fpo) {
      fpo.is_active = false;
      fpo.updated_at = new Date().toISOString();
      saveEmbeddedDb();
      return { rows: [{ ...fpo }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 14.5 COUNT queries
  if (/^SELECT COUNT\(\*\)/i.test(normalizedSql)) {
    if (/FROM users/i.test(normalizedSql)) {
      if (/WHERE user_type\s*=\s*'farmer'/i.test(normalizedSql)) {
        return { rows: [{ count: String(embeddedDb.users.filter(u => u.user_type === 'farmer').length) }], rowCount: 1 };
      }
      if (/WHERE user_type\s*=\s*'buyer'/i.test(normalizedSql)) {
        return { rows: [{ count: String(embeddedDb.users.filter(u => u.user_type === 'buyer').length) }], rowCount: 1 };
      }
      return { rows: [{ count: String(embeddedDb.users.length) }], rowCount: 1 };
    }
    if (/FROM posts/i.test(normalizedSql)) {
      if (/WHERE is_active\s*=\s*true/i.test(normalizedSql)) {
        return { rows: [{ count: String(embeddedDb.posts.filter(p => p.is_active).length) }], rowCount: 1 };
      }
      if (/WHERE is_active\s*=\s*false/i.test(normalizedSql)) {
        return { rows: [{ count: String(embeddedDb.posts.filter(p => !p.is_active).length) }], rowCount: 1 };
      }
      return { rows: [{ count: String(embeddedDb.posts.length) }], rowCount: 1 };
    }
    if (/FROM mandi_prices/i.test(normalizedSql)) {
      return { rows: [{ count: String(embeddedDb.mandi_prices.length) }], rowCount: 1 };
    }
    if (/FROM fpo/i.test(normalizedSql)) {
      return { rows: [{ count: String(embeddedDb.fpo.length) }], rowCount: 1 };
    }
    return { rows: [{ count: '0' }], rowCount: 1 };
  }

  // 15. MANDI_PRICES: SELECT
  if (/FROM mandi_prices/i.test(normalizedSql)) {
    // DISTINCT crop_type
    if (/SELECT DISTINCT crop_type FROM mandi_prices/i.test(normalizedSql)) {
      const crops = [...new Set(embeddedDb.mandi_prices.map(m => m.crop_type))].sort();
      return { rows: crops.map(c => ({ crop_type: c })), rowCount: crops.length };
    }

    // DISTINCT district
    if (/SELECT DISTINCT district FROM mandi_prices/i.test(normalizedSql)) {
      const districts = [...new Set(embeddedDb.mandi_prices.map(m => m.district))].sort();
      return { rows: districts.map(d => ({ district: d })), rowCount: districts.length };
    }

    // Filtered mandi prices
    let list = [...embeddedDb.mandi_prices];
    if (normalizedSql.includes('crop_type =') && normalizedSql.includes('district =')) {
      const [crop, dist] = params;
      if (crop) list = list.filter(m => m.crop_type.toLowerCase() === crop.toLowerCase());
      if (dist) list = list.filter(m => m.district.toLowerCase() === dist.toLowerCase());
    } else if (normalizedSql.includes('crop_type =')) {
      const [crop] = params;
      if (crop) list = list.filter(m => m.crop_type.toLowerCase() === crop.toLowerCase());
    } else if (normalizedSql.includes('district =')) {
      const [dist] = params;
      if (dist) list = list.filter(m => m.district.toLowerCase() === dist.toLowerCase());
    }
    list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    return { rows: list, rowCount: list.length };
  }

  // 16. MANDI_PRICES: UPDATE OR INSERT
  if (/UPDATE mandi_prices SET price =/i.test(normalizedSql)) {
    const [price, min_price, max_price, crop_type, district] = params;
    const item = embeddedDb.mandi_prices.find(
      m => m.crop_type.toLowerCase() === crop_type.toLowerCase() && m.district.toLowerCase() === district.toLowerCase()
    );
    if (item) {
      item.price = Number(price);
      item.min_price = Number(min_price);
      item.max_price = Number(max_price);
      item.updated_at = new Date().toISOString();
      saveEmbeddedDb();
      return { rows: [{ ...item }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (/INSERT INTO mandi_prices/i.test(normalizedSql)) {
    const [crop_type, district, price, min_price, max_price, market_name] = params;
    const newId = embeddedDb.mandi_prices.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    const newItem = {
      id: newId,
      crop_type,
      district,
      price: Number(price),
      min_price: Number(min_price),
      max_price: Number(max_price),
      market_name: market_name || `${district} Mandi Yard`,
      updated_at: new Date().toISOString()
    };
    embeddedDb.mandi_prices.push(newItem);
    saveEmbeddedDb();
    return { rows: [{ ...newItem }], rowCount: 1 };
  }

  // 17. ANALYTICS COUNT(*) QUERIES
  if (/COUNT\(\*\) FROM users/i.test(normalizedSql)) {
    if (/WHERE user_type\s*=\s*'farmer'/i.test(normalizedSql)) {
      const count = embeddedDb.users.filter(u => u.user_type === 'farmer').length;
      return { rows: [{ count: String(count) }], rowCount: 1 };
    }
    if (/WHERE user_type\s*=\s*'buyer'/i.test(normalizedSql)) {
      const count = embeddedDb.users.filter(u => u.user_type === 'buyer').length;
      return { rows: [{ count: String(count) }], rowCount: 1 };
    }
    const count = embeddedDb.users.length;
    return { rows: [{ count: String(count) }], rowCount: 1 };
  }

  if (/COUNT\(\*\) FROM posts/i.test(normalizedSql)) {
    if (/WHERE is_active\s*=\s*true/i.test(normalizedSql)) {
      const count = embeddedDb.posts.filter(p => p.is_active).length;
      return { rows: [{ count: String(count) }], rowCount: 1 };
    }
    if (/WHERE is_active\s*=\s*false/i.test(normalizedSql)) {
      const count = embeddedDb.posts.filter(p => !p.is_active).length;
      return { rows: [{ count: String(count) }], rowCount: 1 };
    }
    const count = embeddedDb.posts.length;
    return { rows: [{ count: String(count) }], rowCount: 1 };
  }

  if (/COUNT\(\*\) FROM mandi_prices/i.test(normalizedSql)) {
    const count = embeddedDb.mandi_prices.length;
    return { rows: [{ count: String(count) }], rowCount: 1 };
  }

  if (/COUNT\(\*\) FROM fpo/i.test(normalizedSql)) {
    const count = embeddedDb.fpo.length;
    return { rows: [{ count: String(count) }], rowCount: 1 };
  }

  console.warn('[DB] Fallback unhandled query:', normalizedSql);
  return { rows: [], rowCount: 0 };
}

function executePostsQuery(sql, params) {
  let posts = embeddedDb.posts.filter(p => p.is_active);

  // Match compound checks
  if (sql.includes("p.user_type = 'farmer' OR p.category = 'produce'")) {
    posts = posts.filter(p => p.user_type === 'farmer' || p.category === 'produce');
  } else if (sql.includes("p.user_type = 'buyer' OR p.category = 'requirement'")) {
    posts = posts.filter(p => p.user_type === 'buyer' || p.category === 'requirement');
  } else if (/p\.user_type = \$/i.test(sql) && params && params.length > 0) {
    const targetUserType = params[0];
    posts = posts.filter(p => p.user_type === targetUserType);
  }

  // Parse crop_type filter
  if (/crop_type/i.test(sql) && params && params.length > 0) {
    const cropParam = params.find(p => p !== 'farmer' && p !== 'buyer' && p !== 'produce' && p !== 'requirement' && typeof p === 'string');
    if (cropParam) {
      posts = posts.filter(p => p.crop_type && p.crop_type.toLowerCase() === cropParam.toLowerCase());
    }
  }

  // Parse category filter
  if (/p\.category = \$/i.test(sql) && params && params.length > 0) {
    const categoryParam = params.find(p => p === 'produce' || p === 'requirement');
    if (categoryParam) {
      posts = posts.filter(p => p.category === categoryParam);
    }
  }

  const result = posts
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 60)
    .map(p => {
      const user = embeddedDb.users.find(u => u.id === p.user_id);
      return {
        ...p,
        user_name: user?.name || 'User',
        name: user?.name || 'User',
        phone: user?.phone || '',
        district: p.district || user?.district || 'Bengaluru',
        city_or_village: p.city_or_village || user?.city_or_village || 'Devanahalli Village Hub',
        lat: p.lat || user?.lat || 13.2483,
        lng: p.lng || user?.lng || 77.7126,
        whatsapp_number: user?.whatsapp_number || user?.phone || ''
      };
    });

  return { rows: result, rowCount: result.length };
}

async function query(text, params) {
  if (usePg && pgPool) {
    try {
      return await pgPool.query(text, params);
    } catch (err) {
      console.error('[DB] PostgreSQL query failed, attempting embedded query:', err.message);
      return queryEmbedded(text, params);
    }
  }
  return queryEmbedded(text, params);
}

// Logistics Helpers
function getCarriers(filter = {}) {
  if (!embeddedDb) embeddedDb = loadEmbeddedDb();
  let carriers = embeddedDb.logistics_carriers || [];
  if (filter.vehicle_type) {
    carriers = carriers.filter(c => c.vehicle_type.toLowerCase() === filter.vehicle_type.toLowerCase());
  }
  if (filter.min_capacity) {
    carriers = carriers.filter(c => c.capacity_kg >= Number(filter.min_capacity));
  }
  return carriers.filter(c => c.is_active);
}

function getCarrierById(id) {
  if (!embeddedDb) embeddedDb = loadEmbeddedDb();
  return (embeddedDb.logistics_carriers || []).find(c => c.id === Number(id));
}

function createLogisticsBooking(data) {
  if (!embeddedDb) embeddedDb = loadEmbeddedDb();
  if (!embeddedDb.logistics_bookings) embeddedDb.logistics_bookings = [];

  const newId = embeddedDb.logistics_bookings.reduce((max, b) => Math.max(max, b.id), 100) + 1;
  const carrier = getCarrierById(data.carrier_id);

  const newBooking = {
    id: newId,
    user_id: Number(data.user_id),
    carrier_id: Number(data.carrier_id),
    post_id: data.post_id ? Number(data.post_id) : null,
    carrier_name: carrier ? carrier.name : data.carrier_name || 'Assigned Logistics Carrier',
    carrier_phone: carrier ? carrier.phone : data.carrier_phone || '9876543210',
    vehicle_type: carrier ? carrier.vehicle_type : data.vehicle_type || 'truck',
    vehicle_model: carrier ? carrier.vehicle_model : data.vehicle_model || 'Standard Cargo Vehicle',
    pickup_address: data.pickup_address,
    pickup_lat: Number(data.pickup_lat) || 12.9716,
    pickup_lng: Number(data.pickup_lng) || 77.5946,
    pickup_time: data.pickup_time || new Date().toISOString(),
    delivery_address: data.delivery_address,
    delivery_lat: Number(data.delivery_lat) || 13.0234,
    delivery_lng: Number(data.delivery_lng) || 77.5456,
    delivery_time: data.delivery_time || null,
    crop_type: data.crop_type || 'Produce',
    quantity_kg: Number(data.quantity_kg) || 100,
    distance_km: Number(data.distance_km) || 15.0,
    duration_minutes: Number(data.duration_minutes) || 30,
    base_rate: Number(data.base_rate) || (carrier ? carrier.base_rate : 200),
    distance_rate: Number(data.distance_rate) || (carrier ? carrier.rate_per_km : 15),
    total_cost: Number(data.total_cost) || 450.0,
    status: data.status || 'in_transit',
    tracking_enabled: true,
    carrier_lat: Number(data.pickup_lat) || 12.9716,
    carrier_lng: Number(data.pickup_lng) || 77.5946,
    carrier_speed_kmh: 40,
    carrier_heading: 45,
    distance_remaining_km: Number(data.distance_km) || 15.0,
    estimated_arrival_minutes: Number(data.duration_minutes) || 30,
    eta: new Date(Date.now() + (Number(data.duration_minutes) || 30) * 60000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    milestones: [
      { time: 'Just Now', title: 'Booking Confirmed', description: 'Carrier assigned and vehicle dispatched for pickup.', done: true },
      { time: 'Scheduled', title: 'Produce Loaded', description: 'Cargo will be weighed and verified on arrival.', done: false },
      { time: 'En Route', title: 'In Transit', description: 'Real-time GPS tracking enabled along highway route.', done: false },
      { time: 'Destination', title: 'Delivery Completed', description: 'Unloaded and receipt generated.', done: false }
    ]
  };

  embeddedDb.logistics_bookings.unshift(newBooking);
  saveEmbeddedDb();
  return newBooking;
}

function getUserLogisticsBookings(userId) {
  if (!embeddedDb) embeddedDb = loadEmbeddedDb();
  const bookings = embeddedDb.logistics_bookings || [];
  return bookings
    .filter(b => b.user_id === Number(userId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getLogisticsBookingById(id) {
  if (!embeddedDb) embeddedDb = loadEmbeddedDb();
  return (embeddedDb.logistics_bookings || []).find(b => b.id === Number(id));
}

function updateLogisticsBooking(id, updates) {
  if (!embeddedDb) embeddedDb = loadEmbeddedDb();
  const booking = (embeddedDb.logistics_bookings || []).find(b => b.id === Number(id));
  if (booking) {
    Object.assign(booking, updates, { updated_at: new Date().toISOString() });
    saveEmbeddedDb();
    return booking;
  }
  return null;
}

// Storage Helpers
function getStorageLocations(filter = {}) {
  if (!embeddedDb) embeddedDb = loadEmbeddedDb();
  let storages = embeddedDb.storage_locations || [];
  if (filter.district && filter.district.toLowerCase() !== 'all') {
    storages = storages.filter(s => s.district.toLowerCase() === filter.district.toLowerCase());
  }
  if (filter.city_or_village && filter.city_or_village.toLowerCase() !== 'all') {
    const term = filter.city_or_village.toLowerCase();
    storages = storages.filter(s =>
      s.city.toLowerCase().includes(term) ||
      s.address.toLowerCase().includes(term) ||
      term.includes(s.city.toLowerCase())
    );
  }
  if (filter.location_type && filter.location_type !== 'all') {
    storages = storages.filter(s => s.location_type.toLowerCase() === filter.location_type.toLowerCase());
  }
  if (filter.min_capacity) {
    storages = storages.filter(s => s.available_kg >= Number(filter.min_capacity));
  }
  if (filter.max_price) {
    storages = storages.filter(s => s.price_per_kg_per_day <= Number(filter.max_price));
  }
  return storages.filter(s => s.is_active);
}

function getStorageLocationById(id) {
  if (!embeddedDb) embeddedDb = loadEmbeddedDb();
  return (embeddedDb.storage_locations || []).find(s => s.id === Number(id));
}

function updateUserProfile(id, updates) {
  if (!embeddedDb) embeddedDb = loadEmbeddedDb();
  const user = (embeddedDb.users || []).find(u => u.id === Number(id));
  if (user) {
    Object.assign(user, updates, { updated_at: new Date().toISOString() });
    saveEmbeddedDb();
    return user;
  }
  return null;
}

function createStorageBooking(data) {
  if (!embeddedDb) embeddedDb = loadEmbeddedDb();
  if (!embeddedDb.storage_bookings) embeddedDb.storage_bookings = [];

  const newId = embeddedDb.storage_bookings.reduce((max, b) => Math.max(max, b.id), 200) + 1;
  const storage = getStorageLocationById(data.storage_id);

  const newBooking = {
    id: newId,
    farmer_id: Number(data.farmer_id || data.user_id),
    storage_id: Number(data.storage_id),
    storage_name: storage ? storage.name : 'Agro Cold Hub',
    storage_address: storage ? storage.address : '',
    post_id: data.post_id ? Number(data.post_id) : null,
    quantity_kg: Number(data.quantity_kg),
    crop_type: data.crop_type || 'Tomato',
    produce_grade: data.produce_grade || 'A',
    produce_description: data.produce_description || '',
    special_requirements: data.special_requirements || '',
    check_in_date: data.check_in_date,
    check_out_date: data.check_out_date,
    days: Number(data.days) || 7,
    price_per_kg_per_day: Number(data.price_per_kg_per_day) || (storage ? storage.price_per_kg_per_day : 0.30),
    total_cost: Number(data.total_cost),
    status: 'stored',
    farmer_checked_in: true,
    receipt_code: `STR-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    booking_date: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  if (storage && storage.available_kg >= newBooking.quantity_kg) {
    storage.current_used_kg += newBooking.quantity_kg;
    storage.available_kg -= newBooking.quantity_kg;
  }

  embeddedDb.storage_bookings.unshift(newBooking);
  saveEmbeddedDb();
  return newBooking;
}

function getUserStorageBookings(userId) {
  if (!embeddedDb) embeddedDb = loadEmbeddedDb();
  const bookings = embeddedDb.storage_bookings || [];
  return bookings
    .filter(b => b.farmer_id === Number(userId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

module.exports = {
  initDb,
  query,
  getEmbeddedDb: () => embeddedDb,
  saveEmbeddedDb,
  getCarriers,
  getCarrierById,
  createLogisticsBooking,
  getUserLogisticsBookings,
  getLogisticsBookingById,
  updateLogisticsBooking,
  getStorageLocations,
  getStorageLocationById,
  updateUserProfile,
  createStorageBooking,
  getUserStorageBookings
};
