#!/bin/bash

# API Endpoint Test Suite
# Tests all 8 API endpoints for the Secure Notes backend

API_BASE="http://localhost:8000/api/v1"
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counters
PASS=0
FAIL=0

# Helper function to print test results
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -e "${BLUE}Testing:${NC} $name"
    echo "  $method $API_BASE$endpoint"
    
    local response
    local status_code
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [[ "$status_code" == "$expected_status" ]]; then
        echo -e "  ${GREEN}✓ Status: $status_code${NC}"
        echo "  Response: $(echo "$body" | head -c 100)..."
        ((PASS++))
    else
        echo -e "  ${RED}✗ Status: $status_code (expected $expected_status)${NC}"
        echo "  Response: $body"
        ((FAIL++))
    fi
    echo ""
}

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Secure Notes API Test Suite${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Test 1: Register
echo -e "${BLUE}=== AUTHENTICATION TESTS ===${NC}"

# Create a test user email
TEST_USER_EMAIL="securenotestuser_$RANDOM@example.com"
TEST_USER_PASSWORD="SecurePass123!"

# First, register the test user
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}")

test_endpoint "Register User" "POST" "/auth/register" \
    "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}" \
    "200"

# Test 2: Login
test_endpoint "Login User" "POST" "/auth/login" \
    "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}" \
    "200"

# Extract token from login response for subsequent tests
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}")

# Try to extract access token (this might fail if bcrypt is not working)
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    TOKEN="DUMMY_TOKEN_FOR_TESTING"
    echo -e "${YELLOW}Warning: Could not extract token from login response${NC}"
    echo "Using dummy token for remaining tests"
    echo ""
fi

# Test 3: Create Note
echo -e "${BLUE}=== NOTES CRUD TESTS ===${NC}"
test_endpoint "Create Note" "POST" "/notes" \
    '{"title":"Test Note","body":"This is a test note with **bold** and *italic* formatting"}' \
    "200"

# Extract note ID from previous response for PUT/DELETE tests
NOTES_RESPONSE=$(curl -s -X GET "$API_BASE/notes" \
    -H "Authorization: Bearer $TOKEN")
NOTE_ID=$(echo "$NOTES_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$NOTE_ID" ]; then
    NOTE_ID="test-note-id-123"
    echo -e "${YELLOW}Warning: Could not extract note ID${NC}"
fi

# Test 4: Get Notes List
test_endpoint "Get Notes List" "GET" "/notes?search=" \
    "" \
    "200"

# Test 5: Get Single Note
test_endpoint "Get Single Note" "GET" "/notes/$NOTE_ID" \
    "" \
    "200"

# Test 6: Update Note
test_endpoint "Update Note" "PUT" "/notes/$NOTE_ID" \
    '{"title":"Updated Test Note","body":"Updated content with __underline__"}' \
    "200"

# Test 7: Search Notes
test_endpoint "Search Notes" "GET" "/notes?search=test" \
    "" \
    "200"

# Test 8: Delete Note
test_endpoint "Delete Note" "DELETE" "/notes/$NOTE_ID" \
    "" \
    "200"

# Test 9: Logout (bonus)
echo -e "${BLUE}=== SESSION TESTS ===${NC}"
test_endpoint "Logout User" "POST" "/auth/logout" \
    "" \
    "200"

# Summary
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test Results${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Check responses above.${NC}"
    exit 1
fi
