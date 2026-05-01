// Store authorized users list
let authorizedUsers = {};

function renderOAuthDebugInfo() {
    const debugEl = document.getElementById('oauthDebug');
    const onloadEl = document.getElementById('g_id_onload');
    if (!debugEl || !onloadEl) {
        return;
    }

    const origin = window.location.origin;
    const protocol = window.location.protocol;
    const clientId = onloadEl.getAttribute('data-client_id') || 'Not set';
    const localhostHint = 'http://localhost:5500';
    const loopbackHint = 'http://127.0.0.1:5500';

    let html = '';
    if (protocol === 'file:') {
        debugEl.classList.add('error');
        html =
            '<strong>OAuth check failed:</strong> You are opening this page using file://.<br>' +
            'Google Sign-In requires http/https origin.<br>' +
            'Run a local server and open via localhost.';
    } else {
        debugEl.classList.remove('error');
        html =
            '<strong>OAuth Debug</strong><br>' +
            'Current origin: ' + origin + '<br>' +
            'Client ID: ' + clientId + '<br>' +
            'Add these in Google Cloud - Authorized JavaScript origins:<br>' +
            '- ' + origin + '<br>' +
            '- ' + localhostHint + '<br>' +
            '- ' + loopbackHint;
    }

    debugEl.innerHTML = html;
}

// Handle Google Sign-In callback response
function handleCredentialResponse(response) {
    console.log('Google Sign-In response received');
    
    if (response.credential) {
        // Decode the JWT token to get user info
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const userInfo = JSON.parse(jsonPayload);
        console.log('User email:', userInfo.email);
        
        // Verify the email against userslist.json
        verifyUserEmail(userInfo.email);
    }
}

// Fetch and verify user email from userslist.json
function verifyUserEmail(userEmail) {
    console.log('Verifying email: ' + userEmail);
    
    // Fetch the users list
    fetch('resources/userslist.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch users list');
            }
            return response.json();
        })
        .then(data => {
            authorizedUsers = data;
            console.log('Users list loaded:', Object.values(authorizedUsers));
            
            // Check if the email exists in the authorized users
            const isAuthorized = Object.values(authorizedUsers).includes(userEmail);
            
            if (isAuthorized) {
                console.log('User authorized! Redirecting to homepage...');
                // Store user email in session storage
                sessionStorage.setItem('userEmail', userEmail);
                sessionStorage.setItem('userName', Object.keys(authorizedUsers).find(key => authorizedUsers[key] === userEmail));
                
                // Redirect to homepage
                window.location.href = 'homepage.html';
            } else {
                console.log('User not authorized! Redirecting to error page...');
                // Store email in session storage for error page
                sessionStorage.setItem('attemptedEmail', userEmail);
                
                // Redirect to error page
                window.location.href = 'error.html';
            }
        })
        .catch(error => {
            console.error('Error verifying user:', error);
            alert('An error occurred while verifying your credentials. Please try again.');
        });
}

// Log when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Welcome to Ejagruti!');
    renderOAuthDebugInfo();
    
    // Make Google Sign-In available globally
    window.onload = function() {
        // Google Sign-In is initialized automatically via the gsi_client script
    };
});
