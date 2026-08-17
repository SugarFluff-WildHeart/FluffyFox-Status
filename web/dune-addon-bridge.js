(function () {

    "use strict";


    /*
     * =========================================================
     * FLUFFY FOX STATUS
     * DUNE ADDON BRIDGE
     * =========================================================
     *
     * Provides:
     *
     *     window.DuneAddon.request(action, payload)
     *
     * Example:
     *
     *     await window.DuneAddon.request(
     *         "server.hardware.status"
     *     );
     *
     * =========================================================
     */


    const addonId =
        document.documentElement.dataset.addonId ||
        "fluffy-fox-status";


    const pendingRequests =
        new Map();


    /*
     * ---------------------------------------------------------
     * REQUEST ID
     * ---------------------------------------------------------
     */

    function createRequestId() {

        if (
            window.crypto &&
            typeof window.crypto.randomUUID ===
                "function"
        ) {

            return window.crypto.randomUUID();
        }


        return (
            Date.now() +
            "-" +
            Math.random()
                .toString(16)
                .slice(2)
        );
    }


    /*
     * ---------------------------------------------------------
     * REQUEST
     * ---------------------------------------------------------
     */

    function request(
        action,
        payload = {}
    ) {

        if (
            typeof action !== "string" ||
            action.trim() === ""
        ) {

            return Promise.reject(
                new Error(
                    "Bridge action is required."
                )
            );
        }


        const requestId =
            createRequestId();


        return new Promise(
            (resolve, reject) => {

                const timeoutId =
                    window.setTimeout(
                        () => {

                            const pending =
                                pendingRequests.get(
                                    requestId
                                );

                            if (!pending) {
                                return;
                            }

                            pendingRequests.delete(
                                requestId
                            );

                            pending.reject(
                                new Error(
                                    "Bridge request timed out."
                                )
                            );

                        },
                        30000
                    );


                pendingRequests.set(
                    requestId,
                    {
                        resolve,
                        reject,
                        timeoutId
                    }
                );


                window.parent.postMessage(
                    {

                        type:
                            "dune-addon-request",

                        addonId:
                            addonId,

                        requestId:
                            requestId,

                        action:
                            action,

                        payload:
                            payload

                    },

                    window.location.origin
                );
            }
        );
    }


    /*
     * ---------------------------------------------------------
     * RESPONSE HANDLER
     * ---------------------------------------------------------
     */

    window.addEventListener(
        "message",
        event => {

            /*
             * Only accept messages from the same
             * Dune Console origin.
             */

            if (
                event.origin !==
                window.location.origin
            ) {
                return;
            }


            const message =
                event.data || {};


            if (
                message.type !==
                "dune-addon-response"
            ) {
                return;
            }


            /*
             * Ignore responses belonging
             * to another addon.
             */

            if (
                message.addonId &&
                message.addonId !== addonId
            ) {
                return;
            }


            const pending =
                pendingRequests.get(
                    message.requestId
                );


            if (!pending) {
                return;
            }


            pendingRequests.delete(
                message.requestId
            );


            if (
                pending.timeoutId
            ) {

                window.clearTimeout(
                    pending.timeoutId
                );
            }


            if (message.ok) {

                pending.resolve(
                    message.result
                );

            } else {

                pending.reject(
                    new Error(
                        message.error ||
                        "Bridge request failed."
                    )
                );
            }

        }
    );


    /*
     * ---------------------------------------------------------
     * PUBLIC API
     * ---------------------------------------------------------
     */

    window.DuneAddon = {

        request

    };


})();