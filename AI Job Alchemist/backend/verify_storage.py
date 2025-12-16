
import firebase_admin
from firebase_admin import credentials, storage
from google.cloud import storage as gcs
import os
from dotenv import load_dotenv

load_dotenv()

try:
    cred = credentials.Certificate("firebase-service-account.json")
    print(f"Service Account Project ID: {cred.project_id}")
    
    # Initialize GCS client directly with credentials
    client = gcs.Client(credentials=cred.get_credential(), project=cred.project_id)
    
    print("Listing buckets for project...")
    buckets = list(client.list_buckets())
    
    if not buckets:
        print("No buckets found for this project.")
    else:
        print(f"Found {len(buckets)} buckets:")
        for bucket in buckets:
            print(f"- {bucket.name}")

except Exception as e:
    print(f"Error: {e}")
