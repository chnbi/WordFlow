const functions = require("firebase-functions");
const axios = require("axios");
const cors = require("cors")({ origin: true });

exports.ilmuChatProxy = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            // Target API base URL
            const targetBase = "https://api.ytlailabs.tech";

            // Strip the proxy prefix from the request URL
            // Incoming: /proxy/ilmuchat/v1/chat/completions
            // Target: /v1/chat/completions
            const path = req.path.replace(/^\/proxy\/ilmuchat/, "");

            const targetUrl = `${targetBase}${path}`;

            console.log(`Proxying request to: ${targetUrl}`);

            // Forward the request
            const response = await axios({
                method: req.method,
                url: targetUrl,
                headers: {
                    ...req.headers,
                    host: "api.ytlailabs.tech", // Override host header
                },
                data: req.body,
                params: req.query,
            });

            // Forward status and headers
            res.status(response.status);

            // Copy headers (excluding those that might cause issues)
            Object.entries(response.headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });

            // Send data
            res.send(response.data);

        } catch (error) {
            console.error("Proxy Error:", error.message);
            if (error.response) {
                res.status(error.response.status).send(error.response.data);
            } else {
                res.status(500).send({ error: "Proxy Request Failed", details: error.message });
            }
        }
    });
});
