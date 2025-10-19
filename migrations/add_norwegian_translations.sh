#!/bin/bash
#
# Add Norwegian (no-NO) translations to Directus
# Translates all collection names, field labels, and UI text
#

set -e

BASE_URL="${DIRECTUS_URL:-http://localhost:8055}"
TOKEN="${DIRECTUS_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: DIRECTUS_TOKEN not set"
  echo "Run: source directus_token.env"
  exit 1
fi

echo "🇳🇴 Adding Norwegian translations..."
echo "📍 Base URL: $BASE_URL"
echo ""

# Helper function to add/update translation
add_translation() {
  local key=$1
  local value=$2

  # Try to create translation (will fail if exists)
  local response=$(curl -s -w "\n%{http_code}" -X POST \
    "$BASE_URL/translations" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"language\": \"no-NO\",
      \"key\": \"$key\",
      \"value\": \"$value\"
    }")

  local http_code=$(echo "$response" | tail -n1)

  if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 204 ]; then
    echo "✅ $key → $value"
  elif [ "$http_code" -eq 400 ]; then
    # Translation exists, try to update it
    # We need to find the translation ID first
    local trans_id=$(curl -s -X GET \
      "$BASE_URL/translations?filter[language][_eq]=no-NO&filter[key][_eq]=$key&fields=id" \
      -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id // empty')

    if [ -n "$trans_id" ]; then
      curl -s -X PATCH \
        "$BASE_URL/translations/$trans_id" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"value\": \"$value\"}" > /dev/null
      echo "🔄 $key → $value (updated)"
    else
      echo "⚠️  $key (already exists, couldn't update)"
    fi
  else
    echo "❌ $key (HTTP $http_code)"
  fi
}

# ==================================================
# COLLECTION NAMES
# ==================================================
echo "📦 Translating collection names..."

add_translation "collection_names_dealership" "Forhandlere"
add_translation "collection_names_cars" "Biler"
add_translation "collection_names_resource_types" "Ressurstyper"
add_translation "collection_names_resource_sharing" "Ressursdeling"
add_translation "collection_names_resource_bookings" "Ressursbookinger"
add_translation "collection_names_resource_capacities" "Ressurskapasitet"
add_translation "collection_names_notifications" "Varsler"

echo ""

# ==================================================
# DEALERSHIP FIELDS
# ==================================================
echo "📦 Translating dealership fields..."

add_translation "dealership_dealership_number" "Forhandlernummer (FNR)"
add_translation "dealership_dealership_name" "Forhandlernavn"
add_translation "dealership_dealership_type" "Forhandlertype"
add_translation "dealership_brand" "Merke"
add_translation "dealership_parent_dealership_id" "Hovedforhandler"
add_translation "dealership_prep_center_id" "Klargjøringssenter"
add_translation "dealership_does_own_prep" "Gjør egen klargjøring"
add_translation "dealership_brand_colors" "Merkefarger"
add_translation "dealership_logo" "Logo"
add_translation "dealership_location" "Lokasjon"
add_translation "dealership_active" "Aktiv"
add_translation "dealership_status" "Status"
add_translation "dealership_created_at" "Opprettet"
add_translation "dealership_updated_at" "Oppdatert"

echo ""

# ==================================================
# CARS FIELDS
# ==================================================
echo "📦 Translating cars fields..."

add_translation "cars_vin" "VIN (Chassisnummer)"
add_translation "cars_license_plate" "Registreringsnummer"
add_translation "cars_brand" "Merke"
add_translation "cars_model" "Modell"
add_translation "cars_year" "Årsmodell"
add_translation "cars_color" "Farge"
add_translation "cars_dealership_id" "Selgerforhandler"
add_translation "cars_prep_center_id" "Klargjøringssenter"
add_translation "cars_seller_id" "Selger"
add_translation "cars_assigned_mechanic_id" "Tildelt mekaniker"
add_translation "cars_assigned_detailer_id" "Tildelt bilpleier"

add_translation "cars_car_type" "Biltype"
add_translation "cars_status" "Status"
add_translation "cars_order_number" "Ordrenummer"

# Timestamps
add_translation "cars_registered_at" "Registrert dato"
add_translation "cars_parts_ordered_seller_at" "Deler bestilt (selger)"
add_translation "cars_parts_arrived_seller_at" "Deler ankommet (selger)"
add_translation "cars_parts_ordered_prep_at" "Deler bestilt (klargjøring)"
add_translation "cars_parts_arrived_prep_at" "Deler ankommet (klargjøring)"
add_translation "cars_arrived_prep_center_at" "Ankommet klargjøring"
add_translation "cars_inspection_completed_at" "Mottakskontroll fullført"
add_translation "cars_inspection_approved" "Mottakskontroll godkjent"
add_translation "cars_inspection_notes" "Mottakskontroll notater"

