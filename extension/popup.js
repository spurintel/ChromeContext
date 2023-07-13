const toggleButton = document.getElementById('toggleButton');
const parsedResultElement = document.getElementById('parsedResult');
const rawResultElement = document.getElementById('rawResult');

toggleButton.addEventListener('change', function () {
    if (toggleButton.checked) {
        parsedResultElement.style.display = 'none';
        rawResultElement.style.display = 'block';
    } else {
        parsedResultElement.style.display = 'block';
        rawResultElement.style.display = 'none';
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'displayAPIResult') {
        console.log('here');
        const { result } = request;
        if (result) {
            displayAPIQueryResult(response.result);
        } else {
            console.error('No result from API query');
        }
    }
});


chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    chrome.storage.sync.get('token', function (data) {
        if (data.token) {
            chrome.tabs.sendMessage(tab.id, { action: 'getSelection' }, function (response) {
                if (response && response.selectedText) {
                    const highlightedText = response.selectedText;
                    displayQueriedIP(highlightedText);
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'performAPIQuery',
                        token: data.token,
                        ipAddress: highlightedText
                    }, function (response) {
                        if (response && response.result) {
                            displayQueriedIP(highlightedText, response.isCached, response.result.balance);
                            displayAPIQueryResult(response.result.data);
                        } else {
                            console.error('API query failed');
                            displayError(response.error);
                        }
                    });
                } else {
                    displayError('No IP address is highlighted');
                    toggleButton.checked = false;
                }
            });
        } else {
            displayError('API token is not set in the extension options');
            toggleButton.checked = false;
        }
    });
});

function displayQueriedIP(queriedIP, isCached, balance = 0) {
    const queriedIPElement = document.getElementById('queriedIP');
    if (isCached) {
        queriedIPElement.textContent = `Queried IP: ${queriedIP} (cached from a prior query)`;
    } else if (balance != 0) {
        queriedIPElement.textContent = `Queried IP: ${queriedIP} (queries remaining: ${balance})`;
    } else {
        queriedIPElement.textContent = `Queried IP: ${queriedIP}`;
    }
}

function displayAPIQueryResult(result) {
    displayRawResult(result);
    displayParsedResult(result);
    toggleButton.checked = false;
}

function displayRawResult(result) {
    const rawResultElement = document.getElementById('rawResult');
    rawResultElement.textContent = JSON.stringify(result, null, 2); // Prettify JSON with indentation
}

function displayParsedResult(result) {
    const parsedResultElement = document.getElementById('parsedResult');
    parsedResultElement.innerHTML = parseResult(result);
}

function displayError(error) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = error;
}

function parseResult(result) {
    // Helper function to recursively generate HTML for the parsed result
    function generateHTML(data, indentLevel) {
        let html = '';
        const indentSpaces = ' '.repeat(indentLevel * 4);

        if (typeof data === 'object') {
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined) {
                    if (typeof value === 'object') {
                        html += `${indentSpaces}<strong>${key}:</strong>\n`;
                        html += `${generateHTML(value, indentLevel + 1)}`;
                    } else {
                        html += `${indentSpaces}<strong>${key}:</strong> ${value}\n`;
                    }
                }
            });
        } else {
            html += data;
        }

        return html;
    }

    // Parsed view HTML generation based on the JSON Schema specification for Context API response
    const parsedData = {
        ip: result.ip,
        as: result.as ? `${result.as.organization} (AS${result.as.number})` : undefined,
        organization: result.organization,
        infrastructure: result.infrastructure,
        client: result.client ? {
            behaviors: result.client.behaviors?.join(', '),
            concentration: result.client.concentration ? `${result.client.concentration.country}, ${result.client.concentration.state}, ${result.client.concentration.city} (${result.client.concentration.geohash})` : undefined,
            countries: result.client.countries,
            spread: result.client.spread,
            proxies: result.client.proxies?.join(', '),
            count: result.client.count,
            types: result.client.types?.join(', '),
        } : undefined,
        location: result.location ? {
            country: result.location.country,
            state: result.location.state,
            city: result.location.city,
        } : undefined,
        services: result.services?.join(', '),
        tunnels: result.tunnels?.map(tunnel => ({
            type: tunnel.type,
            anonymous: tunnel.anonymous,
            entries: tunnel.entries?.join(', '),
            operator: tunnel.operator,
            exits: tunnel.exits?.join(', '),
        })),
        risks: result.risks?.join(', '),
    };

    const parsedHTML = generateHTML(parsedData, 0);
    return parsedHTML;
}

