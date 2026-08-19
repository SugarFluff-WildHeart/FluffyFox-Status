(function () {
    "use strict";

    /*
     * =========================================================
     * FLUFFY FOX STATUS
     * =========================================================
     *
     * Hardware Status Bridge V2
     *
     * V2 provides:
     *   - temperatures
     *   - CPU identification
     *   - storage identification
     *   - memory
     *   - swap
     *   - load
     *   - uptime
     *
     * Network hardware identification is NOT part of V2.
     *
     * Network-related temperature sensors are still supported
     * through local driver-name mapping. This is display-only
     * inference from the temperature sensor name.
     *
     * Hardware identifiers are never invented.
     * =========================================================
     */

    /*
     * =========================================================
     * DOM HELPERS
     * =========================================================
     */

    const $ = function (selector) {
        return document.querySelector(selector);
    };


    /*
     * =========================================================
     * DOM REFERENCES
     * =========================================================
     */

    const sensorGrid =
        $("#sensor-grid");

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
        typeof window.DuneAddon.request ===
            "function";


    /*
     * =========================================================
     * EXACT SENSOR DISPLAY MAP
     * =========================================================
     *
     * These are exact known names.
     *
     * Driver-family fallbacks are handled below.
     * =========================================================
     */

    const SENSOR_DISPLAY_MAP = {

        /*
         * ACPI
         */

        "acpitz Sensor 1":
            "ACPI Thermal Zone",

        "acpitz Sensor 2":
            "ACPI Thermal Zone 2",


        /*
         * CPU
         */

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
     * DISPLAY-ONLY.
     *
     * We do NOT claim that a driver name is a persistent
     * hardware identifier.
     *
     * Unknown drivers simply fall back to their original name.
     * =========================================================
     */

    const SENSOR_DRIVER_MAP = [

        /*
         * -----------------------------------------------------
         * REALTEK NETWORK
         * -----------------------------------------------------
         */

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


        /*
         * -----------------------------------------------------
         * BROADCOM NETWORK
         * -----------------------------------------------------
         */

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


        /*
         * -----------------------------------------------------
         * INTEL NETWORK
         * -----------------------------------------------------
         */

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


        /*
         * -----------------------------------------------------
         * MELLANOX / NVIDIA NETWORK
         * -----------------------------------------------------
         */

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


        /*
         * -----------------------------------------------------
         * MARVELL / AQUANTIA NETWORK
         * -----------------------------------------------------
         */

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


        /*
         * -----------------------------------------------------
         * QUALCOMM / ATHEROS NETWORK
         * -----------------------------------------------------
         */

        {
            pattern:
                /^alx(?:[_\s:-]|$)/i,

            label:
                "Qualcomm / Atheros Network Adapter"
        },


        /*
         * -----------------------------------------------------
         * NVIDIA / AMD GPU TEMPERATURE
         * -----------------------------------------------------
         *
         * Driver family only.
         * GPU model is NOT inferred.
         * -----------------------------------------------------
         */

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


        /*
         * -----------------------------------------------------
         * INTEL GPU TEMPERATURE
         * -----------------------------------------------------
         */

        {
            pattern:
                /^i915(?:[_\s:-]|$)/i,

            label:
                "Intel GPU"
        },


        /*
         * -----------------------------------------------------
         * NVME
         * -----------------------------------------------------
         */

        {
            pattern:
                /^nvme(?:[_\s:-]|$)/i,

            label:
                "NVMe"
        },


        /*
         * -----------------------------------------------------
         * AMD CPU TEMPERATURE
         * -----------------------------------------------------
         */

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


        /*
         * -----------------------------------------------------
         * BRIDGE-PROVIDED FRIENDLY NAME
         * -----------------------------------------------------
         */

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


        /*
         * -----------------------------------------------------
         * EXACT LOCAL MAP
         * -----------------------------------------------------
         */

        if (
            Object.prototype.hasOwnProperty.call(
                SENSOR_DISPLAY_MAP,
                name
            )
        ) {

            return SENSOR_DISPLAY_MAP[name];

        }


        /*
         * -----------------------------------------------------
         * CORETEMP PACKAGE FALLBACK
         * -----------------------------------------------------
         *
         * IMPORTANT:
         *
         * This MUST happen before the generic driver map.
         * Otherwise "coretemp Core N" would be caught by a
         * generic coretemp family rule.
         *
         * This handles any package number dynamically.
         * -----------------------------------------------------
         */

        const packageMatch =
            name.match(
                /^coretemp\s+Package\s+id\s+(\d+)$/i
            );


        if (packageMatch) {

            const packageId =
                Number(
                    packageMatch[1]
                );


            if (
                packageId === 0
            ) {

                return "CPU Package";

            }


            return (
                "CPU Package " +
                (packageId + 1)
            );

        }


        /*
         * -----------------------------------------------------
         * CORETEMP CORE FALLBACK
         * -----------------------------------------------------
         *
         * Handles any CPU core number.
         *
         * Examples:
         *
         * coretemp Core 0
         * coretemp Core 7
         * coretemp Core 15
         * coretemp Core 31
         * coretemp Core 63
         * -----------------------------------------------------
         */

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


        /*
         * -----------------------------------------------------
         * ACPI FALLBACK
         * -----------------------------------------------------
         */

        if (
            name
                .toLowerCase()
                .startsWith("acpitz")
        ) {

            const acpiMatch =
                name.match(
                    /Sensor\s+(\d+)/i
                );


            if (
                acpiMatch
            ) {

                const sensorNumber =
                    Number(
                        acpiMatch[1]
                    );


                if (
                    sensorNumber === 1
                ) {

                    return "ACPI Thermal Zone";

                }


                return (
                    "ACPI Thermal Zone " +
                    sensorNumber
                );

            }


            return "ACPI Thermal Zone";

        }


        /*
         * -----------------------------------------------------
         * DRIVER / FAMILY MAP
         * -----------------------------------------------------
         *
         * This comes AFTER specific CPU/ACPI matching.
         *
         * That is the actual fix in this version.
         * -----------------------------------------------------
         */

        for (
            const entry of SENSOR_DRIVER_MAP
        ) {

            if (
                entry.pattern.test(name)
            ) {

                return entry.label;

            }

        }


        /*
         * -----------------------------------------------------
         * UNKNOWN
         * -----------------------------------------------------
         *
         * Never destroy information we don't understand.
         * -----------------------------------------------------
         */

        return name;

    }


    /*
     * =========================================================
     * LOCAL DEVELOPMENT MOCK
     * =========================================================
     *
     * Used only when index.html is opened directly.
     *
     * No Network hardware object is included.
     *
     * Network driver examples exist ONLY as temperature
     * sensors so the mapping can be tested.
     * =========================================================
     */

    function getMockData() {

        return {

            version:
                2,


            /*
             * CPU
             */

            cpu: {

                id:
                    "cpu:0",

                manufacturer:
                    "AMD",

                model:
                    "Ryzen 9 5950X"

            },


            /*
             * Memory
             */

            memory: {

                total_kb:
                    16777216,

                available_kb:
                    8388608,

                used_kb:
                    8388608,

                percent:
                    50.0

            },


            /*
             * Storage
             */

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
                        "sata"

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


            /*
             * Temperatures.
             */

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


            /*
             * Swap
             */

            swap: {

                total_kb:
                    4194304,

                free_kb:
                    4194304,

                used_kb:
                    0,

                percent:
                    0.0

            },


            /*
             * Load
             */

            load: {

                one:
                    0.25,

                five:
                    0.20,

                fifteen:
                    0.18

            },


            /*
             * Uptime
             */

            uptime_seconds:
                86400

        };

    }


    /*
     * =========================================================
     * HTML ESCAPE
     * =========================================================
     */

    function escapeHtml(value) {

        return String(
            value ?? ""
        )

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );

    }


    /*
     * =========================================================
     * FORMAT BYTES
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


        if (
            value === 0
        ) {

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


        let number =
            value;

        let unit =
            0;


        while (
            number >= 1024 &&
            unit <
                units.length - 1
        ) {

            number /=
                1024;

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


    /*
     * =========================================================
     * FORMAT KB
     * =========================================================
     */

    function formatBytesFromKB(kb) {

        return formatBytes(
            Number(kb) * 1024
        );

    }


    /*
     * =========================================================
     * FORMAT UPTIME
     * =========================================================
     */

    function formatUptime(seconds) {

        let value =
            Math.max(
                0,
                Number(seconds) || 0
            );


        const days =
            Math.floor(
                value / 86400
            );


        value %=
            86400;


        const hours =
            Math.floor(
                value / 3600
            );


        value %=
            3600;


        const minutes =
            Math.floor(
                value / 60
            );


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

        if (
            temperature >= 85
        ) {

            return {

                name:
                    "CRITICAL",

                className:
                    "critical"

            };

        }


        if (
            temperature >= 75
        ) {

            return {

                name:
                    "HOT",

                className:
                    "hot"

            };

        }


        if (
            temperature >= 60
        ) {

            return {

                name:
                    "WARM",

                className:
                    "warm"

            };

        }


        return {

            name:
                "NORMAL",

            className:
                "normal"

        };

    }


    /*
     * =========================================================
     * NORMALIZE SENSOR
     * =========================================================
     */

    function normalizeSensor(
        sensor
    ) {

        if (
            typeof sensor === "string"
        ) {

            return {

                name:
                    sensor,

                temperature:
                    NaN

            };

        }


        if (
            !sensor ||
            typeof sensor !== "object"
        ) {

            return {

                name:
                    "Unknown Sensor",

                temperature:
                    NaN

            };

        }


        const temperature =
            Number(

                sensor.temperature ??
                sensor.temp ??
                sensor.value ??
                sensor.celsius

            );


        return {

            ...sensor,

            name:

                sensor.name ??
                sensor.label ??
                sensor.sensor ??
                sensor.id ??
                "Unknown Sensor",

            temperature

        };

    }


    /*
     * =========================================================
     * HARDWARE HELPERS
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


    function getManufacturer(
        object
    ) {

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


    function getModel(
        object
    ) {

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


    function getSizeBytes(
        object
    ) {

        return firstValue(

            object,

            [

                "size_bytes",
                "sizeBytes",
                "capacity_bytes",
                "capacityBytes",
                "bytes"

            ]

        );

    }


    function getFriendlyHardwareName(
        object
    ) {

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
     * NORMALIZE HARDWARE RESPONSE
     * =========================================================
     */

    function normalizeHardwareResponse(
        result
    ) {

        if (
            !result ||
            typeof result !== "object"
        ) {

            throw new Error(
                "Invalid Hardware Status response."
            );

        }


        let data =
            result;


        /*
         * data wrapper
         */

        if (
            data.data &&
            typeof data.data === "object"
        ) {

            data =
                data.data;

        }


        /*
         * result wrapper
         */

        if (
            data.result &&
            typeof data.result === "object"
        ) {

            data =
                data.result;

        }


        /*
         * Temperatures
         */

        const rawTemperatures =

            Array.isArray(
                data.temperatures
            )

                ? data.temperatures

                : (

                    Array.isArray(
                        data.sensors
                    )

                        ? data.sensors

                        : []

                );


        const temperatures =
            rawTemperatures.map(
                normalizeSensor
            );


        /*
         * CPU
         */

        let cpu =

            data.cpu ??
            data.processor ??
            data.cpu_info ??
            data.cpuInfo ??
            null;


        /*
         * Memory
         */

        const memory =

            data.memory ??
            data.ram ??
            null;


        /*
         * Storage
         */

        let storage =

            data.storage ??
            data.storages ??
            data.disks ??
            data.drives ??
            [];


        if (
            !Array.isArray(storage)
        ) {

            storage = [

                storage

            ];

        }


        /*
         * Some APIs may expose CPU directly.
         */

        if (
            !cpu
        ) {

            if (

                data.cpu_model ||
                data.cpuModel ||
                data.processor_model

            ) {

                cpu = {

                    manufacturer:

                        data.cpu_manufacturer ??
                        data.cpuManufacturer ??
                        data.cpu_vendor ??
                        null,

                    model:

                        data.cpu_model ??
                        data.cpuModel ??
                        data.processor_model ??
                        null,

                    name:

                        data.cpu_name ??
                        data.cpuName ??
                        null

                };

            }

        }


        /*
         * IMPORTANT:
         *
         * No network normalization here.
         *
         * Hardware Status Bridge V2 does not expose
         * a network hardware section.
         */

        return {

            ...data,

            version:

                data.version ??
                data.api_version ??
                data.apiVersion ??
                2,

            temperatures,

            cpu,

            memory,

            storage,

            swap:

                data.swap ??
                null,

            load:

                data.load ??
                null,

            uptime_seconds:

                data.uptime_seconds ??
                data.uptimeSeconds ??
                data.uptime ??
                0

        };

    }


    /*
     * =========================================================
     * CPU DISPLAY
     * =========================================================
     */

    function renderCpuInfo(
        cpu
    ) {

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
                    "V2 CPU identifier unavailable";

            }


            return;

        }


        const friendly =
            getFriendlyHardwareName(
                cpu
            );


        const manufacturer =
            getManufacturer(
                cpu
            );


        const model =
            getModel(
                cpu
            );


        let primary =
            friendly ??
            model;


        if (
            !primary
        ) {

            primary =
                manufacturer ??
                "Not exposed by bridge";

        }


        if (cpuInfo) {

            cpuInfo.textContent =
                String(primary);

        }


        if (cpuInfoDetail) {

            if (
                manufacturer &&
                model
            ) {

                cpuInfoDetail.textContent =
                    `${manufacturer} • ${model}`;

            }

            else if (
                manufacturer
            ) {

                cpuInfoDetail.textContent =
                    String(manufacturer);

            }

            else {

                cpuInfoDetail.textContent =
                    "V2 CPU identifier";

            }

        }

    }


    /*
     * =========================================================
     * MEMORY INFO DISPLAY
     * =========================================================
     */

    function renderMemoryInfo(
        memory
    ) {

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
                    "V2 memory information unavailable";

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
     * HARDWARE LIST
     * =========================================================
     */

    function normalizeHardwareList(
        items
    ) {

        if (
            !Array.isArray(items)
        ) {

            return [];

        }


        return items.filter(

            item =>
                item &&
                typeof item === "object"

        );

    }


    /*
     * =========================================================
     * STORAGE DISPLAY
     * =========================================================
     *
     * Layout:
     *
     * Manufacturer
     * Model
     * Bus • Size
     *
     * No fake Example labels.
     * =========================================================
     */

    function renderStorageInfo(
        storage
    ) {

        if (
            !storageInfo
        ) {

            return;

        }


        const items =
            normalizeHardwareList(
                storage
            );


        if (
            items.length === 0
        ) {

            storageInfo.innerHTML = `

                <div class="hardware-list-empty">

                    No storage identifiers
                    exposed by bridge.

                </div>

            `;

            return;

        }


        storageInfo.innerHTML =

            items.map(

                item => {

                    const manufacturer =
                        getManufacturer(
                            item
                        );


                    const model =
                        getModel(
                            item
                        );


                    const friendly =
                        getFriendlyHardwareName(
                            item
                        );


                    const bus =
                        firstValue(

                            item,

                            [

                                "bus",
                                "type",
                                "kind"

                            ]

                        );


                    const size =
                        getSizeBytes(
                            item
                        );


                    const primary =

                        friendly ??
                        model ??
                        manufacturer ??
                        "Unknown Storage Device";


                    const details = [];


                    if (
                        manufacturer &&
                        model &&
                        manufacturer !== model
                    ) {

                        details.push(
                            `${manufacturer} • ${model}`
                        );

                    }

                    else if (
                        model
                    ) {

                        details.push(
                            String(model)
                        );

                    }

                    else if (
                        manufacturer
                    ) {

                        details.push(
                            String(manufacturer)
                        );

                    }


                    if (
                        bus
                    ) {

                        details.push(

                            String(bus)
                                .toUpperCase()

                        );

                    }


                    if (
                        size !== null
                    ) {

                        details.push(
                            formatBytes(size)
                        );

                    }


                    return `

                        <div
                            class="hardware-list-item"
                        >

                            <div
                                class="hardware-list-name"
                            >

                                ${escapeHtml(
                                    primary
                                )}

                            </div>

                            <div
                                class="hardware-list-detail"
                            >

                                ${escapeHtml(

                                    details.join(
                                        " • "
                                    ) ||

                                    "Identifier exposed by bridge"

                                )}

                            </div>

                        </div>

                    `;

                }

            ).join("");

    }


    /*
     * =========================================================
     * RENDER TEMPERATURES
     * =========================================================
     */

    function renderSensors(
        sensors
    ) {

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


            if (
                hardwareTemperatureStatus
            ) {

                hardwareTemperatureStatus.textContent =
                    "NO DATA";

            }


            if (
                hardwareSensorCount
            ) {

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


        if (
            sensorGrid
        ) {

            sensorGrid.innerHTML =

                validSensors

                    .map(

                        sensor => {

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

                                <div
                                    class="sensor"
                                >

                                    <div
                                        class="sensor-name"
                                    >

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

                        }

                    )

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


        if (
            hardwareTemperatureStatus
        ) {

            hardwareTemperatureStatus.textContent =
                "LIVE";

        }


        if (
            hardwareSensorCount
        ) {

            hardwareSensorCount.textContent =
                String(
                    validSensors.length
                );

        }

    }


    /*
     * =========================================================
     * RENDER SYSTEM
     * =========================================================
     */

    function renderSystem(
        data
    ) {

        /*
         * MEMORY
         */

        if (
            data.memory
        ) {

            const percent =
                Number(
                    data.memory.percent ??
                    0
                );


            if (memoryStatus) {

                memoryStatus.textContent =

                    `${percent.toFixed(1)}% ` +

                    `(${formatBytesFromKB(
                        data.memory.used_kb
                    )})`;

            }


            if (
                memoryBar
            ) {

                memoryBar.style.width =

                    `${Math.min(
                        100,
                        Math.max(
                            0,
                            percent
                        )
                    )}%`;

            }

        }

        else {

            if (memoryStatus) {

                memoryStatus.textContent =
                    "UNKNOWN";

            }


            if (
                memoryBar
            ) {

                memoryBar.style.width =
                    "0%";

            }

        }


        /*
         * SWAP
         */

        if (
            data.swap
        ) {

            const percent =
                Number(
                    data.swap.percent ??
                    0
                );


            if (swapStatus) {

                swapStatus.textContent =

                    `${percent.toFixed(1)}% ` +

                    `(${formatBytesFromKB(
                        data.swap.used_kb
                    )})`;

            }


            if (
                swapBar
            ) {

                swapBar.style.width =

                    `${Math.min(
                        100,
                        Math.max(
                            0,
                            percent
                        )
                    )}%`;

            }

        }

        else {

            if (swapStatus) {

                swapStatus.textContent =
                    "UNKNOWN";

            }


            if (
                swapBar
            ) {

                swapBar.style.width =
                    "0%";

            }

        }


        /*
         * LOAD
         */

        if (
            data.load
        ) {

            if (loadStatus) {

                loadStatus.textContent =

                    `${Number(
                        data.load.one ?? 0
                    ).toFixed(2)} / ` +

                    `${Number(
                        data.load.five ?? 0
                    ).toFixed(2)} / ` +

                    `${Number(
                        data.load.fifteen ?? 0
                    ).toFixed(2)}`;

            }

        }

        else {

            if (loadStatus) {

                loadStatus.textContent =
                    "UNKNOWN";

            }

        }


        /*
         * UPTIME
         */

        if (
            uptimeStatus
        ) {

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


        /*
         * NO renderNetworkInfo().
         *
         * V2 has no network hardware API.
         */

    }


    /*
     * =========================================================
     * BRIDGE METADATA
     * =========================================================
     */

    function renderBridgeInfo(
        data
    ) {

        const version =
            data.version ??
            2;


        if (
            hardwareBridgeVersion
        ) {

            hardwareBridgeVersion.textContent =
                `V${version}`;

        }


        if (
            hardwareBridgeDetail
        ) {

            hardwareBridgeDetail.textContent =
                "Hardware Status Bridge";

        }


        if (
            hardwareApiStatus
        ) {

            hardwareApiStatus.textContent =
                "ACTIVE";

        }

    }


    /*
     * =========================================================
     * HARDWARE STATUS PROVIDER
     * =========================================================
     */

    async function getHardwareStatus() {

        /*
         * LOCAL HTML TEST
         */

        if (
            LOCAL_DEVELOPMENT
        ) {

            await new Promise(

                resolve =>
                    setTimeout(
                        resolve,
                        150
                    )

            );


            return getMockData();

        }


        /*
         * DUNE CONSOLE
         */

        if (
            !HAS_DUNE_BRIDGE
        ) {

            throw new Error(
                "DuneAddon bridge unavailable."
            );

        }


        /*
         * HARDWARE STATUS BRIDGE V2
         */

        const result =

            await window.DuneAddon.request(
                "server.hardware.status"
            );


        return normalizeHardwareResponse(
            result
        );

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

        if (
            refreshInProgress
        ) {

            return;

        }


        refreshInProgress =
            true;


        if (
            refreshButton
        ) {

            refreshButton.disabled =
                true;

        }


        if (
            lastUpdate
        ) {

            lastUpdate.textContent =
                "Reading hardware...";

        }


        if (
            sensorStatus
        ) {

            sensorStatus.textContent =
                "READING";

        }


        if (
            hardwareTemperatureStatus
        ) {

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


            /*
             * Server
             */

            if (
                serverStatus
            ) {

                serverStatus.textContent =

                    LOCAL_DEVELOPMENT
                        ? "LOCAL TEST"
                        : "ONLINE";

            }


            /*
             * Timestamp
             */

            if (
                lastUpdate
            ) {

                lastUpdate.textContent =

                    "Updated " +

                    new Date()
                        .toLocaleTimeString();

            }

        }

        catch (
            error
        ) {

            console.error(

                "Fluffy Fox Hardware Status error:",
                error

            );


            if (
                sensorGrid
            ) {

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


            if (
                sensorStatus
            ) {

                sensorStatus.textContent =
                    "ERROR";

            }


            if (
                serverStatus
            ) {

                serverStatus.textContent =

                    LOCAL_DEVELOPMENT
                        ? "LOCAL TEST"
                        : "ERROR";

            }


            if (
                memoryStatus
            ) {

                memoryStatus.textContent =
                    "ERROR";

            }


            if (
                swapStatus
            ) {

                swapStatus.textContent =
                    "ERROR";

            }


            if (
                loadStatus
            ) {

                loadStatus.textContent =
                    "ERROR";

            }


            if (
                uptimeStatus
            ) {

                uptimeStatus.textContent =
                    "ERROR";

            }


            if (
                hardwareTemperatureStatus
            ) {

                hardwareTemperatureStatus.textContent =
                    "ERROR";

            }


            if (
                hardwareApiStatus
            ) {

                hardwareApiStatus.textContent =
                    "ERROR";

            }


            if (
                hardwareSensorCount
            ) {

                hardwareSensorCount.textContent =
                    "ERROR";

            }


            if (
                lastUpdate
            ) {

                lastUpdate.textContent =
                    "Hardware status read failed";

            }

        }


        finally {

            refreshInProgress =
                false;


            if (
                refreshButton
            ) {

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

        if (
            !refreshInterval
        ) {

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


        if (
            refreshStatus
        ) {

            refreshStatus.textContent =

                currentRefreshInterval > 0

                    ? "● Auto-refresh enabled"

                    : "● Manual refresh";

        }


        if (
            refreshIntervalLabel
        ) {

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

    if (
        refreshButton
    ) {

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

    if (
        refreshInterval
    ) {

        refreshInterval.addEventListener(

            "change",

            function () {

                updateRefreshUI();

            }

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
     * DEBUG HELPERS
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