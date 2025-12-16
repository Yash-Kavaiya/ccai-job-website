
import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()

try:
    cred = credentials.Certificate("firebase-service-account.json")
    print(f"Service Account Project ID: {cred.project_id}")
    
    # Initialize if not already initialized
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)

    db = firestore.client()
    print("Firestore client initialized.")
    
    # List resumes to verify upload
    print("Listing resumes...")
    resumes = db.collection(u'resumes').stream()
    count = 0
    for doc in resumes:
        print(f"{doc.id} => {doc.to_dict().get('name')}")
        count += 1
    
    if count == 0:
        print("No resumes found.")
    else:
        print(f"Found {count} resumes.")

except Exception as e:
    print(f"Error: {e}")
