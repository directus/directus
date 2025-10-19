#!/bin/bash
#
# Configure Directus fields to use Norwegian translation keys
# Sets the field.meta.translation property for all fields
#

set -e

BASE_URL="${DIRECTUS_URL:-http://localhost:8055}"
TOKEN="${DIRECTUS_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: DIRECTUS_TOKEN not set"
  exit 1
fi

echo "🔗 Configuring field translation keys..."
echo "📍 Base URL: $BASE_URL"
echo ""

# Helper function to set field translation key
set_field_translation() {
  local collection=$1
  local field=$2
  local translation_key=$3

  local response=$(curl -s -w "\n%{http_code}" -X PATCH \
    "$BASE_URL/fields/$collection/$field" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"meta\": {
        \"translation\": \"$translation_key\"
      }
    }")

  local http_code=$(echo "$response" | tail -n1)

  if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 204 ]; then
    echo "✅ $collection.$field → $translation_key"
  else
    echo "⚠️  $collection.$field (HTTP $http_code)"
  fi
}

# ==================================================
# DEALERSHIP COLLECTION
# ==================================================
echo "📦 Dealership fields..."

set_field_translation "dealership" "dealership_number" "dealership_dealership_number"
set_field_translation "dealership" "dealership_name" "dealership_dealership_name"
set_field_translation "dealership" "dealership_type" "dealership_dealership_type"
set_field_translation "dealership" "brand" "dealership_brand"
set_field_translation "dealership" "parent_dealership_id" "dealership_parent_dealership_id"
set_field_translation "dealership" "prep_center_id" "dealership_prep_center_id"
set_field_translation "dealership" "does_own_prep" "dealership_does_own_prep"
set_field_translation "dealership" "brand_colors" "dealership_brand_colors"
set_field_translation "dealership" "logo" "dealership_logo"
set_field_translation "dealership" "location" "dealership_location"
set_field_translation "dealership" "active" "dealership_active"
set_field_translation "dealership" "status" "dealership_status"

echo ""

# ==================================================
# CARS COLLECTION (key fields)
# ==================================================
echo "📦 Cars fields..."

set_field_translation "cars" "vin" "cars_vin"
set_field_translation "cars" "license_plate" "cars_license_plate"
set_field_translation "cars" "brand" "cars_brand"
set_field_translation "cars" "model" "cars_model"
set_field_translation "cars" "dealership_id" "cars_dealership_id"
set_field_translation "cars" "prep_center_id" "cars_prep_center_id"
set_field_translation "cars" "seller_id" "cars_seller_id"
set_field_translation "cars" "assigned_mechanic_id" "cars_assigned_mechanic_id"
set_field_translation "cars" "assigned_detailer_id" "cars_assigned_detailer_id"
set_field_translation "cars" "car_type" "cars_car_type"
set_field_translation "cars" "status" "cars_status"
set_field_translation "cars" "order_number" "cars_order_number"

echo ""

# ==================================================
# DIRECTUS USERS
# ==================================================
echo "📦 User fields..."

set_field_translation "directus_users" "dealership_id" "directus_users_dealership_id"
set_field_translation "directus_users" "job_role" "directus_users_job_role"
set_field_translation "directus_users" "is_productive" "directus_users_is_productive"
set_field_translation "directus_users" "hours_per_day" "directus_users_hours_per_day"

echo ""

# ==================================================
# RESOURCE TYPES
# ==================================================
echo "📦 Resource types fields..."

set_field_translation "resource_types" "code" "resource_types_code"
set_field_translation "resource_types" "name" "resource_types_name"
set_field_translation "resource_types" "icon" "resource_types_icon"
set_field_translation "resource_types" "color" "resource_types_color"
set_field_translation "resource_types" "is_productive" "resource_types_is_productive"
set_field_translation "resource_types" "bookable" "resource_types_bookable"
set_field_translation "resource_types" "requires_assignment" "resource_types_requires_assignment"

echo ""

# ==================================================
# RESOURCE SHARING
# ==================================================
echo "📦 Resource sharing fields..."

set_field_translation "resource_sharing" "provider_dealership_id" "resource_sharing_provider_dealership_id"
set_field_translation "resource_sharing" "consumer_dealership_id" "resource_sharing_consumer_dealership_id"
set_field_translation "resource_sharing" "resource_type_id" "resource_sharing_resource_type_id"
set_field_translation "resource_sharing" "enabled" "resource_sharing_enabled"
set_field_translation "resource_sharing" "priority" "resource_sharing_priority"
set_field_translation "resource_sharing" "max_hours_per_week" "resource_sharing_max_hours_per_week"

echo ""

# ==================================================
# NOTIFICATIONS
# ==================================================
echo "📦 Notifications fields..."

set_field_translation "notifications" "user_id" "notifications_user_id"
set_field_translation "notifications" "car_id" "notifications_car_id"
set_field_translation "notifications" "type" "notifications_type"
set_field_translation "notifications" "message" "notifications_message"
set_field_translation "notifications" "read" "notifications_read"

echo ""

# ==================================================
# RESOURCE BOOKINGS
# ==================================================
echo "📦 Resource bookings fields..."

set_field_translation "resource_bookings" "dealership_id" "resource_bookings_dealership_id"
set_field_translation "resource_bookings" "car_id" "resource_bookings_car_id"
set_field_translation "resource_bookings" "resource_type_id" "resource_bookings_resource_type_id"
set_field_translation "resource_bookings" "assigned_user_id" "resource_bookings_assigned_user_id"
set_field_translation "resource_bookings" "booking_date" "resource_bookings_booking_date"
set_field_translation "resource_bookings" "status" "resource_bookings_status"

echo ""

# ==================================================
# RESOURCE CAPACITIES
# ==================================================
echo "📦 Resource capacities fields..."

set_field_translation "resource_capacities" "dealership_id" "resource_capacities_dealership_id"
set_field_translation "resource_capacities" "resource_type_id" "resource_capacities_resource_type_id"
set_field_translation "resource_capacities" "user_id" "resource_capacities_user_id"
set_field_translation "resource_capacities" "date" "resource_capacities_date"

echo ""
echo "✅ Field translation keys configured!"
echo ""
echo "📝 Note: Collection names must be configured separately in Directus Settings > Data Model"
