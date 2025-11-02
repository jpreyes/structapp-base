import os
from dotenv import load_dotenv
load_dotenv()
APP_URL = os.getenv("APP_URL","http://localhost:8501")
SUPABASE_URL = os.getenv("SUPABASE_URL","")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY","")
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN","")
MP_WEBHOOK_SECRET = os.getenv("MP_WEBHOOK_SECRET","")
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID","")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET","")
PAYPAL_WEBHOOK_ID = os.getenv("PAYPAL_WEBHOOK_ID","")
PAYPAL_ENV = os.getenv("PAYPAL_ENV","sandbox")
