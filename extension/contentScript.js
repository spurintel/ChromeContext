const highlightedClass = 'ip-highlighted';
const cache = {};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'getSelection') {
        sendResponse({ selectedText: getValidSelection() });
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'performAPIQuery') {
        console.log("api call");
        const { token, ipAddress } = request;

        // Check if the response is already cached
        if (cache[ipAddress]) {
            sendResponse({ result: { data: cache[ipAddress] }, isCached: true });
            return;
        }

        performAPIQuery(token, ipAddress)
            .then(function (result) {
                cache[ipAddress] = result.data;
                sendResponse({ result: result, iscached: false });
            })
            .catch(function (error) {
                sendResponse({ error: error.message });
            })
            .finally(function () {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                }
            });
        return true;
    }
});

async function performAPIQuery(token, ipAddress) {
    const endpoint = `https://api.spur.us/v2/context/${encodeURIComponent(ipAddress)}`;
    const headers = new Headers();
    headers.append('token', token);

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers,
    });
    if (response.status == 400) {
        const errorData = await response.json();
        throw new Error(`API request failed (${errorData.error})`);
    }
    if (response.status == 401) {
        throw new Error('API request failed (not authenticated)');
    }
    if (!response.ok) {
        throw new Error('API request failed');
    }
    return {
        data: await response.json(),
        balance: response.headers.get('X-Balance-Remaining')
    };
}

function getValidSelection() {
    const selectedText = window.getSelection().toString();
    // Check if selection is a valid IP (format-wise, at least)
    if (validateIPAddress(selectedText)) {
        return selectedText;
    }
}

function validateIPAddress(ipAddress) {
    // Maybe janky regex for IPv4 and IPv6
    var pattern = /(?:^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$)|(?:^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?$)/gm;
    return pattern.test(ipAddress);
}