# Scheduling
add_translation "cars_scheduled_technical_date" "Planlagt teknisk dato"
add_translation "cars_scheduled_technical_time" "Planlagt teknisk tid"
add_translation "cars_technical_started_at" "Teknisk startet"
add_translation "cars_technical_completed_at" "Teknisk fullført"
add_translation "cars_scheduled_cosmetic_date" "Planlagt kosmetisk dato"
add_translation "cars_scheduled_cosmetic_time" "Planlagt kosmetisk tid"
add_translation "cars_cosmetic_started_at" "Kosmetisk startet"
add_translation "cars_cosmetic_completed_at" "Kosmetisk fullført"

# Completion
add_translation "cars_ready_for_delivery_at" "Klar for levering"
add_translation "cars_delivered_to_dealership_at" "Levert til forhandler"
add_translation "cars_sold_at" "Solgt dato"
add_translation "cars_delivered_to_customer_at" "Levert til kunde"
add_translation "cars_archived_at" "Arkivert"

# Customer
add_translation "cars_customer_name" "Kundenavn"
add_translation "cars_customer_phone" "Kundetelefon"
add_translation "cars_customer_email" "Kunde e-post"

# Accessories and pricing
add_translation "cars_accessories" "Tilbehør"
add_translation "cars_estimated_technical_hours" "Estimert timer teknisk"
add_translation "cars_estimated_cosmetic_hours" "Estimert timer kosmetisk"
add_translation "cars_purchase_price" "Innkjøpspris"
add_translation "cars_sale_price" "Salgspris"
add_translation "cars_prep_cost" "Klargjøringskostnad"

# Notes
add_translation "cars_seller_notes" "Selger notater"
add_translation "cars_parts_notes" "Deler notater"
add_translation "cars_technical_notes" "Tekniske notater"
add_translation "cars_cosmetic_notes" "Kosmetiske notater"

echo ""

# ==================================================
# DIRECTUS USERS FIELDS
# ==================================================
echo "📦 Translating user fields..."

add_translation "directus_users_dealership_id" "Forhandler"
add_translation "directus_users_job_role" "Jobbrolle"
add_translation "directus_users_is_productive" "Produktiv rolle"
add_translation "directus_users_hours_per_day" "Timer per dag"
add_translation "directus_users_first_name" "Fornavn"
add_translation "directus_users_last_name" "Etternavn"
add_translation "directus_users_email" "E-post"
add_translation "directus_users_password" "Passord"
add_translation "directus_users_location" "Lokasjon"
add_translation "directus_users_title" "Tittel"
add_translation "directus_users_description" "Beskrivelse"
add_translation "directus_users_avatar" "Profilbilde"
add_translation "directus_users_language" "Språk"
add_translation "directus_users_theme" "Tema"
add_translation "directus_users_status" "Status"

echo ""

# ==================================================
# RESOURCE TYPES FIELDS
# ==================================================
echo "📦 Translating resource types fields..."

add_translation "resource_types_code" "Kode"
add_translation "resource_types_name" "Navn"
add_translation "resource_types_icon" "Ikon"
add_translation "resource_types_color" "Farge"
add_translation "resource_types_is_productive" "Produktiv ressurs"
add_translation "resource_types_bookable" "Kan bookes"
add_translation "resource_types_requires_assignment" "Krever tildeling"
add_translation "resource_types_created_at" "Opprettet"
add_translation "resource_types_updated_at" "Oppdatert"

echo ""

# ==================================================
# RESOURCE SHARING FIELDS
# ==================================================
echo "📦 Translating resource sharing fields..."

add_translation "resource_sharing_provider_dealership_id" "Tilbyder (forhandler)"
add_translation "resource_sharing_consumer_dealership_id" "Forbruker (forhandler)"
add_translation "resource_sharing_resource_type_id" "Ressurstype"
add_translation "resource_sharing_enabled" "Aktivert"
add_translation "resource_sharing_priority" "Prioritet"
add_translation "resource_sharing_max_hours_per_week" "Maks timer per uke"
add_translation "resource_sharing_created_at" "Opprettet"
add_translation "resource_sharing_updated_at" "Oppdatert"

echo ""

# ==================================================
# RESOURCE BOOKINGS FIELDS
# ==================================================
echo "📦 Translating resource bookings fields..."

add_translation "resource_bookings_dealership_id" "Forhandler"
add_translation "resource_bookings_car_id" "Bil"
add_translation "resource_bookings_resource_type_id" "Ressurstype"
add_translation "resource_bookings_assigned_user_id" "Tildelt bruker"
add_translation "resource_bookings_booking_date" "Bookingdato"
add_translation "resource_bookings_estimated_hours" "Estimerte timer"
add_translation "resource_bookings_actual_hours" "Faktiske timer"
add_translation "resource_bookings_status" "Status"
add_translation "resource_bookings_notes" "Notater"
add_translation "resource_bookings_created_at" "Opprettet"
add_translation "resource_bookings_updated_at" "Oppdatert"

