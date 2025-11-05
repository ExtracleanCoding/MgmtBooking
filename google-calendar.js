// Google Calendar Integration

// Configuration - Now using settings from state
function getGoogleCalendarConfig() {
    return {
        clientId: state.settings.googleCalendarClientId || '',
        apiKey: state.settings.googleCalendarApiKey || '',
        scopes: ['https://www.googleapis.com/auth/calendar.events'],
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
    };
};

// State
let googleAuth = null;
let googleApiInitialized = false;

// Initialize the Google API client
async function initializeGoogleCalendarApi() {
    if (!state.settings.googleCalendarEnabled) {
        return false;
    }

    const config = getGoogleCalendarConfig();
    if (!config.clientId || !config.apiKey) {
        showToast('Google Calendar client ID and API key are required');
        return false;
    }

    try {
        await gapi.client.init({
            apiKey: config.apiKey,
            clientId: config.clientId,
            discoveryDocs: config.discoveryDocs,
            scope: config.scopes.join(' ')
        });

        // Listen for sign-in state changes
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
        
        // Handle the initial sign-in state
        updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        
        googleApiInitialized = true;
        return true;
    } catch (error) {
        console.error('Error initializing Google Calendar API:', error);
        showToast('Failed to initialize Google Calendar integration');
        return false;
    }
}

// Update UI based on sign-in status
function updateSignInStatus(isSignedIn) {
    const syncButton = document.getElementById('google-calendar-sync');
    if (syncButton) {
        syncButton.disabled = !isSignedIn;
    }
    
    // Update settings in the application state
    state.settings.googleCalendarEnabled = isSignedIn;
    state.settings.googleCalendarLastSync = isSignedIn ? new Date().toISOString() : null;
    debouncedSaveState();
}

// Handle Google Calendar authentication
async function handleGoogleAuth() {
    if (!googleApiInitialized) {
        await initializeGoogleCalendarApi();
    }
    
    if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        // User is already signed in, sync calendars
        await syncWithGoogleCalendar();
    } else {
        // User needs to sign in
        try {
            await gapi.auth2.getAuthInstance().signIn();
        } catch (error) {
            console.error('Google Calendar sign-in error:', error);
            showToast('Failed to sign in to Google Calendar');
        }
    }
}

// Convert booking to Google Calendar event format
function bookingToGoogleEvent(booking) {
    const customer = state.customers.find(c => c.id === booking.customerId);
    const staff = state.staff.find(s => s.id === booking.staffId);
    const service = state.services.find(s => s.id === booking.serviceId);

    const startDateTime = parseBookingDateTime(booking.date, booking.startTime);
    const endDateTime = parseBookingDateTime(booking.date, booking.endTime);

    return {
        summary: `${service?.service_name || 'Lesson'} - ${customer?.name || 'Unknown'}`,
        description: `Status: ${booking.status}\nPayment: ${booking.paymentStatus}\nInstructor: ${staff?.name || 'Unknown'}\nService: ${service?.service_name || 'Unknown'}\nPickup: ${booking.pickup || 'Not specified'}`,
        location: booking.pickup || '',
        start: {
            dateTime: startDateTime.toISOString(),
            timeZone: 'Europe/Dublin'
        },
        end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'Europe/Dublin'
        },
        extendedProperties: {
            private: {
                bookingId: booking.id,
                systemSource: 'RRMgmtBooking'
            }
        }
    };
}

// Convert Google Calendar event to booking format
function googleEventToBooking(event) {
    const startDate = new Date(event.start.dateTime);
    const endDate = new Date(event.end.dateTime);
    
    return {
        date: toLocalDateString(startDate),
        startTime: `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
        endTime: `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
        googleEventId: event.id,
        title: event.summary,
        description: event.description,
        location: event.location
    };
}

