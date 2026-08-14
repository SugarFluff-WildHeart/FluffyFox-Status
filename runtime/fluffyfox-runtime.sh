#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# 🦊 Fluffy Fox Status Runtime
# ============================================================
#
# Collects Linux host/system telemetry for the Fluffy Fox
# Status addon.
#
# Output: ONE JSON object to stdout.
#
# No external JSON parser is required.
#
# Supported data:
#   - CPU / system temperatures
#   - Memory usage
#   - Swap usage
#   - Load average
#   - System uptime
#   - NVIDIA GPU temperature (when nvidia-smi exists)
#
# ============================================================


# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------

json_escape() {
    local value="${1:-}"

    value="${value//\\/\\\\}"
    value="${value//\"/\\\"}"
    value="${value//$'\n'/\\n}"
    value="${value//$'\r'/\\r}"
    value="${value//$'\t'/\\t}"

    printf '%s' "$value"
}


json_number() {
    local value="${1:-0}"

    if [[ "$value" =~ ^-?[0-9]+([.][0-9]+)?$ ]]; then
        printf '%s' "$value"
    else
        printf '0'
    fi
}


# ------------------------------------------------------------
# Memory
# ------------------------------------------------------------

read_memory() {

    local total_kb
    local available_kb
    local used_kb
    local percent

    total_kb="$(
        awk '
            /^MemTotal:/ {
                print $2
                exit
            }
        ' /proc/meminfo
    )"

    available_kb="$(
        awk '
            /^MemAvailable:/ {
                print $2
                exit
            }
        ' /proc/meminfo
    )"

    total_kb="${total_kb:-0}"
    available_kb="${available_kb:-0}"

    used_kb=$((total_kb - available_kb))

    if (( total_kb > 0 )); then
        percent="$(
            awk -v used="$used_kb" -v total="$total_kb" \
                'BEGIN {
                    printf "%.1f", (used / total) * 100
                }'
        )"
    else
        percent="0.0"
    fi

    printf '%s' \
        "\"memory\":{" \
        "\"total_kb\":$(json_number "$total_kb")," \
        "\"available_kb\":$(json_number "$available_kb")," \
        "\"used_kb\":$(json_number "$used_kb")," \
        "\"percent\":$(json_number "$percent")" \
        "}"
}


# ------------------------------------------------------------
# Swap
# ------------------------------------------------------------

read_swap() {

    local total_kb
    local free_kb
    local used_kb
    local percent

    total_kb="$(
        awk '
            /^SwapTotal:/ {
                print $2
                exit
            }
        ' /proc/meminfo
    )"

    free_kb="$(
        awk '
            /^SwapFree:/ {
                print $2
                exit
            }
        ' /proc/meminfo
    )"

    total_kb="${total_kb:-0}"
    free_kb="${free_kb:-0}"

    used_kb=$((total_kb - free_kb))

    if (( total_kb > 0 )); then
        percent="$(
            awk -v used="$used_kb" -v total="$total_kb" \
                'BEGIN {
                    printf "%.1f", (used / total) * 100
                }'
        )"
    else
        percent="0.0"
    fi

    printf '%s' \
        "\"swap\":{" \
        "\"total_kb\":$(json_number "$total_kb")," \
        "\"free_kb\":$(json_number "$free_kb")," \
        "\"used_kb\":$(json_number "$used_kb")," \
        "\"percent\":$(json_number "$percent")" \
        "}"
}


# ------------------------------------------------------------
# Load Average
# ------------------------------------------------------------

read_load() {

    local one
    local five
    local fifteen

    read -r one five fifteen _ < /proc/loadavg

    one="${one:-0}"
    five="${five:-0}"
    fifteen="${fifteen:-0}"

    printf '%s' \
        "\"load\":{" \
        "\"one\":$(json_number "$one")," \
        "\"five\":$(json_number "$five")," \
        "\"fifteen\":$(json_number "$fifteen")" \
        "}"
}


# ------------------------------------------------------------
# Uptime
# ------------------------------------------------------------

read_uptime() {

    local uptime_seconds

    uptime_seconds="$(
        awk '
            {
                printf "%.0f", $1
                exit
            }
        ' /proc/uptime
    )"

    uptime_seconds="${uptime_seconds:-0}"

    printf '"uptime_seconds":%s' \
        "$(json_number "$uptime_seconds")"
}


# ------------------------------------------------------------
# Temperature sensors
# ------------------------------------------------------------

declare -a TEMPERATURES=()


