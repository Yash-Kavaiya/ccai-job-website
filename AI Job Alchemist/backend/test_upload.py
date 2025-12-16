
import requests
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import auth, credentials

# Load env to get credentials
load_dotenv()

# Setup Firebase Auth to get a valid token
cred = credentials.Certificate("firebase-service-account.json")
firebase_admin.initialize_app(cred)

# Create a custom token (simulating a client login) or just sign in anonymously/simulated
# Actually, for the backend test, we need a valid ID token.
# Since we are admin, we can create a custom token, BUT the backend middleware verifies it as an ID token.
# To get a real ID token, we usually need to exchange a custom token via the Client SDK or a REST API key.
# Alternatively, I can temporarily disable auth in the backend or mock the user.
# OR, use the Firebase REST API to sign in with email/password if I have a test user.

# Let's try to see if there is a way to get a token easily.
# Env has API_KEY.
api_key = os.getenv("VITE_FIREBASE_API_KEY") 
# I don't have the API KEY in the backend .env, it's in the frontend .env.
# I saw it in the frontend .env earlier.

API_KEY = "AIzaSyBewiUyUsiB32_F8vVtxIBIboo-yc-KFAA"

def get_id_token():
    # We need a user. I can create one or use an existing one.
    # I'll create a temporary test user.
    try:
        user = auth.create_user(email="testuser@example.com", password="password123")
        uid = user.uid
    except:
        # User might exist
        user = auth.get_user_by_email("testuser@example.com")
        uid = user.uid

    # Exchange custom token for ID token? No, verify_firebase_token expects an ID token.
    # We can use the Identity Toolkit REST API to sign in with password.
    
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
    payload = {
        "email": "testuser@example.com",
        "password": "password123",
        "returnSecureToken": True
    }
    r = requests.post(url, json=payload)
    if r.status_code == 200:
        return r.json()['idToken']
    else:
        print("Failed to get token:", r.text)
        return None

token = get_id_token()

if token:
    print("Got ID Token. Uploading file...")
    url = "http://localhost:8000/api/v1/resumes/upload"
    files = {'file': ('test_resume.txt', open('../test_resume.txt', 'rb'), 'text/plain')}
    data = {
        'name': 'Test Resume',
        'is_primary': 'false',
        'auto_analyze': 'false'
    }
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        r = requests.post(url, files=files, data=data, headers=headers)
        print(f"Status Code: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Request failed: {e}")
else:
    print("Could not proceed without token.")
