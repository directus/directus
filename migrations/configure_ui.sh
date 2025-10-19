#!/bin/bash
#
# Configure Directus UI for DirectApp
# Issue #22: Configure collection interfaces, displays, and Norwegian translations
#
# This script uses the Directus API to configure field metadata that cannot
# be reliably set via SQL migrations.
#

set -e

# Configuration
BASE_URL="${DIRECTUS_URL:-http://localhost:8055}"
TOKEN="${DIRECTUS_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: DIRECTUS_TOKEN not set"
  echo "Run: source directus_token.env"
  exit 1
fi

echo "🔧 Configuring Directus UI..."
echo "📍 Base URL: $BASE_URL"
echo ""

# Helper function to update field configuration
update_field() {
  local collection=$1
  local field=$2
  local interface=$3
  local display=$4
  local options=$5
  local special=$6

  local payload=$(cat <<EOF
{
  "meta": {
    "interface": "$interface",
    "display": "$display"
    $([ -n "$options" ] && echo ", \"options\": $options")
    $([ -n "$special" ] && echo ", \"special\": $special")
  }
}
EOF
)

  local response=$(curl -s -w "\n%{http_code}" -X PATCH \
    "$BASE_URL/fields/$collection/$field" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload")

  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')

  if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 204 ]; then
    echo "✅ $collection.$field"
  else
    echo "❌ $collection.$field (HTTP $http_code)"
    echo "   $body" | jq -r '.errors[0].message // .message // .' 2>/dev/null || echo "   $body"
  fi
}

# ==================================================
# DEALERSHIP COLLECTION
# ==================================================
echo "📦 Configuring dealership collection..."

update_field "dealership" "dealership_number" \
  "input" "formatted-value" \
  '{"placeholder": "FNR (f.eks. 490)"}'

update_field "dealership" "dealership_name" \
  "input" "formatted-value" \
  '{"placeholder": "Forhandlernavn"}'

update_field "dealership" "dealership_type" \
  "select-dropdown" "labels" \
  '{"choices": [
    {"text": "Fullskala forhandler", "value": "fullskala"},
    {"text": "Klargjøringssenter", "value": "klargjøringssenter"},
    {"text": "Verksted", "value": "verksted"},
    {"text": "Outlet", "value": "outlet"}
  ]}'

update_field "dealership" "brand" \
  "select-dropdown" "labels" \
  '{"choices": [
    {"text": "VW", "value": "VW"},
    {"text": "Audi", "value": "Audi"},
    {"text": "Skoda", "value": "Skoda"},
    {"text": "Nissan", "value": "Nissan"},
    {"text": "MG", "value": "MG"},
    {"text": "Seres", "value": "Seres"},
    {"text": "Subaru", "value": "Subaru"},
    {"text": "Multi", "value": "Multi"}
  ]}'

update_field "dealership" "parent_dealership_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{dealership_number}} - {{dealership_name}}"}' \
  '["uuid"]'

update_field "dealership" "prep_center_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{dealership_number}} - {{dealership_name}}"}' \
  '["uuid"]'

update_field "dealership" "does_own_prep" \
  "boolean" "boolean" \
  '{"label": "Gjør egen klargjøring"}'

update_field "dealership" "brand_colors" \
  "input-code" "raw" \
  '{"language": "json"}' \
  '["cast-json"]'

update_field "dealership" "logo" \
  "file-image" "image" \
  '{}' \
  '["file"]'

update_field "dealership" "location" \
  "input" "formatted-value" \
  '{"placeholder": "By/lokasjon"}'

update_field "dealership" "active" \
  "boolean" "boolean" \
  '{}'

echo ""

# ==================================================
# CARS COLLECTION
# ==================================================
echo "📦 Configuring cars collection..."

update_field "cars" "vin" \
  "input" "formatted-value" \
  '{"placeholder": "17-tegn VIN"}'

update_field "cars" "license_plate" \
  "input" "formatted-value" \
  '{"placeholder": "Registreringsnummer"}'

update_field "cars" "brand" \
  "input" "formatted-value" \
  '{"placeholder": "Bilmerke"}'

update_field "cars" "model" \
  "input" "formatted-value" \
  '{"placeholder": "Modell"}'

update_field "cars" "dealership_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{dealership_number}} - {{dealership_name}}"}' \
  '["uuid"]'

update_field "cars" "prep_center_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{dealership_number}} - {{dealership_name}}"}' \
  '["uuid"]'

update_field "cars" "seller_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{first_name}} {{last_name}} ({{email}})"}' \
  '["uuid"]'

update_field "cars" "assigned_mechanic_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{first_name}} {{last_name}}"}' \
  '["uuid"]'

update_field "cars" "assigned_detailer_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{first_name}} {{last_name}}"}' \
  '["uuid"]'

update_field "cars" "car_type" \
  "select-dropdown" "labels" \
  '{"choices": [
    {"text": "Nybil", "value": "nybil"},
    {"text": "Bruktbil", "value": "bruktbil"}
  ]}'

update_field "cars" "status" \
  "select-dropdown" "labels" \
  '{"allowOther": false}'

echo ""

# ==================================================
# DIRECTUS_USERS COLLECTION
# ==================================================
echo "📦 Configuring directus_users collection..."