// Sync bookings with Google Calendar
async function syncWithGoogleCalendar(bookingIds = null) {
    if (!state.settings.googleCalendarEnabled) {
        return;
    }

    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        showToast('Please sign in to Google Calendar first');
        return;
    }

    try {
        // Get bookings to sync
        let bookingsToSync;
        if (bookingIds) {
            // Sync specific bookings
            bookingsToSync = state.bookings.filter(b => bookingIds.includes(b.id));
        } else {
            // Sync all future bookings
            const today = toLocalDateString(new Date());
            bookingsToSync = state.bookings.filter(b => 
                b.date >= today && b.status !== 'Cancelled'
            );
        }

        // Get existing calendar events
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        
        const response = await gapi.client.calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),
            timeMax: threeMonthsFromNow.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
        });

        const existingEvents = response.result.items;
        
        // Sync bookings to Google Calendar
        const results = await Promise.allSettled(
            bookingsToSync.map(async (booking) => {
                const event = bookingToGoogleEvent(booking);
                
                // Check if event already exists
                const existingEvent = existingEvents.find(e => 
                    e.extendedProperties?.private?.bookingId === booking.id
                );

                if (existingEvent) {
                    // Update existing event
                    return gapi.client.calendar.events.update({
                        calendarId: 'primary',
                        eventId: existingEvent.id,
                        resource: event
                    });
                } else {
                    // Create new event
                    const response = await gapi.client.calendar.events.insert({
                        calendarId: 'primary',
                        resource: event
                    });
                    booking.googleEventId = response.result.id;
                    return response;
                }
            })
        );

        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        if (failed > 0) {
            console.error('Some bookings failed to sync:', 
                results.filter(r => r.status === 'rejected')
                    .map(r => r.reason));
        }

        // Update last sync time
        state.settings.googleCalendarLastSync = new Date().toISOString();
        debouncedSaveState();

        showToast(`Synced ${succeeded} bookings with Google Calendar` + 
                 (failed > 0 ? ` (${failed} failed)` : ''));
        
        if (state.settings.googleCalendarAutoSync) {
            state.settings.googleCalendarLastSync = new Date().toISOString();
            debouncedSaveState();
        }
    } catch (error) {
        console.error('Error syncing with Google Calendar:', error);
        showToast('Failed to sync with Google Calendar');
    }
}

// Handle automatic syncing when bookings are created/updated
function handleAutoSync(booking) {
    if (state.settings.googleCalendarEnabled && 
        state.settings.googleCalendarAutoSync &&
        gapi.auth2?.getAuthInstance()?.isSignedIn.get()) {
        syncWithGoogleCalendar([booking.id]);
    }
}

// Import events from Google Calendar
async function importFromGoogleCalendar() {
    if (!state.settings.googleCalendarEnabled || !gapi.auth2?.getAuthInstance()?.isSignedIn.get()) {
        showToast('Please enable and sign in to Google Calendar first');
        return;
    }

    try {
        const timeMin = new Date();
        timeMin.setHours(0, 0, 0, 0);

        const response = await gapi.client.calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin.toISOString(),
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime'
        });

        const events = response.result.items;
        let imported = 0;
        let skipped = 0;

        for (const event of events) {
            // Skip events we created
            if (event.extendedProperties?.private?.systemSource === 'RRMgmtBooking') {
                skipped++;
                continue;
            }

            // Convert event to booking format
            const bookingData = googleEventToBooking(event);
            
            // Check if booking already exists
            const existingBooking = state.bookings.find(b => 
                b.date === bookingData.date && 
                b.startTime === bookingData.startTime &&
                b.endTime === bookingData.endTime
            );

            if (!existingBooking) {
                state.bookings.push({
                    ...bookingData,
                    id: `booking_${generateUUID()}`,
                    status: 'Scheduled',
                    paymentStatus: 'Unpaid',
                    googleEventId: event.id
                });
                imported++;
            } else {
                skipped++;
            }
        }

        if (imported > 0) {
            saveState();
            refreshCurrentView();
        }

        showToast(`Imported ${imported} events from Google Calendar` +
                 (skipped > 0 ? ` (${skipped} skipped)` : ''));

    } catch (error) {
        console.error('Failed to import from Google Calendar:', error);
        showToast('Failed to import from Google Calendar');
    }
}

// Check for conflicts with Google Calendar events
async function checkGoogleCalendarConflicts(date, startTime, endTime) {
    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        return [];
    }

    try {
        const startDateTime = parseBookingDateTime(date, startTime);
        const endDateTime = parseBookingDateTime(date, endTime);

        const response = await gapi.client.calendar.events.list({
            calendarId: 'primary',
            timeMin: startDateTime.toISOString(),
            timeMax: endDateTime.toISOString(),
            singleEvents: true
        });

        return response.result.items.filter(event => 
            !event.extendedProperties?.private?.systemSource === 'RRMgmtBooking'
        ).map(event => ({
            title: event.summary,
            time: new Date(event.start.dateTime).toLocaleTimeString(),
            type: 'Google Calendar Event'
        }));
    } catch (error) {
        console.error('Error checking Google Calendar conflicts:', error);
        return [];
    }
}