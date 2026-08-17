(function () {

    "use strict";


    const sensorGrid =
        document.querySelector(
            "#sensor-grid"
        );


    const lastUpdate =
        document.querySelector(
            "#last-update"
        );


    const refreshButton =
        document.querySelector(
            "#refresh-button"
        );


    const serverStatus =
        document.querySelector(
            "#server-status"
        );


    const sensorStatus =
        document.querySelector(
            "#sensor-status"
        );


    const memoryStatus =
        document.querySelector(
            "#memory-status"
        );


    const swapStatus =
        document.querySelector(
            "#swap-status"
        );


    const loadStatus =
        document.querySelector(
            "#load-status"
        );


    const uptimeStatus =
        document.querySelector(
            "#uptime-status"
        );


    const LOCAL_DEVELOPMENT =
        window.parent === window;


    const HAS_DUNE_BRIDGE =
        !LOCAL_DEVELOPMENT &&
        window.DuneAddon &&
        typeof window.DuneAddon.request ===
            "function";


    /*
     * ---------------------------------------------------------
     * LOCAL DEVELOPMENT ONLY
     * ---------------------------------------------------------
     *
     * These values are ONLY used when index.html is opened
     * directly in a normal browser.
     *
     * They are NEVER used when running inside Dune Console.
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

                total_kb: 16777216,
                available_kb: 8388608,
                used_kb: 8388608,
                percent: 50.0

            },

            swap: {

                total_kb: 4194304,
                free_kb: 4194304,
                used_kb: 0,
                percent: 0.0

            },

            load: {

                one: 0.25,
                five: 0.20,
                fifteen: 0.18

            },

            uptime_seconds: 86400

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

        const bytes =
            Number(kb) * 1024;


        if (
            !Number.isFinite(bytes) ||
            bytes < 0
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
            Number(kb);


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
     * RENDER TEMPERATURES
     * ---------------------------------------------------------
     */

    function renderSensors(
        sensors
    ) {

        if (
            !Array.isArray(sensors) ||
            sensors.length === 0
        ) {

            sensorGrid.innerHTML = `
                <div class="loading">
                    No temperature sensors found.
                </div>
            `;


            sensorStatus.textContent =
                "NO DATA";


            return;

        }


        sensorGrid.innerHTML =
            sensors
                .map(
                    sensor => {

                        const temperature =
                            Number(
                                sensor.temperature
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


                        return `
                            <div class="sensor">

                                <div class="sensor-name">
                                    ${escapeHtml(
                                        sensor.name
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


        sensorStatus.textContent =
            `${sensors.length} SENSOR${
                sensors.length === 1
                    ? ""
                    : "S"
            } OK`;

    }


    /*
     * ---------------------------------------------------------
     * RENDER SYSTEM
     * ---------------------------------------------------------
     */

    function renderSystem(
        data
    ) {

        if (data.memory) {

            memoryStatus.textContent =
                `${Number(
                    data.memory.percent || 0
                ).toFixed(1)}% ` +
                `(${formatBytesFromKB(
                    data.memory.used_kb
                )})`;

        } else {

            memoryStatus.textContent =
                "UNKNOWN";

        }


        if (data.swap) {

            swapStatus.textContent =
                `${Number(
                    data.swap.percent || 0
                ).toFixed(1)}% ` +
                `(${formatBytesFromKB(
                    data.swap.used_kb
                )})`;

        } else {

            swapStatus.textContent =
                "UNKNOWN";

        }


        if (data.load) {

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


        uptimeStatus.textContent =
            formatUptime(
                data.uptime_seconds
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
		 * THIS IS THE REAL REQUEST.
		 *
		 * Hardware and system status is provided
		 * by Dune Docker Core.
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

        if (refreshButton) {

            refreshButton.disabled =
                true;

        }


        lastUpdate.textContent =
            "Reading sensors...";


        sensorStatus.textContent =
            "READING";


        try {

            const data =
                await getSensorData();


            renderSensors(
                data.temperatures
            );


            renderSystem(
                data
            );


            if (LOCAL_DEVELOPMENT) {

                serverStatus.textContent =
                    "LOCAL TEST";

            } else {

                serverStatus.textContent =
                    "ONLINE";

            }


            lastUpdate.textContent =
                "Updated " +
                new Date()
                    .toLocaleTimeString();


        } catch (error) {

            console.error(
                "Fluffy Fox sensor error:",
                error
            );


            sensorGrid.innerHTML = `
                <div class="loading">
                    🦊
                    <span>
                        ${escapeHtml(
                            error.message
                        )}
                    </span>
                </div>
            `;


            sensorStatus.textContent =
                "ERROR";


            serverStatus.textContent =
                LOCAL_DEVELOPMENT
                    ? "LOCAL TEST"
                    : "ERROR";


            memoryStatus.textContent =
                "ERROR";


            swapStatus.textContent =
                "ERROR";


            loadStatus.textContent =
                "ERROR";


            uptimeStatus.textContent =
                "ERROR";


            lastUpdate.textContent =
                "Sensor read failed";

        } finally {

            if (refreshButton) {

                refreshButton.disabled =
                    false;

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
     * AUTO REFRESH
     * ---------------------------------------------------------
     */

    window.setInterval(
        loadTemperatures,
        5000
    );


    /*
     * ---------------------------------------------------------
     * INITIAL LOAD
     * ---------------------------------------------------------
     */

    loadTemperatures();


    /*
     * ---------------------------------------------------------
     * GLOBAL
     * ---------------------------------------------------------
     */

    window.loadTemperatures =
        loadTemperatures;

})();