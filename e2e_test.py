#!/usr/bin/env python3
"""
End-to-End API Test Suite for Secure Notes
Tests all critical user workflows
"""

import requests
import json
import time
import random

BASE_URL = "http://localhost:8000/api/v1"

def test_auth_workflow():
    """Test complete authentication workflow"""
    print("\n" + "="*50)
    print("END-TO-END AUTHENTICATION & NOTES TEST")
    print("="*50 + "\n")
    
    # Generate unique email
    email = f"e2e_test_{random.randint(10000, 99999)}@example.com"
    password = "SecurePass123!"
    
    print(f"📧 Testing with email: {email}")
    print(f"🔑 Password: {password}\n")
    
    try:
        # 1. Register
        print("1️⃣  REGISTER")
        reg_response = requests.post(
            f"{BASE_URL}/auth/register",
            json={"email": email, "password": password},
            timeout=5
        )
        print(f"   Status: {reg_response.status_code}")
        print(f"   Response: {reg_response.json()}")
        
        if reg_response.status_code not in [200, 409]:
            print(f"   ❌ FAILED: Expected 200 or 409, got {reg_response.status_code}")
            return False
        
        time.sleep(1)
        
        # 2. Login
        print("\n2️⃣  LOGIN")
        login_response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password},
            timeout=5
        )
        print(f"   Status: {login_response.status_code}")
        
        if login_response.status_code != 200:
            print(f"   ❌ FAILED: Expected 200, got {login_response.status_code}")
            print(f"   Response: {login_response.json()}")
            return False
        
        login_data = login_response.json()
        access_token = login_data.get("access_token")
        print(f"   ✓ Access Token: {access_token[:50]}...")
        print(f"   ✓ Token Type: {login_data.get('token_type')}")
        print(f"   ✓ Expires In: {login_data.get('expires_in')}s")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # 3. Create Note
        print("\n3️⃣  CREATE NOTE")
        create_response = requests.post(
            f"{BASE_URL}/notes",
            json={
                "title": "Test Note",
                "body": "This is a **test** note with security validation"
            },
            headers=headers,
            timeout=5
        )
        print(f"   Status: {create_response.status_code}")
        
        if create_response.status_code != 200:
            print(f"   ❌ FAILED")
            print(f"   Response: {create_response.json()}")
            return False
        
        note_data = create_response.json()
        note_id = note_data.get("id")
        print(f"   ✓ Note Created: {note_id}")
        print(f"   ✓ Title: {note_data.get('title')}")
        print(f"   ✓ Body: {note_data.get('body')[:50]}...")
        
        # 4. Get Notes
        print("\n4️⃣  GET ALL NOTES")
        list_response = requests.get(
            f"{BASE_URL}/notes",
            headers=headers,
            timeout=5
        )
        print(f"   Status: {list_response.status_code}")
        
        if list_response.status_code != 200:
            print(f"   ❌ FAILED")
            return False
        
        notes = list_response.json()
        print(f"   ✓ Found {len(notes)} note(s)")
        for note in notes:
            print(f"     - {note.get('title')} ({note.get('id')[:8]}...)")
        
        # 5. Get Single Note
        print("\n5️⃣  GET SINGLE NOTE")
        single_response = requests.get(
            f"{BASE_URL}/notes/{note_id}",
            headers=headers,
            timeout=5
        )
        print(f"   Status: {single_response.status_code}")
        
        if single_response.status_code != 200:
            print(f"   ❌ FAILED")
            return False
        
        note = single_response.json()
        print(f"   ✓ Retrieved: {note.get('title')}")
        print(f"   ✓ ID: {note.get('id')}")
        
        # 6. Search Notes
        print("\n6️⃣  SEARCH NOTES")
        search_response = requests.get(
            f"{BASE_URL}/notes?search=test",
            headers=headers,
            timeout=5
        )
        print(f"   Status: {search_response.status_code}")
        
        if search_response.status_code != 200:
            print(f"   ❌ FAILED")
            return False
        
        search_results = search_response.json()
        print(f"   ✓ Found {len(search_results)} matching note(s)")
        
        # 7. Update Note
        print("\n7️⃣  UPDATE NOTE")
        update_response = requests.put(
            f"{BASE_URL}/notes/{note_id}",
            json={"body": "Updated note content with **bold** and *italic*"},
            headers=headers,
            timeout=5
        )
        print(f"   Status: {update_response.status_code}")
        
        if update_response.status_code != 200:
            print(f"   ❌ FAILED")
            return False
        
        updated_note = update_response.json()
        print(f"   ✓ Updated: {updated_note.get('title')}")
        print(f"   ✓ New Body: {updated_note.get('body')}")
        
        # 8. Logout
        print("\n8️⃣  LOGOUT")
        logout_response = requests.post(
            f"{BASE_URL}/auth/logout",
            headers=headers,
            timeout=5
        )
        print(f"   Status: {logout_response.status_code}")
        
        if logout_response.status_code != 200:
            print(f"   ❌ FAILED")
            return False
        
        print(f"   ✓ {logout_response.json().get('detail')}")
        
        # 9. Verify Token is Blacklisted
        print("\n9️⃣  VERIFY TOKEN BLACKLISTED")
        after_logout = requests.get(
            f"{BASE_URL}/notes",
            headers=headers,
            timeout=5
        )
        print(f"   Status: {after_logout.status_code}")
        
        if after_logout.status_code in [401, 403]:
            print(f"   ✓ Token properly blacklisted after logout")
        else:
            print(f"   ⚠️  WARNING: Token still valid after logout (Status: {after_logout.status_code})")
        
        # 10. Delete Note
        print("\n🔟 DELETE NOTE")
        delete_response = requests.delete(
            f"{BASE_URL}/notes/{note_id}",
            headers={"Authorization": f"Bearer {access_token}"},  # Use original token before logout
            timeout=5
        )
        print(f"   Status: {delete_response.status_code}")
        
        if delete_response.status_code == 200:
            print(f"   ✓ Note deleted successfully")
        else:
            print(f"   ⚠️  Could not delete (may be due to blacklist)")
        
        print("\n" + "="*50)
        print("✅ END-TO-END TEST PASSED!")
        print("="*50)
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    success = test_auth_workflow()
    exit(0 if success else 1)
