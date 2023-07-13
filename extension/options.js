document.addEventListener('DOMContentLoaded', function () {
    var saveButton = document.getElementById('saveButton');
    var clearButton = document.getElementById('clearButton');
    var checkButton = document.getElementById('checkButton');
    var tokenInput = document.getElementById('tokenInput');
    var message = document.getElementById('message');

    checkButton.disabled = true;

    // Load the saved token if available
    chrome.storage.sync.get('token', function (data) {
        if (data.token) {
            tokenInput.value = formatToken(data.token);
            checkButton.disabled = false;
            saveButton.disabled = true;
        }
    });

    saveButton.addEventListener('click', function () {
        var token = tokenInput.value;
        checkToken(token)
            .then(balance => {
                chrome.storage.sync.set({ 'token': token }, function () {
                    console.log('Token saved: ' + token);
                    tokenInput.value = formatToken(token);
                    showMessage('Token saved successfully! Queries remaining: ' + balance, 'green');
                    checkButton.disabled = false;
                    saveButton.disabled = true;
                });
            })
            .catch(error => {
                showMessage(error, 'red');
            });

    });

    clearButton.addEventListener('click', function () {
        chrome.storage.sync.remove('token', function () {
            console.log('Token cleared');
            tokenInput.value = '';
            showMessage('Token cleared successfully!', 'green');
            checkButton.disabled = true;
            saveButton.disabled = false;
        });
    });

    checkButton.addEventListener('click', function () {
        chrome.storage.sync.get('token', function (data) {
            checkToken(data.token)
                .then(balance => {
                    showMessage('Token valid. Queries remaining: ' + balance, 'green');
                })
                .catch(error => {
                    showMessage(error, 'red');
                });
        });
    });

    function showMessage(text, color) {
        message.textContent = text;
        message.style.color = color;
        setTimeout(function () {
            message.textContent = '';
        }, 3000);
    }

    function formatToken(string) {
        if (string.length <= 8) {
            return string;
        }

        const firstFour = string.slice(0, 4);
        const lastFour = string.slice(-4);
        const middleDots = '.'.repeat(string.length - 8);

        return firstFour + middleDots + lastFour;
    }

    async function checkToken(token) {
        const endpoint = `https://api.spur.us/status`;
        const headers = new Headers();
        headers.append('token', token);

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: headers,
        });
        if (response.status === 401) {
            throw new Error('Token invalid');
        }
        const data = await response.json();
        return data.queriesRemaining;
    }

});