add_temperature() {

    local name="$1"
    local temperature="$2"

    [[ -n "$name" ]] || return 0
    [[ -n "$temperature" ]] || return 0

    if ! [[ "$temperature" =~ ^-?[0-9]+([.][0-9]+)?$ ]]; then
        return 0
    fi

    TEMPERATURES+=(
        "$(json_escape "$name")|$(json_number "$temperature")"
    )
}


read_hwmon_temperatures() {

    local hwmon_dir
    local input_file
    local label_file
    local name_file

    local raw
    local temp
    local label
    local chip_name

    shopt -s nullglob

    for hwmon_dir in /sys/class/hwmon/hwmon*; do

        name_file="$hwmon_dir/name"

        chip_name=""

        if [[ -r "$name_file" ]]; then
            chip_name="$(< "$name_file")"
        fi

        for input_file in "$hwmon_dir"/temp*_input; do

            [[ -r "$input_file" ]] || continue

            raw="$(< "$input_file")"

            [[ "$raw" =~ ^-?[0-9]+$ ]] || continue

            # hwmon temperatures are normally millidegrees Celsius.
            temp="$(
                awk -v value="$raw" '
                    BEGIN {
                        printf "%.1f", value / 1000
                    }
                '
            )"

            label_file="${input_file%_input}_label"

            label=""

            if [[ -r "$label_file" ]]; then
                label="$(< "$label_file")"
            fi

            if [[ -z "$label" ]]; then

                label="$(basename "$input_file")"

                label="${label%_input}"

                if [[ -n "$chip_name" ]]; then
                    label="${chip_name} ${label}"
                fi

            fi

            add_temperature "$label" "$temp"

        done

    done

    shopt -u nullglob
}


# ------------------------------------------------------------
# NVIDIA GPU temperature
# ------------------------------------------------------------

read_nvidia_temperature() {

    command -v nvidia-smi >/dev/null 2>&1 || return 0

    local gpu_index=0
    local temperature

    while IFS= read -r temperature; do

        [[ -n "$temperature" ]] || continue

        if [[ "$temperature" =~ ^[0-9]+$ ]]; then

            add_temperature \
                "GPU ${gpu_index}" \
                "${temperature}.0"

            gpu_index=$((gpu_index + 1))

        fi

    done < <(
        nvidia-smi \
            --query-gpu=temperature.gpu \
            --format=csv,noheader,nounits \
            2>/dev/null || true
    )
}


# ------------------------------------------------------------
# Fallback `sensors` temperature reader
# ------------------------------------------------------------

read_sensors_command() {

    command -v sensors >/dev/null 2>&1 || return 0

    local line
    local name
    local temperature

    while IFS= read -r line; do

        # Match lines containing:
        #
        #   Core 0:        +42.0°C
        #   Package id 0:  +45.0°C
        #
        if [[ "$line" =~ ^[[:space:]]*([^:]+):[[:space:]]*\+?(-?[0-9]+([.][0-9]+)?)°C ]]; then

            name="${BASH_REMATCH[1]}"
            temperature="${BASH_REMATCH[2]}"

            name="$(echo "$name" | sed 's/[[:space:]]\+$//')"

            add_temperature \
                "$name" \
                "$temperature"

        fi

    done < <(
        sensors 2>/dev/null || true
    )
}


# ------------------------------------------------------------
# Temperature JSON
# ------------------------------------------------------------

read_temperatures() {

    TEMPERATURES=()

    # Preferred source:
    # Linux hwmon interface.
    read_hwmon_temperatures

    # GPU-specific source.
    read_nvidia_temperature

    # Fallback for systems exposing sensors through lm-sensors.
    if (( ${#TEMPERATURES[@]} == 0 )); then
        read_sensors_command
    fi

    printf '"temperatures":['

    local first=1
    local item
    local name
    local temperature

    for item in "${TEMPERATURES[@]}"; do

        name="${item%%|*}"
        temperature="${item#*|}"

        if (( first == 0 )); then
            printf ','
        fi

        printf \
            '{"name":"%s","temperature":%s}' \
            "$name" \
            "$temperature"

        first=0

    done

    printf ']'
}


# ------------------------------------------------------------
# Main JSON response
# ------------------------------------------------------------

main() {

    printf '{'

    printf '"version":1,'

    read_temperatures

    printf ','

    read_memory

    printf ','

    read_swap

    printf ','

    read_load

    printf ','

    read_uptime

    printf '}'

    printf '\n'
}


main "$@"