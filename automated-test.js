/**
 * Automated Test Suite for Critical Fixes
 * Ray Ryan Management System
 *
 * HOW TO USE:
 * 1. Open index.html in browser
 * 2. Open Developer Console (F12)
 * 3. Copy this entire file and paste into console
 * 4. Press Enter
 * 5. Results will display automatically
 *
 * NOTE: This tests the TIME FUNCTIONS only automatically.
 * For full testing, also follow the manual TEST_GUIDE.md
 */

console.clear();
console.log('%c==============================================', 'color: blue; font-weight: bold');
console.log('%c   AUTOMATED TEST SUITE - DAY 1 FIXES', 'color: blue; font-weight: bold');
console.log('%c==============================================', 'color: blue; font-weight: bold');
console.log('');

let testsPassed = 0;
let testsFailed = 0;

function logPass(testName) {
    console.log('%c✅ PASS: ' + testName, 'color: green; font-weight: bold');
    testsPassed++;
}

function logFail(testName, reason) {
    console.log('%c❌ FAIL: ' + testName, 'color: red; font-weight: bold');
    console.log('%c   Reason: ' + reason, 'color: red');
    testsFailed++;
}

function logInfo(message) {
    console.log('%c' + message, 'color: gray');
}

// ============================================
// TEST 1: Time Function Safety Tests
// ============================================

console.log('\n%c--- Test Suite 1: Time Function Safety ---', 'color: cyan; font-weight: bold');

// Test 1.1: timeToMinutes with null
try {
    const result = timeToMinutes(null);
    if (result === 0) {
        logPass('timeToMinutes(null) returns 0');
    } else {
        logFail('timeToMinutes(null)', `Expected 0, got ${result}`);
    }
} catch (e) {
    logFail('timeToMinutes(null)', `Crashed with error: ${e.message}`);
}

// Test 1.2: timeToMinutes with undefined
try {
    const result = timeToMinutes(undefined);
    if (result === 0) {
        logPass('timeToMinutes(undefined) returns 0');
    } else {
        logFail('timeToMinutes(undefined)', `Expected 0, got ${result}`);
    }
} catch (e) {
    logFail('timeToMinutes(undefined)', `Crashed with error: ${e.message}`);
}

// Test 1.3: timeToMinutes with invalid string
try {
    const result = timeToMinutes('not a time');
    if (result === 0) {
        logPass('timeToMinutes("not a time") returns 0');
    } else {
        logFail('timeToMinutes("not a time")', `Expected 0, got ${result}`);
    }
} catch (e) {
    logFail('timeToMinutes("not a time")', `Crashed with error: ${e.message}`);
}

// Test 1.4: timeToMinutes with out-of-range time
try {
    const result = timeToMinutes('25:99');
    if (typeof result === 'number' && !isNaN(result)) {
        logPass('timeToMinutes("25:99") returns a number');
    } else {
        logFail('timeToMinutes("25:99")', `Expected number, got ${result}`);
    }
} catch (e) {
    logFail('timeToMinutes("25:99")', `Crashed with error: ${e.message}`);
}

// Test 1.5: timeToMinutes with valid time
try {
    const result = timeToMinutes('14:30');
    if (result === 870) {
        logPass('timeToMinutes("14:30") returns 870');
    } else {
        logFail('timeToMinutes("14:30")', `Expected 870, got ${result}`);
    }
} catch (e) {
    logFail('timeToMinutes("14:30")', `Crashed with error: ${e.message}`);
}

// Test 1.6: minutesToTime with null
try {
    const result = minutesToTime(null);
    if (result === '00:00') {
        logPass('minutesToTime(null) returns "00:00"');
    } else {
        logFail('minutesToTime(null)', `Expected "00:00", got "${result}"`);
    }
} catch (e) {
    logFail('minutesToTime(null)', `Crashed with error: ${e.message}`);
}

// Test 1.7: minutesToTime with valid number
try {
    const result = minutesToTime(870);
    if (result === '14:30') {
        logPass('minutesToTime(870) returns "14:30"');
    } else {
        logFail('minutesToTime(870)', `Expected "14:30", got "${result}"`);
    }
} catch (e) {
    logFail('minutesToTime(870)', `Crashed with error: ${e.message}`);
}

// Test 1.8: minutesToTime with negative number
try {
    const result = minutesToTime(-100);
    if (result === '00:00') {
        logPass('minutesToTime(-100) clamps to "00:00"');
    } else {
        logFail('minutesToTime(-100)', `Expected "00:00", got "${result}"`);
    }
} catch (e) {
    logFail('minutesToTime(-100)', `Crashed with error: ${e.message}`);
}

// Test 1.9: minutesToTime with huge number
try {
    const result = minutesToTime(10000);
    if (result === '23:59') {
        logPass('minutesToTime(10000) clamps to "23:59"');
    } else {
        logFail('minutesToTime(10000)', `Expected "23:59", got "${result}"`);
    }
} catch (e) {
    logFail('minutesToTime(10000)', `Crashed with error: ${e.message}`);
}

// ============================================
// TEST 2: Data Structure Checks
// ============================================

console.log('\n%c--- Test Suite 2: Data Structure Validation ---', 'color: cyan; font-weight: bold');

// Test 2.1: Check if state exists
if (typeof state !== 'undefined') {
    logPass('Global state object exists');
} else {
    logFail('Global state object', 'state is undefined');
}

