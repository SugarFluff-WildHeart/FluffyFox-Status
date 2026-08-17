(function () {

    "use strict";


    const sensorGrid =
        document.querySelector(
            "#sensor-grid"
        );
		
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
			1000,
			5000,
			10000,
			30000,
			60000
		];

		const DEFAULT_REFRESH_INTERVAL = 5000;

		let refreshTimer = null;


		/*
		 * ---------------------------------------------------------
		 * GET REFRESH INTERVAL
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


		/*
		 * ---------------------------------------------------------
		 * FORMAT REFRESH INTERVAL
		 * ---------------------------------------------------------
		 */

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


		/*
		 * ---------------------------------------------------------
		 * UPDATE REFRESH UI
		 * ---------------------------------------------------------
		 */

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


		/*
		 * ---------------------------------------------------------
		 * START AUTO REFRESH
		 * ---------------------------------------------------------
		 */

		function startAutoRefresh() {

			/*
			 * Always clear the previous timer first.
			 *
			 * This prevents multiple timers from
			 * running if the user changes the setting.
			 */

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

			/*
			 * Manual mode.
			 */

			if (interval === 0) {
				return;
			}

			/*
			 * Start the new timer using the
			 * existing hardware-loading function.
			 */

			refreshTimer =
				window.setInterval(
					loadTemperatures,
					interval
				);

		}


		/*
		 * ---------------------------------------------------------
		 * SET REFRESH INTERVAL
		 * ---------------------------------------------------------
		 */

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


		/*
		 * ---------------------------------------------------------
		 * INITIALIZE REFRESH SETTINGS
		 * ---------------------------------------------------------
		 */

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


    /*
     * ---------------------------------------------------------
     * HOST HARDWARE DOM
     * ---------------------------------------------------------
     */

    const cpuModel =
        document.querySelector(
            "#cpu-model"
        );


    const cpuTopology =
        document.querySelector(
            "#cpu-topology"
        );


    const cpuClock =
        document.querySelector(
            "#cpu-clock"
        );


    const cpuTemperature =
        document.querySelector(
            "#cpu-temperature"
        );


    const nvmeModel =
        document.querySelector(
            "#nvme-model"
        );


    const nvmeTemperature =
        document.querySelector(
            "#nvme-temperature"
        );


    const nvmeCapacity =
        document.querySelector(
            "#nvme-capacity"
        );


    const ssdModel =
        document.querySelector(
            "#ssd-model"
        );


    const ssdTemperature =
        document.querySelector(
            "#ssd-temperature"
        );


    const ssdCapacity =
        document.querySelector(
            "#ssd-capacity"
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
     *
     * The hardware object below is an addon-side preview
     * schema. It is NOT assumed to be the real Core schema.
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


            /*
             * LOCAL PREVIEW ONLY.
             *
             * These values are not read from Dune Core yet.
             * They exist so the new UI can be previewed.
             */

            hardware: {

                cpu: {

                    model:
                        "AMD Ryzen 7 5800X",

                    cores:
                        8,

                    threads:
                        16,

                    clock_mhz:
                        4200,

                    temperature:
                        47.0

                },


                nvme: {

                    model:
                        "Samsung SSD 980 PRO 2TB",

                    capacity_gb:
                        2000,

                    temperature:
                        38.0

                },


                ssd: {

                    model:
                        "Samsung SSD 870 EVO 500GB",

                    capacity_gb:
                        500,

                    temperature:
                        36.0

                }

            },


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
     * RENDER HOST HARDWARE
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     *
     * This currently consumes the local preview schema.
     *
     * Once Captain confirms the actual
     * server.hardware.status response, ONLY this function
     * should need to be adapted to the real field names.
     */

    function renderHardware(
        hardware
    ) {

        if (!hardware) {

            cpuModel.textContent =
                "NOT AVAILABLE";

            cpuTopology.textContent =
                "Cores / Threads: NOT AVAILABLE";

            cpuClock.textContent =
                "Clock: NOT AVAILABLE";

            cpuTemperature.textContent =
                "Temperature: NOT AVAILABLE";


            nvmeModel.textContent =
                "NOT AVAILABLE";

            nvmeTemperature.textContent =
                "Temperature: NOT AVAILABLE";

            nvmeCapacity.textContent =
                "Capacity: NOT AVAILABLE";


            ssdModel.textContent =
                "NOT AVAILABLE";

            ssdTemperature.textContent =
                "Temperature: NOT AVAILABLE";

            ssdCapacity.textContent =
                "Capacity: NOT AVAILABLE";


            return;

        }


        //const cpu =
        //    hardware.cpu;


        //const nvme =
        //    hardware.nvme;


        //const ssd =
        //    hardware.ssd;


        //if (cpu) {

        //    cpuModel.textContent =
        //        cpu.model ||
        //        "Unknown CPU";


        //    cpuTopology.textContent =
        //        `Cores / Threads: ` +
        //        `${cpu.cores ?? "?"} / ` +
        //        `${cpu.threads ?? "?"}`;


        //    cpuClock.textContent =
        //        `Clock: ` +
        //        `${cpu.clock_mhz ?? "?"} MHz`;


        //    cpuTemperature.textContent =
        //        `Temperature: ` +
        //        `${cpu.temperature ?? "?"} °C`;

        //}


        //if (nvme) {

        //    nvmeModel.textContent =
        //        nvme.model ||
        //        "Unknown NVMe";


        //    nvmeTemperature.textContent =
        //        `Temperature: ` +
        //        `${nvme.temperature ?? "?"} °C`;


        //    nvmeCapacity.textContent =
        //        `Capacity: ` +
        //        `${nvme.capacity_gb ?? "?"} GB`;

        //}


        //if (ssd) {

        //    ssdModel.textContent =
        //        ssd.model ||
        //        "Unknown SSD";


        //    ssdTemperature.textContent =
        //        `Temperature: ` +
        //        `${ssd.temperature ?? "?"} °C`;


        //    ssdCapacity.textContent =
        //        `Capacity: ` +
        //        `${ssd.capacity_gb ?? "?"} GB`;

        //}

    //}


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


            renderHardware(
                data.hardware
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


            /*
             * Hardware section
             * also gets a clean failure state.
             */

            renderHardware(
                null
            );


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

	initializeRefreshSettings();
	startAutoRefresh();


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