(function () {

    "use strict";

    /*
     * =========================================================
     * FLUFFY FOX STATUS
     * =========================================================
     *
     * Front-end UI for the Dune addon.
     *
     * IMPORTANT:
     *
     * Real hardware/system information comes from:
     *
     *     server.hardware.status
     *
     * The old FluffyFox.Sensor.read API is NOT used here.
     *
     * =========================================================
     */


    /*
     * ---------------------------------------------------------
     * DOM
     * ---------------------------------------------------------
     */

    const sensorGrid =
        document.querySelector("#sensor-grid");

    const lastUpdate =
        document.querySelector("#last-update");

    const refreshButton =
        document.querySelector("#refresh-button");

    const refreshLabel =
        document.querySelector("#refresh-label");

    const refreshIcon =
        document.querySelector("#refresh-icon");

    const serverStatus =
        document.querySelector("#server-status");

    const sensorStatus =
        document.querySelector("#sensor-status");

    const memoryStatus =
        document.querySelector("#memory-status");

    const swapStatus =
        document.querySelector("#swap-status");

    const loadStatus =
        document.querySelector("#load-status");

    const uptimeStatus =
        document.querySelector("#uptime-status");

    const memoryBar =
        document.querySelector("#memory-bar");

    const swapBar =
        document.querySelector("#swap-bar");

    const healthBanner =
        document.querySelector("#health-banner");

    const healthTitle =
        document.querySelector("#health-title");

    const healthMessage =
        document.querySelector("#health-message");

    const healthState =
        document.querySelector("#health-state");


    /*
     * ---------------------------------------------------------
     * REFRESH SETTINGS
     * ---------------------------------------------------------
     */

    const refreshIntervalSelect =
        document.querySelector(
            "#refresh-interval"
        );

    const refreshStatus =
        document.querySelector(
            "#refresh-status"
        );

    const refreshIntervalLabel =
        document.querySelector(
            "#refresh-interval-label"
        );

    const REFRESH_STORAGE_KEY =
        "fluffyFox.refreshInterval";

    const REFRESH_INTERVALS = [
        0,
        5000,
        10000,
        30000,
        60000
    ];

    const DEFAULT_REFRESH_INTERVAL =
        5000;

    let refreshTimer = null;

    let requestInFlight = false;


    /*
     * ---------------------------------------------------------
     * ENVIRONMENT
     * ---------------------------------------------------------
     */

    const LOCAL_DEVELOPMENT =
        window.parent === window;

    const HAS_DUNE_BRIDGE =
        !LOCAL_DEVELOPMENT &&
        window.DuneAddon &&
        typeof window.DuneAddon.request === "function";


    /*
     * ---------------------------------------------------------
     * REFRESH INTERVAL
     * ---------------------------------------------------------
     */

    function getRefreshInterval() {

        const stored =
            Number(
                localStorage.getItem(
                    REFRESH_STORAGE_KEY
                )
            );

        if (
            REFRESH_INTERVALS.includes(
                stored
            )
        ) {
            return stored;
        }

        return DEFAULT_REFRESH_INTERVAL;
    }


    function formatRefreshInterval(
        interval
    ) {

        if (interval === 0) {
            return "Manual";
        }

        if (interval < 60000) {

            const seconds =
                interval / 1000;

            return (
                "Every " +
                seconds +
                " second" +
                (
                    seconds === 1
                        ? ""
                        : "s"
                )
            );
        }

        return "Every 60 seconds";
    }


    function updateRefreshMeta(
        interval
    ) {

        if (refreshIntervalSelect) {

            refreshIntervalSelect.value =
                String(interval);
        }

        if (refreshStatus) {

            refreshStatus.textContent =
                interval === 0
                    ? "● Auto-refresh disabled"
                    : "● Auto-refresh enabled";
        }

        if (refreshIntervalLabel) {

            refreshIntervalLabel.textContent =
                formatRefreshInterval(
                    interval
                );
        }
    }


    function startAutoRefresh() {

        if (refreshTimer !== null) {

            window.clearInterval(
                refreshTimer
            );

            refreshTimer = null;
        }

        const interval =
            getRefreshInterval();

        updateRefreshMeta(
            interval
        );

        if (interval === 0) {
            return;
        }

        refreshTimer =
            window.setInterval(
                function () {

                    /*
                     * Do not stack requests.
                     *
                     * If the previous request is still
                     * running, wait for the next interval.
                     */

                    if (!requestInFlight) {
                        loadTemperatures();
                    }

                },
                interval
            );
    }


    function setRefreshInterval(
        interval
    ) {

        interval =
            Number(interval);

        if (
            !REFRESH_INTERVALS.includes(
                interval
            )
        ) {
            interval =
                DEFAULT_REFRESH_INTERVAL;
        }

        localStorage.setItem(
            REFRESH_STORAGE_KEY,
            String(interval)
        );

        startAutoRefresh();
    }


    function initializeRefreshSettings() {

        if (!refreshIntervalSelect) {
            return;
        }

        const interval =
            getRefreshInterval();

        refreshIntervalSelect.value =
            String(interval);

        refreshIntervalSelect.addEventListener(
            "change",
            function () {

                setRefreshInterval(
                    this.value
                );

            }
        );

        updateRefreshMeta(
            interval
        );
    }


    /*
     * ---------------------------------------------------------
     * LOCAL DEVELOPMENT MOCK
     * ---------------------------------------------------------
     *
     * Used only when index.html is opened directly.
     *
     * Never used inside Dune Console.
     */

    function getMockData() {

        return {

            version: 1,

            temperatures: [

                {
                    name: "CPU",
                    temperature: 47.0
                },

                {
                    name: "CPU Package",
                    temperature: 49.0
                },

                {
                    name: "System",
                    temperature: 34.0
                },

                {
                    name: "NVMe",
                    temperature: 38.0
                },

                {
                    name: "SSD",
                    temperature: 36.0
                },

                {
                    name: "GPU",
                    temperature: 42.0
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
                    50.0

            },

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
     * ---------------------------------------------------------
     * TEMPERATURE STATE
     * ---------------------------------------------------------
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
     * ---------------------------------------------------------
     * HTML ESCAPE
     * ---------------------------------------------------------
     */

    function escapeHtml(
        value
    ) {

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
     * ---------------------------------------------------------
     * FORMAT
     * ---------------------------------------------------------
     */

    function formatBytesFromKB(
        kb
    ) {

        const valueKB =
            Number(kb);

        if (
            !Number.isFinite(valueKB) ||
            valueKB < 0
        ) {
            return "UNKNOWN";
        }

        const units = [
            "KB",
            "MB",
            "GB",
            "TB"
        ];

        let value =
            valueKB;

        let unit =
            0;

        while (
            value >= 1024 &&
            unit < units.length - 1
        ) {

            value /= 1024;

            unit++;
        }

        return (
            value.toFixed(1) +
            " " +
            units[unit]
        );
    }


    function formatUptime(
        seconds
    ) {

        seconds =
            Math.max(
                0,
                Number(seconds) || 0
            );

        const days =
            Math.floor(
                seconds / 86400
            );

        seconds %= 86400;

        const hours =
            Math.floor(
                seconds / 3600
            );

        seconds %= 3600;

        const minutes =
            Math.floor(
                seconds / 60
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
     * ---------------------------------------------------------
     * SET BAR STATE
     * ---------------------------------------------------------
     */

    function setMetricBar(
        element,
        percentage
    ) {

        if (!element) {
            return;
        }

        let value =
            Number(percentage);

        if (!Number.isFinite(value)) {
            value = 0;
        }

        value =
            Math.max(
                0,
                Math.min(
                    100,
                    value
                )
            );

        element.style.width =
            value.toFixed(1) + "%";

        element.classList.remove(
            "warning",
            "hot",
            "critical"
        );

        if (value >= 90) {

            element.classList.add(
                "critical"
            );

        } else if (value >= 75) {

            element.classList.add(
                "hot"
            );

        } else if (value >= 60) {

            element.classList.add(
                "warning"
            );
        }
    }


    /*
     * ---------------------------------------------------------
     * HEALTH
     * ---------------------------------------------------------
     */

    function updateHealth(
        data
    ) {

        if (!healthBanner) {
            return;
        }

        healthBanner.classList.remove(
            "health-loading",
            "health-healthy",
            "health-warning",
            "health-critical",
            "health-error"
        );

        let highestTemperature =
            null;

        if (
            Array.isArray(
                data?.temperatures
            )
        ) {

            for (
                const sensor
                of data.temperatures
            ) {

                const temperature =
                    Number(
                        sensor?.temperature
                    );

                if (
                    Number.isFinite(
                        temperature
                    )
                ) {

                    if (
                        highestTemperature === null ||
                        temperature > highestTemperature
                    ) {
                        highestTemperature =
                            temperature;
                    }
                }
            }
        }

        const memoryPercent =
            Number(
                data?.memory?.percent
            );

        const swapPercent =
            Number(
                data?.swap?.percent
            );


        /*
         * Critical
         */

        if (
            (
                highestTemperature !== null &&
                highestTemperature >= 85
            ) ||
            (
                Number.isFinite(memoryPercent) &&
                memoryPercent >= 95
            )
        ) {

            healthBanner.classList.add(
                "health-critical"
            );

            if (healthTitle) {
                healthTitle.textContent =
                    "SYSTEM CRITICAL";
            }

            if (healthMessage) {
                healthMessage.textContent =
                    highestTemperature !== null &&
                    highestTemperature >= 85
                        ? "Hardware temperature is critically high."
                        : "System memory usage is critically high.";
            }

            if (healthState) {
                healthState.textContent =
                    "CRITICAL";
            }

            return;
        }


        /*
         * Warning
         */

        if (
            (
                highestTemperature !== null &&
                highestTemperature >= 75
            ) ||
            (
                Number.isFinite(memoryPercent) &&
                memoryPercent >= 80
            ) ||
            (
                Number.isFinite(swapPercent) &&
                swapPercent >= 50
            )
        ) {

            healthBanner.classList.add(
                "health-warning"
            );

            if (healthTitle) {
                healthTitle.textContent =
                    "SYSTEM WARNING";
            }

            if (healthMessage) {
                healthMessage.textContent =
                    "One or more system resources require attention.";
            }

            if (healthState) {
                healthState.textContent =
                    "WARNING";
            }

            return;
        }


        /*
         * Healthy
         */

        healthBanner.classList.add(
            "health-healthy"
        );

        if (healthTitle) {
            healthTitle.textContent =
                "SYSTEM HEALTHY";
        }

        if (healthMessage) {
            healthMessage.textContent =
                "Server hardware and system resources are operating normally.";
        }

        if (healthState) {
            healthState.textContent =
                "HEALTHY";
        }
    }


    /*
     * ---------------------------------------------------------
     * RENDER TEMPERATURES
     * ---------------------------------------------------------
     */

    function renderSensors(
        sensors
    ) {

        if (!sensorGrid) {
            return;
        }

        if (
            !Array.isArray(sensors) ||
            sensors.length === 0
        ) {

            sensorGrid.innerHTML = `
                <div class="loading">
                    No temperature sensors found.
                </div>
            `;

            if (sensorStatus) {
                sensorStatus.textContent =
                    "NO DATA";
            }

            return;
        }


        const renderedSensors =
            sensors
                .map(
                    sensor => {

                        const temperature =
                            Number(
                                sensor?.temperature
                            );

                        if (
                            !Number.isFinite(
                                temperature
                            )
                        ) {
                            return "";
                        }

                        const state =
                            getTemperatureState(
                                temperature
                            );

                        /*
                         * IMPORTANT FIX:
                         *
                         * Apply the state class to the
                         * sensor container itself.
                         *
                         * Previously the state class only
                         * existed on the temperature text,
                         * meaning .sensor.normal etc. never
                         * matched.
                         */

                        return `
                            <div class="sensor ${state.className}">

                                <div class="sensor-name">
                                    ${escapeHtml(
                                        sensor?.name ||
                                        "Unknown Sensor"
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


        sensorGrid.innerHTML =
            renderedSensors ||
            `
                <div class="loading">
                    No valid temperature readings.
                </div>
            `;


        const validCount =
            sensors.filter(
                sensor =>
                    Number.isFinite(
                        Number(
                            sensor?.temperature
                        )
                    )
            ).length;

        if (sensorStatus) {

            sensorStatus.textContent =
                `${validCount} SENSOR${
                    validCount === 1
                        ? ""
                        : "S"
                } OK`;
        }
    }


    /*
     * ---------------------------------------------------------
     * SYSTEM
     * ---------------------------------------------------------
     */

    function renderSystem(
        data
    ) {

        /*
         * MEMORY
         */

        if (data?.memory) {

            const percent =
                Number(
                    data.memory.percent
                );

            memoryStatus.textContent =
                Number.isFinite(percent)
                    ? `${percent.toFixed(1)}% ` +
                      `(${formatBytesFromKB(
                          data.memory.used_kb
                      )})`
                    : "UNKNOWN";

            setMetricBar(
                memoryBar,
                percent
            );

        } else {

            memoryStatus.textContent =
                "UNKNOWN";

            setMetricBar(
                memoryBar,
                0
            );
        }


        /*
         * SWAP
         */

        if (data?.swap) {

            const percent =
                Number(
                    data.swap.percent
                );

            swapStatus.textContent =
                Number.isFinite(percent)
                    ? `${percent.toFixed(1)}% ` +
                      `(${formatBytesFromKB(
                          data.swap.used_kb
                      )})`
                    : "UNKNOWN";

            setMetricBar(
                swapBar,
                percent
            );

        } else {

            swapStatus.textContent =
                "UNKNOWN";

            setMetricBar(
                swapBar,
                0
            );
        }


        /*
         * LOAD
         */

        if (data?.load) {

            loadStatus.textContent =
                `${Number(
                    data.load.one || 0
                ).toFixed(2)} / ` +
                `${Number(
                    data.load.five || 0
                ).toFixed(2)} / ` +
                `${Number(
                    data.load.fifteen || 0
                ).toFixed(2)}`;

        } else {

            loadStatus.textContent =
                "UNKNOWN";
        }


        /*
         * UPTIME
         */

        uptimeStatus.textContent =
            formatUptime(
                data?.uptime_seconds
            );
    }


    /*
     * ---------------------------------------------------------
     * SENSOR PROVIDER
     * ---------------------------------------------------------
     */

    async function getSensorData() {

        /*
         * LOCAL BROWSER PREVIEW
         */

        if (LOCAL_DEVELOPMENT) {

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        250
                    )
            );

            return getMockData();
        }


        /*
         * REAL DUNE CONSOLE
         */

        if (!HAS_DUNE_BRIDGE) {

            throw new Error(
                "DuneAddon bridge unavailable."
            );
        }


        /*
         * REAL CORE REQUEST
         *
         * This is the ONLY hardware request.
         */

        const result =
            await window.DuneAddon.request(
                "server.hardware.status"
            );


        if (
            !result ||
            typeof result !== "object"
        ) {

            throw new Error(
                "Invalid sensor response."
            );
        }


        return result;
    }


    /*
     * ---------------------------------------------------------
     * MAIN LOAD
     * ---------------------------------------------------------
     */

    async function loadTemperatures() {

        /*
         * Prevent overlapping requests.
         */

        if (requestInFlight) {
            return;
        }

        requestInFlight =
            true;


        if (refreshButton) {

            refreshButton.disabled =
                true;
        }

        if (refreshLabel) {
            refreshLabel.textContent =
                "Reading...";
        }

        if (refreshIcon) {
            refreshIcon.textContent =
                "↻";
        }

        if (lastUpdate) {

            lastUpdate.textContent =
                "Reading sensors...";
        }

        if (sensorStatus) {

            sensorStatus.textContent =
                "READING";
        }


        try {

            const data =
                await getSensorData();


            /*
             * Validate basic response.
             */

            if (
                !data ||
                typeof data !== "object"
            ) {
                throw new Error(
                    "Server returned an invalid hardware status response."
                );
            }


            /*
             * Render data.
             */

            renderSensors(
                data.temperatures
            );

            renderSystem(
                data
            );

            updateHealth(
                data
            );


            /*
             * Server state.
             */

            if (serverStatus) {

                serverStatus.textContent =
                    LOCAL_DEVELOPMENT
                        ? "LOCAL TEST"
                        : "ONLINE";
            }


            if (lastUpdate) {

                lastUpdate.textContent =
                    "Updated " +
                    new Date()
                        .toLocaleTimeString();
            }


        } catch (error) {

            console.error(
                "Fluffy Fox sensor error:",
                error
            );


            if (sensorGrid) {

                sensorGrid.innerHTML = `
                    <div class="loading loading-error">

                        <div class="loading-fox">
                            🦊
                        </div>

                        <span>
                            ${escapeHtml(
                                error?.message ||
                                "Unknown sensor error."
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


            setMetricBar(
                memoryBar,
                0
            );

            setMetricBar(
                swapBar,
                0
            );


            /*
             * Health error state.
             */

            if (healthBanner) {

                healthBanner.classList.remove(
                    "health-loading",
                    "health-healthy",
                    "health-warning",
                    "health-critical"
                );

                healthBanner.classList.add(
                    "health-error"
                );
            }

            if (healthTitle) {
                healthTitle.textContent =
                    "SYSTEM STATUS ERROR";
            }

            if (healthMessage) {
                healthMessage.textContent =
                    error?.message ||
                    "Unable to read server hardware status.";
            }

            if (healthState) {
                healthState.textContent =
                    "ERROR";
            }


            if (lastUpdate) {

                lastUpdate.textContent =
                    "Sensor read failed";
            }


        } finally {

            requestInFlight =
                false;

            if (refreshButton) {

                refreshButton.disabled =
                    false;
            }

            if (refreshLabel) {
                refreshLabel.textContent =
                    "Refresh";
            }

            if (refreshIcon) {
                refreshIcon.textContent =
                    "↻";
            }
        }
    }


    /*
     * ---------------------------------------------------------
     * EVENTS
     * ---------------------------------------------------------
     */

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadTemperatures
        );
    }


    /*
     * ---------------------------------------------------------
     * STARTUP
     * ---------------------------------------------------------
     */

    initializeRefreshSettings();

    startAutoRefresh();

    loadTemperatures();


    /*
     * ---------------------------------------------------------
     * GLOBAL
     * ---------------------------------------------------------
     */

    window.loadTemperatures =
        loadTemperatures;


})();