echo ""

# ==================================================
# RESOURCE CAPACITIES FIELDS
# ==================================================
echo "📦 Translating resource capacities fields..."

add_translation "resource_capacities_dealership_id" "Forhandler"
add_translation "resource_capacities_resource_type_id" "Ressurstype"
add_translation "resource_capacities_user_id" "Bruker"
add_translation "resource_capacities_date" "Dato"
add_translation "resource_capacities_available_hours" "Tilgjengelige timer"
add_translation "resource_capacities_booked_hours" "Bookede timer"
add_translation "resource_capacities_created_at" "Opprettet"
add_translation "resource_capacities_updated_at" "Oppdatert"

echo ""

# ==================================================
# NOTIFICATIONS FIELDS
# ==================================================
echo "📦 Translating notifications fields..."

add_translation "notifications_user_id" "Bruker"
add_translation "notifications_car_id" "Bil"
add_translation "notifications_type" "Type"
add_translation "notifications_message" "Melding"
add_translation "notifications_read" "Lest"
add_translation "notifications_created_at" "Opprettet"

echo ""

# ==================================================
# COMMON STATUS VALUES
# ==================================================
echo "📦 Translating common status values..."

add_translation "status_draft" "Utkast"
add_translation "status_published" "Publisert"
add_translation "status_archived" "Arkivert"

echo ""

# ==================================================
# CAR STATUS VALUES
# ==================================================
echo "📦 Translating car status values..."

# Nybil statuser
add_translation "car_status_ny_ordre" "Ny ordre"
add_translation "car_status_deler_bestilt_selgerforhandler" "Deler bestilt (selger)"
add_translation "car_status_deler_ankommet_selgerforhandler" "Deler ankommet (selger)"
add_translation "car_status_deler_bestilt_klargjoring" "Deler bestilt (klargjøring)"
add_translation "car_status_deler_ankommet_klargjoring" "Deler ankommet (klargjøring)"
add_translation "car_status_på_vei_til_klargjoring" "På vei til klargjøring"
add_translation "car_status_ankommet_klargjoring" "Ankommet klargjøring"
add_translation "car_status_mottakskontroll_pågår" "Mottakskontroll pågår"
add_translation "car_status_mottakskontroll_godkjent" "Mottakskontroll godkjent"
add_translation "car_status_mottakskontroll_avvik" "Mottakskontroll avvik"
add_translation "car_status_venter_booking" "Venter booking"
add_translation "car_status_planlagt_teknisk" "Planlagt teknisk"
add_translation "car_status_teknisk_pågår" "Teknisk pågår"
add_translation "car_status_teknisk_ferdig" "Teknisk ferdig"
add_translation "car_status_planlagt_kosmetisk" "Planlagt kosmetisk"
add_translation "car_status_kosmetisk_pågår" "Kosmetisk pågår"
add_translation "car_status_kosmetisk_ferdig" "Kosmetisk ferdig"
add_translation "car_status_klar_for_levering" "Klar for levering"
add_translation "car_status_levert_til_selgerforhandler" "Levert til selgerforhandler"
add_translation "car_status_solgt_til_kunde" "Solgt til kunde"
add_translation "car_status_levert_til_kunde" "Levert til kunde"
add_translation "car_status_arkivert" "Arkivert"

# Bruktbil statuser
add_translation "car_status_innbytte_registrert" "Innbytte registrert"
add_translation "car_status_vurdert_for_salg" "Vurdert for salg"
add_translation "car_status_til_klargjoring" "Til klargjøring"
add_translation "car_status_klar_for_salg" "Klar for salg"
add_translation "car_status_reservert" "Reservert"

echo ""

# ==================================================
# BOOKING STATUS VALUES
# ==================================================
echo "📦 Translating booking status values..."

add_translation "booking_status_planned" "Planlagt"
add_translation "booking_status_in_progress" "Pågår"
add_translation "booking_status_completed" "Fullført"
add_translation "booking_status_cancelled" "Kansellert"

echo ""

# ==================================================
# SYSTEM TEXT
# ==================================================
echo "📦 Translating system text..."

add_translation "created" "Opprettet"
add_translation "updated" "Oppdatert"
add_translation "created_at" "Opprettet dato"
add_translation "updated_at" "Oppdatert dato"
add_translation "id" "ID"
add_translation "search" "Søk"
add_translation "filter" "Filter"
add_translation "sort" "Sorter"
add_translation "save" "Lagre"
add_translation "cancel" "Avbryt"
add_translation "delete" "Slett"
add_translation "edit" "Rediger"
add_translation "create" "Opprett"
add_translation "view" "Vis"

echo ""
echo "✅ Norwegian translations added!"
echo ""
echo "🌐 Change language in admin: User Menu > Norwegian (Bokmål)"
