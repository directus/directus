#!/bin/bash
#
# Set field name translations directly in Directus
# Uses the directus_fields.translations column to set Norwegian field names
#

set -e

BASE_URL="${DIRECTUS_URL:-http://localhost:8055}"
TOKEN="${DIRECTUS_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: DIRECTUS_TOKEN not set"
  exit 1
fi

echo "🏷️  Setting field name translations..."
echo "📍 Base URL: $BASE_URL"
echo ""

# Helper function to set field name translation
set_field_name() {
  local collection=$1
  local field=$2
  local norwegian_name=$3

  local response=$(curl -s -w "\n%{http_code}" -X PATCH \
    "$BASE_URL/fields/$collection/$field" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"meta\": {
        \"translations\": [
          {
            \"language\": \"no-NO\",
            \"translation\": \"$norwegian_name\"
          }
        ]
      }
    }")

  local http_code=$(echo "$response" | tail -n1)

  if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 204 ]; then
    echo "✅ $collection.$field → $norwegian_name"
  else
    echo "⚠️  $collection.$field"
  fi
}

# ==================================================
# DEALERSHIP
# ==================================================
echo "📦 Dealership..."

set_field_name "dealership" "dealership_number" "Forhandlernummer (FNR)"
set_field_name "dealership" "dealership_name" "Forhandlernavn"
set_field_name "dealership" "dealership_type" "Forhandlertype"
set_field_name "dealership" "brand" "Merke"
set_field_name "dealership" "parent_dealership_id" "Hovedforhandler"
set_field_name "dealership" "prep_center_id" "Klargjøringssenter"
set_field_name "dealership" "does_own_prep" "Gjør egen klargjøring"
set_field_name "dealership" "brand_colors" "Merkefarger"
set_field_name "dealership" "logo" "Logo"
set_field_name "dealership" "location" "Lokasjon"
set_field_name "dealership" "active" "Aktiv"
set_field_name "dealership" "status" "Status"

echo ""

# ==================================================
# CARS (key fields only for brevity)
# ==================================================
echo "📦 Cars..."

set_field_name "cars" "vin" "VIN (Chassisnummer)"
set_field_name "cars" "license_plate" "Registreringsnummer"
set_field_name "cars" "brand" "Merke"
set_field_name "cars" "model" "Modell"
set_field_name "cars" "dealership_id" "Selgerforhandler"
set_field_name "cars" "prep_center_id" "Klargjøringssenter"
set_field_name "cars" "seller_id" "Selger"
set_field_name "cars" "assigned_mechanic_id" "Tildelt mekaniker"
set_field_name "cars" "assigned_detailer_id" "Tildelt bilpleier"
set_field_name "cars" "car_type" "Biltype"
set_field_name "cars" "status" "Status"
set_field_name "cars" "order_number" "Ordrenummer"

echo ""

# ==================================================
# USERS
# ==================================================
echo "📦 Users..."

set_field_name "directus_users" "dealership_id" "Forhandler"
set_field_name "directus_users" "job_role" "Jobbrolle"
set_field_name "directus_users" "is_productive" "Produktiv rolle"
set_field_name "directus_users" "hours_per_day" "Timer per dag"

echo ""

# ==================================================
# RESOURCE TYPES
# ==================================================
echo "📦 Resource Types..."

set_field_name "resource_types" "code" "Kode"
set_field_name "resource_types" "name" "Navn"
set_field_name "resource_types" "icon" "Ikon"
set_field_name "resource_types" "color" "Farge"
set_field_name "resource_types" "is_productive" "Produktiv ressurs"
set_field_name "resource_types" "bookable" "Kan bookes"
set_field_name "resource_types" "requires_assignment" "Krever tildeling"

echo ""
echo "✅ Field names translated!"
echo ""
echo "🌐 Refresh Directus admin to see Norwegian field names"