// Test 2.2: Check if state has required collections
if (typeof state !== 'undefined') {
    const requiredCollections = ['customers', 'bookings', 'staff', 'services', 'transactions'];
    let allExist = true;

    for (const collection of requiredCollections) {
        if (!Array.isArray(state[collection])) {
            logFail(`state.${collection}`, 'Not an array or missing');
            allExist = false;
        }
    }

    if (allExist) {
        logPass('All required state collections exist and are arrays');
    }
}

// Test 2.3: Check if saveState function exists
if (typeof saveState === 'function') {
    logPass('saveState function exists');
} else {
    logFail('saveState function', 'Function not found');
}

// Test 2.4: Check if debouncedSaveState exists
if (typeof debouncedSaveState === 'function') {
    logPass('debouncedSaveState function exists');
} else {
    logFail('debouncedSaveState function', 'Function not found');
}

// ============================================
// TEST 3: Security Module Checks
// ============================================

console.log('\n%c--- Test Suite 3: Security Module ---', 'color: cyan; font-weight: bold');

// Test 3.1: Check if security.js is loaded
if (typeof sanitizeHTML === 'function') {
    logPass('sanitizeHTML function is available');
} else {
    logFail('sanitizeHTML', 'Security module may not be loaded');
}

// Test 3.2: Test sanitization
if (typeof sanitizeHTML === 'function') {
    try {
        const dangerous = '<script>alert("xss")</script>';
        const safe = sanitizeHTML(dangerous);
        if (safe.indexOf('<script>') === -1) {
            logPass('sanitizeHTML properly escapes dangerous HTML');
        } else {
            logFail('sanitizeHTML', 'Did not properly escape script tags');
        }
    } catch (e) {
        logFail('sanitizeHTML', `Error during sanitization: ${e.message}`);
    }
}

// Test 3.3: Check validation functions
if (typeof validateInput === 'function') {
    logPass('validateInput function is available');
} else {
    logInfo('⚠️  WARNING: validateInput not found (security.js may not be loaded)');
}

// ============================================
// TEST 4: UUID Generation
// ============================================

console.log('\n%c--- Test Suite 4: UUID Generation ---', 'color: cyan; font-weight: bold');

// Test 4.1: Check if generateUUID exists
if (typeof generateUUID === 'function') {
    logPass('generateUUID function exists');

    // Test 4.2: Generate multiple UUIDs
    try {
        const uuid1 = generateUUID();
        const uuid2 = generateUUID();
        const uuid3 = generateUUID();

        if (uuid1 !== uuid2 && uuid2 !== uuid3 && uuid1 !== uuid3) {
            logPass('generateUUID creates unique IDs');
        } else {
            logFail('generateUUID', 'Generated duplicate UUIDs!');
        }

        // Test 4.3: Check UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(uuid1)) {
            logPass('generateUUID creates valid UUID v4 format');
        } else {
            logInfo('⚠️  WARNING: UUID format not standard (may use custom format)');
        }
    } catch (e) {
        logFail('generateUUID execution', `Error: ${e.message}`);
    }
} else {
    logFail('generateUUID', 'Function not found');
}

// ============================================
// FINAL SUMMARY
// ============================================

console.log('\n%c==============================================', 'color: blue; font-weight: bold');
console.log('%c   TEST RESULTS SUMMARY', 'color: blue; font-weight: bold');
console.log('%c==============================================', 'color: blue; font-weight: bold');

const totalTests = testsPassed + testsFailed;
const passRate = totalTests > 0 ? Math.round((testsPassed / totalTests) * 100) : 0;

console.log('');
console.log('%cTotal Tests Run: ' + totalTests, 'font-weight: bold');
console.log('%c✅ Passed: ' + testsPassed, 'color: green; font-weight: bold');
console.log('%c❌ Failed: ' + testsFailed, 'color: red; font-weight: bold');
console.log('%cPass Rate: ' + passRate + '%', 'font-weight: bold; font-size: 14px');
console.log('');

if (testsFailed === 0) {
    console.log('%c🎉 ALL AUTOMATED TESTS PASSED! 🎉', 'color: green; font-weight: bold; font-size: 16px; background: #d4edda; padding: 10px');
    console.log('');
    console.log('%cNext Steps:', 'color: blue; font-weight: bold');
    console.log('1. Complete manual testing in TEST_GUIDE.md');
    console.log('2. Test credits deduction workflow');
    console.log('3. Test double transaction prevention');
    console.log('4. Test save on quick close');
    console.log('5. If all tests pass, proceed to Day 2 fixes');
} else {
    console.log('%c⚠️  SOME TESTS FAILED', 'color: red; font-weight: bold; font-size: 16px; background: #f8d7da; padding: 10px');
    console.log('');
    console.log('%cAction Required:', 'color: red; font-weight: bold');
    console.log('1. Review failed tests above');
    console.log('2. Check that fixes were applied correctly');
    console.log('3. Check browser console for errors');
    console.log('4. Report failures for debugging');
}

console.log('');
console.log('%c==============================================', 'color: blue; font-weight: bold');

// Return results object for programmatic access
const testResults = {
    total: totalTests,
    passed: testsPassed,
    failed: testsFailed,
    passRate: passRate,
    allPassed: testsFailed === 0
};

console.log('\n%cTest results stored in: testResults', 'color: gray');
console.log('Access via: testResults.passed, testResults.failed, etc.');

// Make results available globally
window.testResults = testResults;
