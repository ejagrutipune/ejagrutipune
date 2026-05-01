// Display error information
document.addEventListener('DOMContentLoaded', function() {
    const attemptedEmail = sessionStorage.getItem('attemptedEmail');
    
    if (attemptedEmail) {
        // Display the email that tried to access
        const emailDisplay = document.getElementById('emailDisplay');
        emailDisplay.innerHTML = `<strong>Email:</strong> ${attemptedEmail}`;
        
        // Update the error message
        const errorMsg = document.getElementById('errorMsg');
        errorMsg.textContent = `The email "${attemptedEmail}" is not authorized to access Ejagruti. Please contact the administrator to request access.`;
        
        // Clear the session storage
        sessionStorage.removeItem('attemptedEmail');
    }
});

// Logout functionality
const backBtn = document.querySelector('.error-btn');
backBtn.addEventListener('click', function() {
    // Clear any stored data
    sessionStorage.clear();
});
