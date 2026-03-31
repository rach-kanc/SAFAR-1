"""Run with: python test_n8n.py"""
import requests, json

URL = "https://rpsbareilly06.app.n8n.cloud/webhook/safar-chat"

payload = {
    "message": "Hello, what is SAFAR?",
    "session_id": "test-debug-123"
}

print(f"POST → {URL}")
print(f"Body sent: {json.dumps(payload)}\n")

try:
    r = requests.post(URL, json=payload, timeout=30)
    print(f"HTTP Status : {r.status_code}")
    print(f"Headers     : {dict(r.headers)}")
    print(f"Raw Body    : '{r.text}'")
    print(f"Body length : {len(r.text)} chars")
    if r.text:
        try:
            print(f"Parsed JSON : {r.json()}")
        except Exception as e:
            print(f"Not valid JSON: {e}")
    else:
        print("\n⚠️  EMPTY BODY — The Respond to Webhook node returned nothing.")
        print("Fix: In n8n, open 'Respond to Webhook' → change Response Body expression")
        print("     from {{ $json.output }} to the correct field from Formatter node.")
except Exception as e:
    print(f"Request failed: {e}")
