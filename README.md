# 🦊 Fluffy Fox Status

A lightweight hardware and system monitoring addon for **Dune Docker Console**.

Fluffy Fox Status provides a simple dashboard for viewing server hardware sensor information and system status directly inside Dune Docker Console.

---

## ✨ Features

### 🌡️ Temperature Monitoring

Displays hardware temperature information provided by Linux `lm-sensors`.

Supported sensor data depends on the hardware and kernel drivers available on the host.

Examples may include:

- CPU package temperature
- Individual CPU core temperatures
- Network adapter temperatures
- ACPI temperature sensors
- Other hardware sensors exposed through `lm-sensors`

The addon does **not** invent or simulate temperature values when running inside Dune Docker Console.

---

### 🖥️ System Status

The dashboard provides system status information including:

- Server status
- Sensor availability
- Memory usage
- Swap usage
- System load
- System uptime

---

### 🔄 Manual Refresh

The dashboard includes a refresh control for requesting the latest available monitoring information.

---

### 🎨 Custom Dashboard

Fluffy Fox Status uses a dark monitoring-style interface with:

- Responsive sensor cards
- Temperature status indicators
- System status cards
- Custom Fluffy Fox background artwork
- Responsive layout for different screen sizes

---

## 🧰 Requirements

Fluffy Fox Status is designed to run inside **Dune Docker Console**.

The host running the Dune Docker environment should have:

- Linux
- `lm-sensors`
- Appropriate kernel hardware-monitoring drivers

### Installing `lm-sensors`

On Ubuntu/Debian:

```bash
sudo apt update
sudo apt install lm-sensors