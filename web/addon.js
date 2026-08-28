(function () {
    "use strict";

    /*
     * =========================================================
     * FLUFFY FOX STATUS
     * =========================================================
     *
     * Hardware Status Bridge V3
     *
     * This addon uses ONLY:
     *
     *     server.hardware.status
     *
     * No ops.health access is used here.
     *
     * V3 host telemetry supported:
     *
     *   - sampled_at
     *   - temperatures
     *   - fans
     *   - CPU identification / utilization / topology
     *   - storage identification / capacity
     *   - filesystems
     *   - network counters / state / speed
     *   - memory
     *   - swap
     *   - load
     *   - uptime
     *
     * Telemetry is kept in memory only.
     * No hardware telemetry is written to localStorage.
     *
     * =========================================================
     */


    /*
     * =========================================================
     * DOM HELPER
     * =========================================================
     */

    const $ = selector =>
        document.querySelector(selector);


    /*
     * =========================================================
     * DOM REFERENCES
     * =========================================================
     */

    const sensorGrid =
        $("#sensor-grid");

    const temperatureSection =
        $("#temperature-section");

    const lastUpdate =
        $("#last-update");

    const refreshButton =
        $("#refresh-button");

    const refreshInterval =
        $("#refresh-interval");

    const refreshStatus =
        $("#refresh-status");

    const refreshIntervalLabel =
        $("#refresh-interval-label");

    const serverStatus =
        $("#server-status");

    const sensorStatus =
        $("#sensor-status");

    const memoryStatus =
        $("#memory-status");

    const swapStatus =
        $("#swap-status");

    const loadStatus =
        $("#load-status");

    const uptimeStatus =
        $("#uptime-status");

    const memoryBar =
        $("#memory-bar");

    const swapBar =
        $("#swap-bar");

    const hardwareApiStatus =
        $("#hardware-api-status");

    const hardwareTemperatureStatus =
        $("#hardware-temperature-status");

    const hardwareBridgeVersion =
        $("#hardware-bridge-version");

    const hardwareBridgeDetail =
        $("#hardware-bridge-detail");

    const hardwareSensorCount =
        $("#hardware-sensor-count");

    const cpuInfo =
        $("#cpu-info");

    const cpuInfoDetail =
        $("#cpu-info-detail");

    const memoryInfo =
        $("#memory-info");

    const memoryInfoDetail =
        $("#memory-info-detail");

    const storageInfo =
        $("#storage-info");

    const fanGrid =
        $("#fan-grid");

    const fanSection =
        $("#fan-section");

    const cpuUsageStatus =
        $("#cpu-usage-status");

    const cpuUsageBar =
        $("#cpu-usage-bar");

    const cpuUsageHistory =
        $("#cpu-usage-history");

    const memoryHistory =
        $("#memory-history");

    const swapHistory =
        $("#swap-history");

    const loadHistory =
        $("#load-history");

    const filesystemInfo =
        $("#filesystem-info");

    const networkInfo =
        $("#network-info");

    const filesystemInfoCard =
        $("#filesystem-info-card");

    const networkInfoCard =
        $("#network-info-card");

    const networkUsageCard =
        $("#network-usage-card");

    const networkUsageStatus =
        $("#network-usage-status");

    const networkUsageHistory =
        $("#network-usage-history");

    const containerHealthSection =
        $("#container-health-section");

    const containerHealthGrid =
        $("#container-health-grid");

    const MAX_HISTORY_SAMPLES = 60;
    const cpuUsageSamples = [];
    const memoryUsageSamples = [];
    const swapUsageSamples = [];
    const loadOneSamples = [];
    const networkUsageSamples = [];


    /*
     * =========================================================
     * ENVIRONMENT
     * =========================================================
     */

    const LOCAL_DEVELOPMENT =
        window.parent === window;

    const HAS_DUNE_BRIDGE =
        !LOCAL_DEVELOPMENT &&
        window.DuneAddon &&
        typeof window.DuneAddon.request === "function";


    /*
     * =========================================================
     * SENSOR DISPLAY MAP
     * =========================================================
     */

    const SENSOR_DISPLAY_MAP = {

        "acpitz Sensor 1":
            "ACPI Thermal Zone",

        "acpitz Sensor 2":
            "ACPI Thermal Zone 2",

        "coretemp Package id 0":
            "CPU Package",

        "coretemp Package id 1":
            "CPU Package 2",

        "coretemp Core 0":
            "CPU Core 0",

        "coretemp Core 1":
            "CPU Core 1",

        "coretemp Core 2":
            "CPU Core 2",

        "coretemp Core 3":
            "CPU Core 3",

        "coretemp Core 4":
            "CPU Core 4",

        "coretemp Core 5":
            "CPU Core 5",

        "coretemp Core 6":
            "CPU Core 6",

        "coretemp Core 7":
            "CPU Core 7"

    };


    /*
     * =========================================================
     * SENSOR DRIVER DISPLAY MAP
     * =========================================================
     *
     * DISPLAY-ONLY labels.
     *
     * These do NOT create hardware identities.
     * =========================================================
     */

    const SENSOR_DRIVER_MAP = [

        {
            pattern:
                /^r8169(?:[_\s:-]|$)/i,

            label:
                "Realtek Network Adapter"
        },

        {
            pattern:
                /^r8168(?:[_\s:-]|$)/i,

            label:
                "Realtek Network Adapter"
        },

        {
            pattern:
                /^r8125(?:[_\s:-]|$)/i,

            label:
                "Realtek Network Adapter"
        },

        {
            pattern:
                /^r8152(?:[_\s:-]|$)/i,

            label:
                "Realtek Network Adapter"
        },

        {
            pattern:
                /^tg3(?:[_\s:-]|$)/i,

            label:
                "Broadcom Network Adapter"
        },

        {
            pattern:
                /^bnx2(?:[_\s:-]|$)/i,

            label:
                "Broadcom Network Adapter"
        },

        {
            pattern:
                /^bnxt_en(?:[_\s:-]|$)/i,

            label:
                "Broadcom Network Adapter"
        },

        {
            pattern:
                /^igc(?:[_\s:-]|$)/i,

            label:
                "Intel Network Adapter"
        },

        {
            pattern:
                /^igb(?:[_\s:-]|$)/i,

            label:
                "Intel Network Adapter"
        },

        {
            pattern:
                /^e1000e(?:[_\s:-]|$)/i,

            label:
                "Intel Network Adapter"
        },

        {
            pattern:
                /^ixgbe(?:[_\s:-]|$)/i,

            label:
                "Intel Network Adapter"
        },

        {
            pattern:
                /^i40e(?:[_\s:-]|$)/i,

            label:
                "Intel Network Adapter"
        },

        {
            pattern:
                /^ice(?:[_\s:-]|$)/i,

            label:
                "Intel Network Adapter"
        },

        {
            pattern:
                /^mlx4/i,

            label:
                "Mellanox Network Adapter"
        },

        {
            pattern:
                /^mlx5/i,

            label:
                "Mellanox Network Adapter"
        },

        {
            pattern:
                /^atlantic(?:[_\s:-]|$)/i,

            label:
                "Aquantia / Marvell Network Adapter"
        },

        {
            pattern:
                /^sky2(?:[_\s:-]|$)/i,

            label:
                "Marvell Network Adapter"
        },

        {
            pattern:
                /^alx(?:[_\s:-]|$)/i,

            label:
                "Qualcomm / Atheros Network Adapter"
        },

        {
            pattern:
                /^amdgpu(?:[_\s:-]|$)/i,

            label:
                "AMD GPU"
        },

        {
            pattern:
                /^nouveau(?:[_\s:-]|$)/i,

            label:
                "NVIDIA GPU"
        },

        {
            pattern:
                /^i915(?:[_\s:-]|$)/i,

            label:
                "Intel GPU"
        },

        {
            pattern:
                /^nvme(?:[_\s:-]|$)/i,

            label:
                "NVMe"
        },

        {
            pattern:
                /^k10temp(?:[_\s:-]|$)/i,

            label:
                "AMD CPU"
        },

        {
            pattern:
                /^zenpower(?:[_\s:-]|$)/i,

            label:
                "AMD CPU"
        }

    ];


    /*
     * =========================================================
     * SENSOR DISPLAY NAME
     * =========================================================
     */

    function getSensorDisplayName(sensor) {

        const rawName =
            typeof sensor === "string"
                ? sensor
                : (
                    sensor &&
                    (
                        sensor.name ??
                        sensor.label ??
                        sensor.sensor ??
                        sensor.id
                    )
                );

        if (!rawName) {
            return "Unknown Sensor";
        }

        const name =
            String(rawName).trim();


        if (
            sensor &&
            typeof sensor === "object"
        ) {

            const friendlyName =
                sensor.display_name ??
                sensor.displayName ??
                sensor.friendly_name ??
                sensor.friendlyName;

            if (
                typeof friendlyName === "string" &&
                friendlyName.trim()
            ) {

                return friendlyName.trim();

            }

        }


        if (
            Object.prototype.hasOwnProperty.call(
                SENSOR_DISPLAY_MAP,
                name
            )
        ) {

            return SENSOR_DISPLAY_MAP[name];

        }


        const packageMatch =
            name.match(
                /^coretemp\s+Package\s+id\s+(\d+)$/i
            );

        if (packageMatch) {

            const packageId =
                Number(packageMatch[1]);

            if (packageId === 0) {
                return "CPU Package";
            }

            return (
                "CPU Package " +
                (packageId + 1)
            );

        }


        const coreMatch =
            name.match(
                /^coretemp\s+Core\s+(\d+)$/i
            );

        if (coreMatch) {

            return (
                "CPU Core " +
                coreMatch[1]
            );

        }


        if (
            name
                .toLowerCase()
                .startsWith("acpitz")
        ) {

            const acpiMatch =
                name.match(
                    /Sensor\s+(\d+)/i
                );

            if (acpiMatch) {

                const sensorNumber =
                    Number(acpiMatch[1]);

                if (sensorNumber === 1) {
                    return "ACPI Thermal Zone";
                }

                return (
                    "ACPI Thermal Zone " +
                    sensorNumber
                );

            }

            return "ACPI Thermal Zone";

        }


        for (
            const entry of SENSOR_DRIVER_MAP
        ) {

            if (
                entry.pattern.test(name)
            ) {

                return entry.label;

            }

        }


        return name;

    }


    /*
     * =========================================================
     * HTML ESCAPE
     * =========================================================
     */

    function escapeHtml(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    /*
     * =========================================================
     * BYTE FORMATTING
     * =========================================================
     */

    function formatBytes(bytes) {

        const value =
            Number(bytes);

        if (
            !Number.isFinite(value) ||
            value < 0
        ) {

            return "Unknown";

        }

        if (value === 0) {
            return "0 B";
        }

        const units = [
            "B",
            "KB",
            "MB",
            "GB",
            "TB",
            "PB"
        ];

        let number = value;
        let unit = 0;

        while (
            number >= 1024 &&
            unit < units.length - 1
        ) {

            number /= 1024;
            unit++;

        }

        return (
            number.toFixed(
                number >= 100
                    ? 0
                    : 1
            ) +
            " " +
            units[unit]
        );

    }


    function formatBytesFromKB(kb) {

        return formatBytes(
            Number(kb) * 1024
        );

    }


    /*
     * =========================================================
     * UPTIME
     * =========================================================
     */

    function formatUptime(seconds) {

        let value =
            Math.max(
                0,
                Number(seconds) || 0
            );

        const days =
            Math.floor(value / 86400);

        value %= 86400;

        const hours =
            Math.floor(value / 3600);

        value %= 3600;

        const minutes =
            Math.floor(value / 60);

        return (
            days +
            "d " +
            hours +
            "h " +
            minutes +
            "m"
        );

    }


    /*
     * =========================================================
     * TEMPERATURE STATE
     * =========================================================
     */

    function getTemperatureState(
        temperature
    ) {

        if (temperature >= 85) {

            return {
                name: "CRITICAL",
                className: "critical"
            };

        }

        if (temperature >= 75) {

            return {
                name: "HOT",
                className: "hot"
            };

        }

        if (temperature >= 60) {

            return {
                name: "WARM",
                className: "warm"
            };

        }

        return {
            name: "NORMAL",
            className: "normal"
        };

    }


    /*
     * =========================================================
     * GENERAL HARDWARE HELPERS
     * =========================================================
     */

    function firstValue(
        object,
        keys
    ) {

        if (
            !object ||
            typeof object !== "object"
        ) {

            return null;

        }

        for (
            const key of keys
        ) {

            const value =
                object[key];

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {

                return value;

            }

        }

        return null;

    }


    function getManufacturer(object) {

        return firstValue(
            object,
            [
                "manufacturer",
                "vendor",
                "brand",
                "maker"
            ]
        );

    }


    function getModel(object) {

        return firstValue(
            object,
            [
                "model",
                "model_name",
                "modelName",
                "product",
                "product_name",
                "productName",
                "name"
            ]
        );

    }


    function getFriendlyHardwareName(object) {

        return firstValue(
            object,
            [
                "display_name",
                "displayName",
                "friendly_name",
                "friendlyName"
            ]
        );

    }


    /*
     * =========================================================
     * SENSOR NORMALIZATION
     * =========================================================
     */

    function normalizeSensor(sensor) {

        if (
            !sensor ||
            typeof sensor !== "object"
        ) {

            return null;

        }

        const temperature =
            Number(
                sensor.temperature ??
                sensor.temp ??
                sensor.value ??
                sensor.celsius
            );

        if (
            !Number.isFinite(temperature)
        ) {

            return null;

        }

        const normalized = {
            ...sensor,

            name:
                sensor.name ??
                sensor.label ??
                sensor.sensor ??
                sensor.id ??
                "Unknown Sensor",

            temperature
        };


        /*
         * device_id is optional in v3.
         *
         * Never invent one.
         */

        if (
            typeof sensor.device_id !== "string" ||
            !sensor.device_id.trim()
        ) {

            delete normalized.device_id;

        }

        return normalized;

    }


    /*
     * =========================================================
     * HARDWARE STATUS RESPONSE NORMALIZATION
     * =========================================================
     */

    function normalizeHardwareResponse(result) {

        if (
            !result ||
            typeof result !== "object"
        ) {

            throw new Error(
                "Invalid Hardware Status response."
            );

        }

        let data = result;


        /*
         * Support harmless wrapper shapes.
         */

        if (
            data.data &&
            typeof data.data === "object"
        ) {

            data = data.data;

        }

        if (
            data.result &&
            typeof data.result === "object"
        ) {

            data = data.result;

        }


        /*
         * Temperatures
         */

        const rawTemperatures =
            Array.isArray(data.temperatures)
                ? data.temperatures
                : [];

        const temperatures =
            rawTemperatures
                .slice(0, 128)
                .map(normalizeSensor)
                .filter(Boolean);


        /*
         * Fans
         */

        const fans =
            Array.isArray(data.fans)
                ? data.fans
                    .slice(0, 128)
                    .filter(
                        fan =>
                            fan &&
                            typeof fan === "object" &&
                            Number.isFinite(
                                Number(fan.rpm)
                            ) &&
                            Number(fan.rpm) >= 0
                    )
                    .map(fan => ({
                        ...fan,
                        name:
                            fan.name ??
                            fan.label ??
                            "Unknown Fan",
                        rpm:
                            Number(fan.rpm)
                    }))
                : [];


        /*
         * CPU
         */

        let cpu =
            data.cpu ??
            data.processor ??
            data.cpu_info ??
            data.cpuInfo ??
            null;

        if (
            cpu &&
            typeof cpu === "object"
        ) {

            cpu = {
                ...cpu,

                usage_percent:
                    Number.isFinite(
                        Number(cpu.usage_percent)
                    )
                        ? Number(cpu.usage_percent)
                        : null,

                logical_threads:
                    Number.isFinite(
                        Number(cpu.logical_threads)
                    )
                        ? Number(cpu.logical_threads)
                        : null,

                physical_cores:
                    Number.isFinite(
                        Number(cpu.physical_cores)
                    )
                        ? Number(cpu.physical_cores)
                        : null
            };

        }


        /*
         * Memory
         */

        const memory =
            data.memory &&
            typeof data.memory === "object"
                ? data.memory
                : null;


        /*
         * Swap
         */

        const swap =
            data.swap &&
            typeof data.swap === "object"
                ? data.swap
                : null;


        /*
         * Load
         */

        const load =
            data.load &&
            typeof data.load === "object"
                ? data.load
                : null;


        /*
         * Storage
         */

        let storage =
            Array.isArray(data.storage)
                ? data.storage
                : [];

        storage =
            storage
                .slice(0, 64)
                .filter(
                    disk =>
                        disk &&
                        typeof disk === "object"
                )
                .map(disk => ({
                    ...disk,

                    size_bytes:
                        Number.isFinite(
                            Number(disk.size_bytes)
                        )
                            ? Number(disk.size_bytes)
                            : null
                }));


        /*
         * Filesystems
         */

        const filesystems =
            Array.isArray(data.filesystems)
                ? data.filesystems
                    .slice(0, 64)
                    .filter(
                        fs =>
                            fs &&
                            typeof fs === "object"
                    )
                : [];


        /*
         * Network
         *
         * Bridge already caps this at 32.
         * Keep the addon bounded too.
         */

        const network =
            Array.isArray(data.network)
                ? data.network
                    .slice(0, 32)
                    .filter(
                        iface =>
                            iface &&
                            typeof iface === "object" &&
                            String(iface.status || "")
                                .toLowerCase() === "up"
                    )
                : [];


        /*
         * Version
         */

        const version =
            Number.isFinite(
                Number(data.version)
            )
                ? Number(data.version)
                : 3;


        /*
         * sampled_at
         */

        const sampled_at =
            typeof data.sampled_at === "string"
                ? data.sampled_at
                : null;


        /*
         * Uptime
         */

        const uptime_seconds =
            Number.isFinite(
                Number(data.uptime_seconds)
            )
                ? Number(data.uptime_seconds)
                : 0;


        return {

            ...data,

            version,

            sampled_at,

            temperatures,

            fans,

            cpu,

            storage,

            filesystems,

            network,

            memory,

            swap,

            load,

            uptime_seconds

        };

    }


    /*
     * =========================================================
     * LOCAL DEVELOPMENT MOCK
     * =========================================================
     *
     * Used only when index.html is opened directly.
     *
     * This mirrors the v3 response shape.
     * =========================================================
     */

    function getMockData() {

        return {

            version: 3,

            sampled_at:
                new Date().toISOString(),


            cpu: {

                id:
                    "cpu:0",

                manufacturer:
                    "AMD",

                model:
                    "Ryzen 9 5950X",

                usage_percent:
                    32.5,

                logical_threads:
                    16,

                physical_cores:
                    8

            },


            temperatures: [

                {
                    name:
                        "coretemp Package id 0",

                    temperature:
                        47.0,

                    device_id:
                        "cpu:0"
                },

                {
                    name:
                        "coretemp Core 0",

                    temperature:
                        45.0,

                    device_id:
                        "cpu:0"
                },

                {
                    name:
                        "coretemp Core 1",

                    temperature:
                        46.0,

                    device_id:
                        "cpu:0"
                },

                {
                    name:
                        "r8169_0_d00:00 Sensor 1",

                    temperature:
                        44.0
                },

                {
                    name:
                        "tg3 Sensor 1",

                    temperature:
                        47.0
                },

                {
                    name:
                        "nvme Composite",

                    temperature:
                        39.9,

                    device_id:
                        "block:nvme0n1"
                },

                {
                    name:
                        "acpitz Sensor 1",

                    temperature:
                        38.0
                }

            ],


            fans: [

                {
                    name:
                        "Mock CPU Fan",

                    rpm:
                        1450
                }

            ],


            storage: [

                {
                    id:
                        "block:sda",

                    name:
                        "sda",

                    manufacturer:
                        "Crucial",

                    model:
                        "CT250MX500SSD1",

                    bus:
                        "sata",

                    size_bytes:
                        250059350016
                },

                {
                    id:
                        "block:nvme0n1",

                    name:
                        "nvme0n1",

                    manufacturer:
                        "Samsung",

                    model:
                        "Samsung SSD 990 PRO 2TB",

                    bus:
                        "nvme",

                    size_bytes:
                        2000398934016
                }

            ],


            filesystems: [

                {
                    id:
                        "dune-data",

                    name:
                        "Dune Docker Data",

                    total_bytes:
                        1000000000000,

                    free_bytes:
                        400000000000,

                    used_bytes:
                        600000000000,

                    percent:
                        60
                }

            ],


            network: [

                {
                    name:
                        "eth0",

                    status:
                        "up",

                    rx_bytes:
                        123456789,

                    tx_bytes:
                        987654321,

                    speed_mbps:
                        1000
                }

            ],


            memory: {

                total_kb:
                    16777216,

                available_kb:
                    8388608,

                used_kb:
                    8388608,

                percent:
                    50

            },


            swap: {

                total_kb:
                    4194304,

                free_kb:
                    4194304,

                used_kb:
                    0,

                percent:
                    0

            },


            load: {

                one:
                    0.25,

                five:
                    0.20,

                fifteen:
                    0.18

            },


            uptime_seconds:
                86400

        };

    }


    /*
     * =========================================================
     * BOUNDED NETWORK HISTORY
     * =========================================================
     *
     * Only ONE previous snapshot is retained.
     *
     * This is enough to calculate transfer rates while keeping
     * addon memory usage bounded.
     *
     * Nothing is persisted.
     * =========================================================
     */

    let previousNetworkSnapshot =
        null;


    function calculateNetworkRates(
        network,
        sampledAt
    ) {

        if (
            !Array.isArray(network)
        ) {

            previousNetworkSnapshot =
                null;

            return [];

        }


        const currentTime =
            Date.parse(
                sampledAt || ""
            );


        const previous =
            previousNetworkSnapshot;


        const previousTime =
            previous
                ? previous.sampledAt
                : NaN;


        const elapsedSeconds =

            Number.isFinite(currentTime) &&
            Number.isFinite(previousTime)

                ? (
                    currentTime -
                    previousTime
                ) / 1000

                : NaN;


        const previousByName =
            new Map();


        if (
            previous &&
            Array.isArray(
                previous.network
            )
        ) {

            for (
                const item
                of previous.network
            ) {

                if (
                    item &&
                    typeof item.name === "string"
                ) {

                    previousByName.set(
                        item.name,
                        item
                    );

                }

            }

        }


        const enriched =
            network
                .slice(0, 32)
                .map(item => {

                    const current =
                        item &&
                        typeof item === "object"
                            ? item
                            : {};


                    const prior =
                        previousByName.get(
                            current.name
                        );


                    const rx =
                        Number(
                            current.rx_bytes
                        );


                    const tx =
                        Number(
                            current.tx_bytes
                        );


                    const priorRx =
                        prior
                            ? Number(
                                prior.rx_bytes
                            )
                            : NaN;


                    const priorTx =
                        prior
                            ? Number(
                                prior.tx_bytes
                            )
                            : NaN;


                    let rxBytesPerSecond =
                        null;


                    let txBytesPerSecond =
                        null;


                    /*
                     * If counters reset or wrap,
                     * do not report a bogus negative rate.
                     */

                    if (
                        Number.isFinite(
                            elapsedSeconds
                        ) &&
                        elapsedSeconds > 0 &&
                        Number.isFinite(rx) &&
                        Number.isFinite(priorRx) &&
                        rx >= priorRx
                    ) {

                        rxBytesPerSecond =
                            (
                                rx -
                                priorRx
                            ) / elapsedSeconds;

                    }


                    if (
                        Number.isFinite(
                            elapsedSeconds
                        ) &&
                        elapsedSeconds > 0 &&
                        Number.isFinite(tx) &&
                        Number.isFinite(priorTx) &&
                        tx >= priorTx
                    ) {

                        txBytesPerSecond =
                            (
                                tx -
                                priorTx
                            ) / elapsedSeconds;

                    }


                    return {

                        ...current,

                        rx_bytes_per_second:
                            rxBytesPerSecond,

                        tx_bytes_per_second:
                            txBytesPerSecond

                    };

                });


        previousNetworkSnapshot = {

            sampledAt:
                Number.isFinite(
                    currentTime
                )
                    ? currentTime
                    : Date.now(),

            network:
                enriched.map(item => ({

                    name:
                        item.name,

                    rx_bytes:
                        item.rx_bytes,

                    tx_bytes:
                        item.tx_bytes

                }))

        };


        return enriched;

    }


    /*
     * =========================================================
     * CPU DISPLAY
     * =========================================================
     */

    function renderCpuInfo(cpu) {

        if (
            !cpu ||
            typeof cpu !== "object"
        ) {

            if (cpuInfo) {
                cpuInfo.textContent =
                    "Not exposed by bridge";
            }

            if (cpuInfoDetail) {
                cpuInfoDetail.textContent =
                    "V3 CPU identifier unavailable";
            }

            return;

        }


        const friendly =
            getFriendlyHardwareName(cpu);


        const manufacturer =
            getManufacturer(cpu);


        const model =
            getModel(cpu);


        const usage =
            Number(cpu.usage_percent);


        const logicalThreads =
            Number(cpu.logical_threads);


        const physicalCores =
            Number(cpu.physical_cores);


        const primary =
            friendly ??
            model ??
            manufacturer ??
            "Not exposed by bridge";


        if (cpuInfo) {

            cpuInfo.textContent =
                String(primary);

        }


        if (cpuInfoDetail) {

            const details = [];


            if (
                Number.isFinite(usage)
            ) {

                details.push(
                    `Usage ${usage.toFixed(1)}%`
                );

            }


            if (
                Number.isFinite(
                    physicalCores
                ) &&
                Number.isFinite(
                    logicalThreads
                )
            ) {

                details.push(
                    `${physicalCores}C / ${logicalThreads}T`
                );

            }

            else if (
                Number.isFinite(
                    logicalThreads
                )
            ) {

                details.push(
                    `${logicalThreads} threads`
                );

            }


            cpuInfoDetail.textContent =
                details.join(" • ") ||
                "V3 CPU information";

        }

    }


    /*
     * =========================================================
     * MEMORY INFO
     * =========================================================
     */

    function renderMemoryInfo(memory) {

        if (
            !memory ||
            typeof memory !== "object"
        ) {

            if (memoryInfo) {
                memoryInfo.textContent =
                    "Not exposed by bridge";
            }

            if (memoryInfoDetail) {
                memoryInfoDetail.textContent =
                    "V3 memory information unavailable";
            }

            return;

        }


        const total =
            memory.total_bytes ??
            memory.totalBytes;


        if (
            Number.isFinite(
                Number(total)
            )
        ) {

            if (memoryInfo) {
                memoryInfo.textContent =
                    formatBytes(total);
            }

            if (memoryInfoDetail) {
                memoryInfoDetail.textContent =
                    "Total memory";
            }

            return;

        }


        if (
            memory.total_kb !== undefined
        ) {

            if (memoryInfo) {
                memoryInfo.textContent =
                    formatBytesFromKB(
                        memory.total_kb
                    );
            }

            if (memoryInfoDetail) {
                memoryInfoDetail.textContent =
                    "Total memory";
            }

            return;

        }


        if (memoryInfo) {
            memoryInfo.textContent =
                "Available";
        }

        if (memoryInfoDetail) {
            memoryInfoDetail.textContent =
                "Capacity not exposed";
        }

    }


    /*
     * =========================================================
     * STORAGE DISPLAY
     * =========================================================
     */

    function renderStorageInfo(storage) {

        if (!storageInfo) {
            return;
        }


        if (
            !Array.isArray(storage) ||
            storage.length === 0
        ) {

            storageInfo.innerHTML = `

                <div class="hardware-list-empty">
                    No storage identifiers exposed.
                </div>

            `;

            return;

        }


        storageInfo.innerHTML =
            storage.map(disk => {

                const model =
                    getModel(disk);


                const size =
                    Number(
                        disk.size_bytes
                    );


                const primary =
                    model ??
                    disk.name ??
                    disk.id ??
                    "Unknown storage";


                const details = [];


                if (
                    Number.isFinite(size)
                ) {

                    details.push(
                        formatBytes(size)
                    );

                }


                return `

                    <div class="hardware-list-item">

                        <div class="hardware-list-name">

                            ${escapeHtml(
                                primary
                            )}

                        </div>

                        <div class="hardware-list-detail">

                            ${escapeHtml(
                                details.join(" • ") ||
                                "Identifier exposed by bridge"
                            )}

                        </div>

                    </div>

                `;

            }).join("");

    }


    function renderFans(fans) {

        const hasFans =
            Array.isArray(fans) &&
            fans.length > 0;

        if (fanSection) {
            fanSection.hidden = !hasFans;
        }

        if (!fanGrid) return;

        if (!hasFans) {
            fanGrid.innerHTML = `<div class="loading"><span>No fan sensors found.</span></div>`;
            return;
        }

        fanGrid.innerHTML = fans.map(fan => {
            const rpm = Number(fan.rpm);
            const value = Number.isFinite(rpm) ? `${Math.max(0, rpm).toFixed(0)} RPM` : "UNKNOWN";
            return `<div class="sensor fan-card">
                <div class="sensor-name">${escapeHtml(fan.name || "Unknown Fan")}</div>
                <div class="sensor-temperature normal">${value}</div>
                <div class="sensor-state normal">${Number.isFinite(rpm) ? "ONLINE" : "NO DATA"}</div>
            </div>`;
        }).join("");
    }


    function renderFilesystems(filesystems) {

        if (!filesystemInfo) return;

        const hasFilesystems =
            Array.isArray(filesystems) &&
            filesystems.length > 0;

        if (filesystemInfoCard) {
            filesystemInfoCard.hidden = !hasFilesystems;
        }

        if (!hasFilesystems) {
            filesystemInfo.innerHTML = `<div class="hardware-list-empty">No filesystem data exposed.</div>`;
            return;
        }

        filesystemInfo.innerHTML = filesystems.map(fs => {
            const total = Number(fs.total_bytes);
            const free = Number(fs.free_bytes);
            const used = Number(fs.used_bytes);
            const percent = Number(fs.percent);
            const details = [];
            if (Number.isFinite(percent)) details.push(`${percent.toFixed(1)}% used`);
            if (Number.isFinite(used) && Number.isFinite(total)) details.push(`${formatBytes(used)} / ${formatBytes(total)}`);
            else if (Number.isFinite(free)) details.push(`${formatBytes(free)} free`);
            const safePercent = Number.isFinite(percent)
                ? Math.max(0, Math.min(100, percent))
                : 0;
            return `<div class="hardware-list-item">
                <div class="hardware-list-name">${escapeHtml(fs.name || fs.id || "Unknown filesystem")}</div>
                <div class="hardware-list-detail">${escapeHtml(details.join(" • ") || "Filesystem data exposed by bridge")}</div>
                <div class="filesystem-meter" aria-label="${Number.isFinite(percent) ? `${percent.toFixed(1)} percent used` : "Filesystem usage unavailable"}">
                    <div class="filesystem-meter-fill" style="width: ${safePercent}%"></div>
                </div>
            </div>`;
        }).join("");
    }


    function renderNetwork(network) {

        if (!networkInfo) return;

        const visibleNetwork =
            Array.isArray(network)
                ? network.filter(
                    iface =>
                        iface &&
                        String(iface.status || "")
                            .toLowerCase() === "up"
                        &&
                        !/^(lo|docker\d*|br[-\w]*|veth[-\w]*|virbr\d*|tun\d*|tap\d*|wg\d*|tailscale\d*)$/i.test(
                            String(iface.name || "").trim()
                        )
                )
                : [];

        if (visibleNetwork.length === 0) {
            if (networkInfoCard) {
                networkInfoCard.hidden = true;
            }
            if (networkUsageCard) {
                networkUsageCard.hidden = true;
            }
            networkUsageSamples.length = 0;
            if (networkUsageStatus) {
                networkUsageStatus.textContent = "NO DATA";
            }
            renderSparkline(networkUsageHistory, [], "#d58cff");
            networkInfo.innerHTML = `<div class="hardware-list-empty">No network data exposed.</div>`;
            return;
        }

        if (networkInfoCard) {
            networkInfoCard.hidden = false;
        }
        if (networkUsageCard) {
            networkUsageCard.hidden = false;
        }

        const totalRx = visibleNetwork.reduce(
            (total, iface) => total + (
                Number.isFinite(Number(iface.rx_bytes_per_second))
                    ? Math.max(0, Number(iface.rx_bytes_per_second))
                    : 0
            ),
            0
        );
        const totalTx = visibleNetwork.reduce(
            (total, iface) => total + (
                Number.isFinite(Number(iface.tx_bytes_per_second))
                    ? Math.max(0, Number(iface.tx_bytes_per_second))
                    : 0
            ),
            0
        );
        const hasRate = visibleNetwork.some(iface =>
            Number.isFinite(Number(iface.rx_bytes_per_second)) ||
            Number.isFinite(Number(iface.tx_bytes_per_second))
        );

        if (networkUsageStatus) {
            networkUsageStatus.textContent = hasRate
                ? `↓ ${formatBytes(totalRx)}/s · ↑ ${formatBytes(totalTx)}/s`
                : "WAITING FOR SECOND SAMPLE";
        }

        if (hasRate) {
            networkUsageSamples.push(totalRx + totalTx);
            if (networkUsageSamples.length > MAX_HISTORY_SAMPLES) {
                networkUsageSamples.shift();
            }
        }

        renderSparkline(
            networkUsageHistory,
            networkUsageSamples,
            "#d58cff",
            Math.max(1, ...networkUsageSamples)
        );

        networkInfo.innerHTML = visibleNetwork.map(iface => {
            const connectionDetails = [];
            if (iface.status) connectionDetails.push(String(iface.status).toUpperCase());
            if (Number.isFinite(Number(iface.speed_mbps))) connectionDetails.push(`${Number(iface.speed_mbps)} Mbps`);
            const rateDetails = [];
            if (Number.isFinite(Number(iface.rx_bytes_per_second))) rateDetails.push(`↓ ${formatBytes(Number(iface.rx_bytes_per_second))}/s`);
            if (Number.isFinite(Number(iface.tx_bytes_per_second))) rateDetails.push(`↑ ${formatBytes(Number(iface.tx_bytes_per_second))}/s`);
            return `<div class="hardware-list-item">
                <div class="hardware-list-name">${escapeHtml(iface.name || "Unknown interface")}</div>
                <div class="hardware-list-detail">${escapeHtml(connectionDetails.join(" • ") || "Network data exposed by bridge")}</div>
                <div class="hardware-list-rate">${escapeHtml(rateDetails.join(" • ") || "Waiting for second sample")}</div>
            </div>`;
        }).join("");
    }


    function renderContainerHealth(containers) {

        if (!containerHealthGrid || !containerHealthSection) return;

        const items = Array.isArray(containers)
            ? containers.filter(item => item && typeof item === "object").slice(0, 64)
            : [];

        containerHealthSection.hidden = items.length === 0;
        if (items.length === 0) return;

        const unitFactor = unit => ({ B: 1, KIB: 1024, MIB: 1024 ** 2, GIB: 1024 ** 3, TIB: 1024 ** 4 }[String(unit || "B").toUpperCase()] || 1);
        const parseBytes = value => {
            const match = String(value ?? "").trim().match(/^([\d.]+)\s*(B|KiB|MiB|GiB|TiB)?$/i);
            return match ? Number(match[1]) * unitFactor(match[2]) : NaN;
        };
        const parsePairTotal = value => String(value ?? "").split("/").reduce((sum, part) => sum + (Number.isFinite(parseBytes(part)) ? parseBytes(part) : 0), 0);
        const maxNetwork = Math.max(1, ...items.map(item => parsePairTotal(item.networkIO ?? item.network_io)));
        const maxBlock = Math.max(1, ...items.map(item => parsePairTotal(item.blockIO ?? item.block_io)));

        containerHealthGrid.innerHTML = items.map(item => {
            const name = item.name || item.container_name || item.id || "Unknown container";
            const cpu = item.cpu ?? item.cpu_percent ?? item.cpu_usage_percent;
            const memory = item.memory ?? item.memory_percent ?? item.memory_usage_percent;
            const memoryLimit = item.memoryLimit ?? item.memory_limit ?? item.memory_limit_bytes;
            const networkIO = item.networkIO ?? item.network_io;
            const blockIO = item.blockIO ?? item.block_io;
            const status = item.status || item.state || "UNKNOWN";
            const details = [];
            if (item.health) details.push(String(item.health));
            const cpuPercent = Number.parseFloat(String(cpu ?? ""));
            const memoryMatch = String(memory ?? "").match(/^([\d.]+)\s*(B|KiB|MiB|GiB|TiB)?$/i);
            const limitMatch = String(memoryLimit ?? "").match(/^([\d.]+)\s*(B|KiB|MiB|GiB|TiB)?$/i);
            const memoryBytes = memoryMatch ? Number(memoryMatch[1]) * unitFactor(memoryMatch[2]) : NaN;
            const limitBytes = limitMatch ? Number(limitMatch[1]) * unitFactor(limitMatch[2]) : NaN;
            const memoryPercent = Number.isFinite(memoryBytes) && Number.isFinite(limitBytes) && limitBytes > 0 ? (memoryBytes / limitBytes) * 100 : NaN;
            const statusText = String(status).toUpperCase();
            const networkTotal = parsePairTotal(networkIO);
            const blockTotal = parsePairTotal(blockIO);
            return `<div class="hardware-list-item">
                <div class="hardware-list-name">${escapeHtml(name)}</div>
                <div class="hardware-list-detail">${escapeHtml(statusText)}${details.length ? ` • ${escapeHtml(details.join(" • "))}` : ""}</div>
                ${Number.isFinite(cpuPercent) ? `<div class="container-meter-label">CPU</div><div class="container-meter" title="CPU ${escapeHtml(String(cpu))}" aria-label="CPU ${escapeHtml(String(cpu))}"><div class="container-meter-fill cpu" style="width:${Math.max(0, Math.min(100, cpuPercent))}%"></div></div>` : ""}
                ${Number.isFinite(memoryPercent) ? `<div class="container-meter-label">Memory</div><div class="container-meter" title="Memory ${escapeHtml(String(memory))} / ${escapeHtml(String(memoryLimit))}" aria-label="Memory ${escapeHtml(String(memory))} of ${escapeHtml(String(memoryLimit))}"><div class="container-meter-fill memory" style="width:${Math.max(0, Math.min(100, memoryPercent))}%"></div></div>` : ""}
                ${Number.isFinite(networkTotal) && networkIO ? `<div class="container-meter-label">Network I/O</div><div class="container-meter" title="Network I/O ${escapeHtml(String(networkIO))}" aria-label="Network I/O ${escapeHtml(String(networkIO))}"><div class="container-meter-fill network" style="width:${Math.min(100, (networkTotal / maxNetwork) * 100)}%"></div></div>` : ""}
                ${Number.isFinite(blockTotal) && blockIO ? `<div class="container-meter-label">Block I/O</div><div class="container-meter" title="Block I/O ${escapeHtml(String(blockIO))}" aria-label="Block I/O ${escapeHtml(String(blockIO))}"><div class="container-meter-fill block" style="width:${Math.min(100, (blockTotal / maxBlock) * 100)}%"></div></div>` : ""}
            </div>`;
        }).join("");
    }


    /*
     * =========================================================
     * TEMPERATURE DISPLAY
     * =========================================================
     */

    function renderSensors(sensors) {

        if (temperatureSection) {
            temperatureSection.hidden =
                !Array.isArray(sensors) ||
                sensors.length === 0;
        }

        if (
            !Array.isArray(sensors) ||
            sensors.length === 0
        ) {

            if (sensorGrid) {

                sensorGrid.innerHTML = `

                    <div class="loading">

                        <div class="loading-fox">
                            🦊
                        </div>

                        <span>
                            No temperature sensors found.
                        </span>

                    </div>

                `;

            }


            if (sensorStatus) {
                sensorStatus.textContent =
                    "NO DATA";
            }


            if (hardwareTemperatureStatus) {
                hardwareTemperatureStatus.textContent =
                    "NO DATA";
            }


            if (hardwareSensorCount) {
                hardwareSensorCount.textContent =
                    "0";
            }


            return;

        }


        const validSensors =
            sensors.filter(
                sensor =>
                    Number.isFinite(
                        Number(
                            sensor.temperature
                        )
                    )
            );

        if (temperatureSection) {
            temperatureSection.hidden =
                validSensors.length === 0;
        }


        if (sensorGrid) {

            sensorGrid.innerHTML =
                validSensors
                    .map(sensor => {

                        const temperature =
                            Number(
                                sensor.temperature
                            );


                        const state =
                            getTemperatureState(
                                temperature
                            );


                        const displayName =
                            getSensorDisplayName(
                                sensor
                            );


                        return `

                            <div class="sensor">

                                <div class="sensor-name">

                                    ${escapeHtml(
                                        displayName
                                    )}

                                </div>

                                <div
                                    class="sensor-temperature ${state.className}"
                                >

                                    ${temperature.toFixed(
                                        1
                                    )}°C

                                </div>

                                <div
                                    class="sensor-state ${state.className}"
                                >

                                    ${state.name}

                                </div>

                            </div>

                        `;

                    })
                    .join("");

        }


        if (sensorStatus) {

            sensorStatus.textContent =
                `${validSensors.length} SENSOR${
                    validSensors.length === 1
                        ? ""
                        : "S"
                } OK`;

        }


        if (hardwareTemperatureStatus) {

            hardwareTemperatureStatus.textContent =
                "LIVE";

        }


        if (hardwareSensorCount) {

            hardwareSensorCount.textContent =
                String(
                    validSensors.length
                );

        }

    }


    /*
     * =========================================================
     * SYSTEM DISPLAY
     * =========================================================
     */

    function renderSparkline(svg, samples, color, scaleMax = 100) {

        if (!svg) return;

        if (!Array.isArray(samples) || samples.length < 2) {
            svg.hidden = true;
            svg.replaceChildren();
            return;
        }

        const points = samples.map((value, index) => {
            const x = samples.length === 1
                ? 0
                : (index / (samples.length - 1)) * 120;
            const y = 23 - (Math.max(0, Math.min(scaleMax, value)) / scaleMax) * 22;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(" ");

        svg.hidden = false;
        svg.innerHTML = `
            <line x1="0" y1="1" x2="120" y2="1" stroke="rgba(255,255,255,0.62)" stroke-width="1" stroke-dasharray="3 3"></line>
            <line x1="0" y1="12" x2="120" y2="12" stroke="rgba(255,255,255,0.38)" stroke-width="0.8" stroke-dasharray="3 3"></line>
            <line x1="0" y1="23" x2="120" y2="23" stroke="rgba(255,255,255,0.62)" stroke-width="1"></line>
            <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"></polyline>`;
    }

    function renderSystem(data) {

        const usage =
            data.cpu && Number(data.cpu.usage_percent);

        if (cpuUsageStatus) {
            cpuUsageStatus.textContent =
                Number.isFinite(usage)
                    ? `${Math.max(0, Math.min(100, usage)).toFixed(1)}%`
                    : "NO DATA";
        }

        if (cpuUsageBar) {
            cpuUsageBar.style.width =
                Number.isFinite(usage)
                    ? `${Math.max(0, Math.min(100, usage))}%`
                    : "0%";
        }

        if (Number.isFinite(usage)) {
            cpuUsageSamples.push(
                Math.max(0, Math.min(100, usage))
            );
            if (cpuUsageSamples.length > MAX_HISTORY_SAMPLES) {
                cpuUsageSamples.shift();
            }
        }

        const memoryPercent =
            data.memory && Number(data.memory.percent);

        if (Number.isFinite(memoryPercent)) {
            memoryUsageSamples.push(
                Math.max(0, Math.min(100, memoryPercent))
            );
            if (memoryUsageSamples.length > MAX_HISTORY_SAMPLES) {
                memoryUsageSamples.shift();
            }
        }

        const swapPercent =
            data.swap && Number(data.swap.percent);

        if (Number.isFinite(swapPercent)) {
            swapUsageSamples.push(
                Math.max(0, Math.min(100, swapPercent))
            );
            if (swapUsageSamples.length > MAX_HISTORY_SAMPLES) {
                swapUsageSamples.shift();
            }
        }

        const loadOne =
            data.load && Number(data.load.one);

        if (Number.isFinite(loadOne) && loadOne >= 0) {
            loadOneSamples.push(loadOne);
            if (loadOneSamples.length > MAX_HISTORY_SAMPLES) {
                loadOneSamples.shift();
            }
        }

        renderSparkline(
            cpuUsageHistory,
            cpuUsageSamples,
            "#5ee88a"
        );

        renderSparkline(
            memoryHistory,
            memoryUsageSamples,
            "#ffd75e"
        );

        renderSparkline(
            swapHistory,
            swapUsageSamples,
            "#ff9f43"
        );

        renderSparkline(
            loadHistory,
            loadOneSamples,
            "#8fd3ff",
            Math.max(1, ...loadOneSamples)
        );

        /*
         * MEMORY
         */

        if (data.memory) {

            const percent =
                Number(
                    data.memory.percent
                );


            const safePercent =
                Number.isFinite(percent)
                    ? Math.min(
                        100,
                        Math.max(
                            0,
                            percent
                        )
                    )
                    : 0;


            if (memoryStatus) {

                const used =
                    Number(
                        data.memory.used_kb
                    );


                memoryStatus.textContent =

                    Number.isFinite(percent)

                        ? `${percent.toFixed(1)}%` +
                          (
                              Number.isFinite(used)
                                  ? ` (${formatBytesFromKB(used)})`
                                  : ""
                          )

                        : "UNKNOWN";

            }


            if (memoryBar) {

                memoryBar.style.width =
                    `${safePercent}%`;

            }

        }

        else {

            if (memoryStatus) {
                memoryStatus.textContent =
                    "UNKNOWN";
            }

            if (memoryBar) {
                memoryBar.style.width =
                    "0%";
            }

        }


        /*
         * SWAP
         */

        if (data.swap) {

            const percent =
                Number(
                    data.swap.percent
                );


            const safePercent =
                Number.isFinite(percent)
                    ? Math.min(
                        100,
                        Math.max(
                            0,
                            percent
                        )
                    )
                    : 0;


            if (swapStatus) {

                const used =
                    Number(
                        data.swap.used_kb
                    );

                const total =
                    Number(
                        data.swap.total_kb
                    );


                if (Number.isFinite(percent)) {
                    swapStatus.innerHTML =
                        `${Number.isFinite(used) ? formatBytesFromKB(used) : "?"}` +
                        ` of ${Number.isFinite(total) ? formatBytesFromKB(total) : "?"}` +
                        `<br><span class="metric-subvalue">(${percent.toFixed(1)}%)</span>`;
                } else {
                    swapStatus.textContent = "UNKNOWN";
                }

            }


            if (swapBar) {

                swapBar.style.width =
                    `${safePercent}%`;

            }

        }

        else {

            if (swapStatus) {
                swapStatus.textContent =
                    "UNKNOWN";
            }

            if (swapBar) {
                swapBar.style.width =
                    "0%";
            }

        }


        /*
         * LOAD
         */

        if (data.load) {

            const one =
                Number(data.load.one);

            const five =
                Number(data.load.five);

            const fifteen =
                Number(data.load.fifteen);


            if (loadStatus) {

                loadStatus.textContent =

                    Number.isFinite(one)
                        ? one.toFixed(2)
                        : "?"

                    + " / " +

                    Number.isFinite(five)
                        ? five.toFixed(2)
                        : "?"

                    + " / " +

                    Number.isFinite(fifteen)
                        ? fifteen.toFixed(2)
                        : "?";

            }

        }

        else if (loadStatus) {

            loadStatus.textContent =
                "UNKNOWN";

        }


        /*
         * UPTIME
         */

        if (uptimeStatus) {

            uptimeStatus.textContent =
                formatUptime(
                    data.uptime_seconds
                );

        }


        /*
         * SYSTEM INFO
         */

        renderCpuInfo(
            data.cpu
        );


        renderMemoryInfo(
            data.memory
        );


        renderStorageInfo(
            data.storage
        );

        renderFans(data.fans);
        renderFilesystems(data.filesystems);
        renderNetwork(data.network);


        /*
         * V3 sections without dedicated HTML
         *
         * remain available on the normalized `data` object:
         *
         *   data.fans
         *   data.filesystems
         *   data.network
         *
         * Network rates are calculated in memory.
         *
         * No telemetry is discarded from the response.
         */

    }


    /*
     * =========================================================
     * BRIDGE METADATA
     * =========================================================
     */

    function renderBridgeInfo(data) {

        const version =
            Number.isFinite(
                Number(data.version)
            )
                ? Number(data.version)
                : 3;


        if (hardwareBridgeVersion) {

            hardwareBridgeVersion.textContent =
                `V${version}`;

        }


        if (hardwareBridgeDetail) {

            hardwareBridgeDetail.textContent =
                `Hardware Status Bridge v${version}`;

        }


        if (hardwareApiStatus) {

            hardwareApiStatus.textContent =
                "ACTIVE";

        }

    }


    /*
     * =========================================================
     * HARDWARE STATUS PROVIDER
     * =========================================================
     */

    async function getContainerHealth() {

        if (LOCAL_DEVELOPMENT || !HAS_DUNE_BRIDGE) return [];

        try {
            const result = await window.DuneAddon.request("ops.health.containers");
            const candidates = [
                result,
                result?.containers,
                result?.items,
                result?.data,
                result?.data?.containers,
                result?.data?.items,
                result?.result,
                result?.result?.containers,
                result?.result?.items
            ];
            const arrayCandidate = candidates.find(Array.isArray);
            if (arrayCandidate) return arrayCandidate;

            const objectCandidate = candidates.find(value =>
                value &&
                typeof value === "object" &&
                !Array.isArray(value) &&
                Object.values(value).length > 0 &&
                Object.values(value).every(item => item && typeof item === "object")
            );
            return objectCandidate ? Object.values(objectCandidate) : [];
        } catch (error) {
            console.warn("Container health unavailable:", error);
            return [];
        }
    }


    async function getHardwareStatus() {

        /*
         * LOCAL HTML TEST
         */

        if (LOCAL_DEVELOPMENT) {

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        150
                    )
            );


            const mockData =
                getMockData();


            mockData.network =
                calculateNetworkRates(
                    mockData.network,
                    mockData.sampled_at
                );


            return mockData;

        }


        /*
         * DUNE CONSOLE
         */

        if (!HAS_DUNE_BRIDGE) {

            throw new Error(
                "DuneAddon bridge unavailable."
            );

        }


        /*
         * =====================================================
         * HARDWARE STATUS BRIDGE V3
         * =====================================================
         *
         * This is intentionally the SAME action name.
         *
         * There is no:
         *
         *     server.hardware.status.v3
         *
         * =====================================================
         */

        const result =
            await window.DuneAddon.request(
                "server.hardware.status"
            );


            const data =
                normalizeHardwareResponse(
                    result
                );

        data.containers = await getContainerHealth();


        /*
         * Calculate network transfer rates
         * from successive sampled snapshots.
         *
         * This remains in memory only.
         */

        data.network =
            calculateNetworkRates(
                data.network,
                data.sampled_at
            );


        return data;

    }


    /*
     * =========================================================
     * REFRESH STATE
     * =========================================================
     */

    let refreshTimer =
        null;

    let currentRefreshInterval =
        5000;

    let refreshInProgress =
        false;


    /*
     * =========================================================
     * LOAD HARDWARE
     * =========================================================
     */

    async function loadTemperatures() {

        if (refreshInProgress) {
            return;
        }


        refreshInProgress =
            true;


        if (refreshButton) {

            refreshButton.disabled =
                true;

        }


        if (lastUpdate) {

            lastUpdate.textContent =
                "Reading hardware...";

        }


        if (sensorStatus) {

            sensorStatus.textContent =
                "READING";

        }


        if (hardwareTemperatureStatus) {

            hardwareTemperatureStatus.textContent =
                "READING";

        }


        try {

            const data =
                await getHardwareStatus();


            /*
             * Temperatures
             */

            renderSensors(
                data.temperatures
            );


            /*
             * System
             */

            renderSystem(
                data
            );


            /*
             * Bridge
             */

            renderBridgeInfo(
                data
            );

            renderContainerHealth(data.containers);


            /*
             * Server
             */

            if (serverStatus) {

                serverStatus.textContent =
                    LOCAL_DEVELOPMENT
                        ? "LOCAL TEST"
                        : "ONLINE";

            }


            /*
             * Timestamp
             *
             * V3 sampled_at is the source of truth.
             */

            if (lastUpdate) {

                const sampledDate =
                    data.sampled_at
                        ? new Date(
                            data.sampled_at
                        )
                        : new Date();


                lastUpdate.textContent =
                    "Updated " +
                    sampledDate.toLocaleTimeString();

            }

        }

        catch (error) {

            console.error(
                "Fluffy Fox Hardware Status error:",
                error
            );


            if (sensorGrid) {

                sensorGrid.innerHTML = `

                    <div class="loading">

                        <div class="loading-fox">
                            🦊
                        </div>

                        <span>

                            ${escapeHtml(
                                error &&
                                error.message
                                    ? error.message
                                    : "Unknown hardware status error."
                            )}

                        </span>

                    </div>

                `;

            }


            if (sensorStatus) {
                sensorStatus.textContent =
                    "ERROR";
            }


            if (serverStatus) {

                serverStatus.textContent =
                    LOCAL_DEVELOPMENT
                        ? "LOCAL TEST"
                        : "ERROR";

            }


            if (memoryStatus) {
                memoryStatus.textContent =
                    "ERROR";
            }


            if (swapStatus) {
                swapStatus.textContent =
                    "ERROR";
            }


            if (loadStatus) {
                loadStatus.textContent =
                    "ERROR";
            }


            if (uptimeStatus) {
                uptimeStatus.textContent =
                    "ERROR";
            }


            if (hardwareTemperatureStatus) {
                hardwareTemperatureStatus.textContent =
                    "ERROR";
            }


            if (hardwareApiStatus) {
                hardwareApiStatus.textContent =
                    "ERROR";
            }


            if (hardwareSensorCount) {
                hardwareSensorCount.textContent =
                    "ERROR";
            }


            if (lastUpdate) {

                lastUpdate.textContent =
                    "Hardware status read failed";

            }

        }

        finally {

            refreshInProgress =
                false;


            if (refreshButton) {

                refreshButton.disabled =
                    false;

            }

        }

    }


    /*
     * =========================================================
     * REFRESH SCHEDULER
     * =========================================================
     */

    function stopRefreshTimer() {

        if (
            refreshTimer !== null
        ) {

            clearInterval(
                refreshTimer
            );


            refreshTimer =
                null;

        }

    }


    function updateRefreshUI() {

        if (!refreshInterval) {
            return;
        }


        const milliseconds =
            Number(
                refreshInterval.value
            );


        currentRefreshInterval =
            Number.isFinite(
                milliseconds
            )
                ? milliseconds
                : 0;


        stopRefreshTimer();


        if (refreshStatus) {

            refreshStatus.textContent =

                currentRefreshInterval > 0
                    ? "● Auto-refresh enabled"
                    : "● Manual refresh";

        }


        if (refreshIntervalLabel) {

            refreshIntervalLabel.textContent =

                currentRefreshInterval > 0

                    ? `Every ${
                        currentRefreshInterval / 1000
                    } seconds`

                    : "Manual";

        }


        if (
            currentRefreshInterval > 0
        ) {

            refreshTimer =
                setInterval(
                    loadTemperatures,
                    currentRefreshInterval
                );

        }

    }


    /*
     * =========================================================
     * REFRESH BUTTON
     * =========================================================
     */

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadTemperatures
        );

    }


    /*
     * =========================================================
     * REFRESH INTERVAL
     * =========================================================
     */

    if (refreshInterval) {

        refreshInterval.addEventListener(
            "change",
            updateRefreshUI
        );

    }


    /*
     * =========================================================
     * INITIAL LOAD
     * =========================================================
     */

    loadTemperatures();

    updateRefreshUI();


    /*
     * =========================================================
     * DEBUG / DEVELOPMENT API
     * =========================================================
     */

    window.FluffyFox =
        window.FluffyFox || {};


    window.FluffyFox.loadTemperatures =
        loadTemperatures;


    window.FluffyFox.getSensorDisplayName =
        getSensorDisplayName;


    window.FluffyFox.normalizeHardwareResponse =
        normalizeHardwareResponse;


    window.FluffyFox.getHardwareStatus =
        getHardwareStatus;


})();