update_field "directus_users" "dealership_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{dealership_number}} - {{dealership_name}}"}' \
  '["uuid"]'

update_field "directus_users" "job_role" \
  "select-dropdown" "labels" \
  '{"choices": [
    {"text": "Daglig leder", "value": "daglig_leder"},
    {"text": "Salgsjef", "value": "salgsjef"},
    {"text": "Nybilselger", "value": "nybilselger"},
    {"text": "Bruktbilselger", "value": "bruktbilselger"},
    {"text": "Kundemottaker/Booking", "value": "kundemottaker"},
    {"text": "Garantimedarbeider", "value": "garantimedarbeider"},
    {"text": "Mottakskontrollør", "value": "mottakskontrollør"},
    {"text": "Delelager", "value": "delelager"},
    {"text": "Mekaniker", "value": "mekaniker"},
    {"text": "Bilpleiespesialist", "value": "bilpleiespesialist"},
    {"text": "Admin", "value": "admin"}
  ]}'

update_field "directus_users" "is_productive" \
  "boolean" "boolean" \
  '{"label": "Produktiv rolle"}'

update_field "directus_users" "hours_per_day" \
  "input" "formatted-value" \
  '{"placeholder": "Timer per dag"}'

echo ""

# ==================================================
# RESOURCE COLLECTIONS
# ==================================================
echo "📦 Configuring resource_types collection..."

update_field "resource_types" "code" \
  "input" "formatted-value" \
  '{"placeholder": "Unik kode"}'

update_field "resource_types" "name" \
  "input" "formatted-value" \
  '{"placeholder": "Visningsnavn"}'

update_field "resource_types" "icon" \
  "select-icon" "formatted-value" \
  '{}'

update_field "resource_types" "color" \
  "select-color" "color" \
  '{}'

update_field "resource_types" "is_productive" \
  "boolean" "boolean" \
  '{"label": "Produktiv ressurs"}'

update_field "resource_types" "bookable" \
  "boolean" "boolean" \
  '{"label": "Kan bookes"}'

update_field "resource_types" "requires_assignment" \
  "boolean" "boolean" \
  '{"label": "Krever tildeling"}'

echo ""
echo "📦 Configuring resource_sharing collection..."

update_field "resource_sharing" "provider_dealership_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{dealership_number}} - {{dealership_name}}"}' \
  '["uuid"]'

update_field "resource_sharing" "consumer_dealership_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{dealership_number}} - {{dealership_name}}"}' \
  '["uuid"]'

update_field "resource_sharing" "resource_type_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{name}}"}' \
  '["uuid"]'

update_field "resource_sharing" "enabled" \
  "boolean" "boolean" \
  '{"label": "Aktivert"}'

update_field "resource_sharing" "priority" \
  "input" "formatted-value" \
  '{"placeholder": "1=høyest"}'

update_field "resource_sharing" "max_hours_per_week" \
  "input" "formatted-value" \
  '{"placeholder": "Timer per uke"}'

echo ""
echo "📦 Configuring notifications collection..."

update_field "notifications" "user_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{first_name}} {{last_name}}"}' \
  '["uuid"]'

update_field "notifications" "car_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{brand}} {{model}} ({{vin}})"}' \
  '["uuid"]'

update_field "notifications" "type" \
  "select-dropdown" "labels" \
  '{"allowOther": false}'

update_field "notifications" "read" \
  "boolean" "boolean" \
  '{"label": "Lest"}'

echo ""
echo "📦 Configuring resource_bookings collection..."

update_field "resource_bookings" "dealership_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{dealership_number}} - {{dealership_name}}"}' \
  '["uuid"]'

update_field "resource_bookings" "car_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{brand}} {{model}} ({{vin}})"}' \
  '["uuid"]'

update_field "resource_bookings" "resource_type_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{name}}"}' \
  '["uuid"]'

update_field "resource_bookings" "assigned_user_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{first_name}} {{last_name}}"}' \
  '["uuid"]'

update_field "resource_bookings" "booking_date" \
  "datetime" "datetime" \
  '{}' \
  '["date"]'

update_field "resource_bookings" "status" \
  "select-dropdown" "labels" \
  '{"choices": [
    {"text": "Planlagt", "value": "planned"},
    {"text": "Pågår", "value": "in_progress"},
    {"text": "Fullført", "value": "completed"},
    {"text": "Kansellert", "value": "cancelled"}
  ]}'

echo ""
echo "📦 Configuring resource_capacities collection..."

update_field "resource_capacities" "dealership_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{dealership_number}} - {{dealership_name}}"}' \
  '["uuid"]'

update_field "resource_capacities" "resource_type_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{name}}"}' \
  '["uuid"]'

update_field "resource_capacities" "user_id" \
  "select-dropdown-m2o" "related-values" \
  '{"template": "{{first_name}} {{last_name}}"}' \
  '["uuid"]'

update_field "resource_capacities" "date" \
  "datetime" "datetime" \
  '{}' \
  '["date"]'

echo ""
echo "✅ UI configuration complete!"
echo ""
echo "🌐 View in Directus: $BASE_URL/admin/content/dealership"
