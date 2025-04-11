// Test statistics
let totalTests = 0;
let passedTests = 0;

// Helper function to display test results
export function displayTestResult(name, passed, message) {
    totalTests++;
    if (passed) passedTests++;
    
    const testCase = document.createElement('div');
    testCase.className = `test-case ${passed ? 'pass' : 'fail'}`;
    
    const testName = document.createElement('div');
    testName.className = 'test-name';
    testName.textContent = name;
    
    const testMessage = document.createElement('div');
    testMessage.className = 'test-message';
    testMessage.textContent = message;
    
    testCase.appendChild(testName);
    testCase.appendChild(testMessage);
    document.getElementById('test-results').appendChild(testCase);
}

// Helper function to display test summary
export function displayTestSummary() {
    const summaryContainer = document.getElementById('test-summary');
    summaryContainer.innerHTML = `
        <h2>Test Summary</h2>
        <p>Total Tests: ${totalTests}</p>
        <p>Passed: ${passedTests}</p>
        <p>Failed: ${totalTests - passedTests}</p>
        <p>Pass Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%</p>
    `;
}

// Helper function to create navigation menu
export function createNavMenu() {
    const navMenu = document.createElement('div');
    navMenu.className = 'nav-menu';
    navMenu.innerHTML = `
        <a href="data-validation-tests.html">Data Validation Tests</a>
        <a href="data-fetching-tests.html">Data Fetching Tests</a>
    `;
    return navMenu;
}

// Helper function to setup fetch mocking
export function setupFetchMocking() {
    const originalFetch = window.fetch;
    return {
        restore: () => {
            window.fetch = originalFetch;
        },
        mock: (mockImplementation) => {
            window.fetch = mockImplementation;
        }
    };
}

// Helper function to reset test statistics
export function resetTestStats() {
    totalTests = 0;
    passedTests = 0;
    document.getElementById('test-results').innerHTML = '';
    document.getElementById('test-summary').innerHTML = '';
} 