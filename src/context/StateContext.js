import React, { createContext, useContext, useState, useEffect } from 'react';

const StateContext = createContext();

export const useStateContext = () => useContext(StateContext);

const DB_KEYS = {
    CUSTOMERS: 'customers',
    STAFF: 'staff',
    RESOURCES: 'resources',
    SERVICES: 'services',
    BOOKINGS: 'bookings',
    BLOCKED_PERIODS: 'blockedPeriods',
    SETTINGS: 'settings',
    EXPENSES: 'expenses',
    TRANSACTIONS: 'transactions',
    WAITING_LIST: 'waitingList',
    MIGRATION_VERSION: 'migrationVersion'
};

const defaultState = {
    customers: [],
    staff: [],
    resources: [],
    services: [],
    bookings: [],
    blockedPeriods: [],
    expenses: [],
    transactions: [],
    waitingList: [],
    settings: {
        rates: { standard: 30.00, intermediate: 35.00, advanced: 40.00 },
        mockTestRate: 60.00,
        mockTestDuration: 1.5,
        packages: [],
        suggestionCount: 3,
        instructorName: 'Ray Ryan',
        instructorAddress: '123 Driving School Ln, Town, T12 3AB',
        paymentDetails: 'Please make payment via Bank Transfer to:\nAccount Name: Ray Ryan\nSort Code: 00-00-00\nAccount No: 00000000',
        smsTemplate: 'Hi [CustomerFirstName], this is a friendly reminder for your driving lesson on [LessonDate] at [LessonTime]. See you then! From [InstructorName].',
        autoBackupEnabled: false,
        firstDayOfWeek: 'monday',
        aiProvider: 'gemini',
        apiKeys: { gemini: '', openai: '', perplexity: '', openrouter: '' },
        apiModels: { gemini: 'gemini-1.5-flash-latest', openai: 'gpt-4-turbo', perplexity: 'llama-3-sonar-large-32k-online', openrouter: 'google/gemini-flash-1.5' }
    }
};

export const StateProvider = ({ children }) => {
    const [state, setState] = useState(() => {
        // Load initial state from localStorage
        try {
            const loadedState = {};
            for (const key in DB_KEYS) {
                const item = localStorage.getItem(DB_KEYS[key]);
                if (item) {
                    loadedState[DB_KEYS[key]] = JSON.parse(item);
                }
            }
            return { ...defaultState, ...loadedState };
        } catch (error) {
            console.error("Failed to load state from localStorage:", error);
            return defaultState;
        }
    });

    const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', buttons: [] });

    const showDialog = (title, message, buttons) => {
        setDialog({ isOpen: true, title, message, buttons });
    };

    const closeDialog = () => {
        setDialog({ isOpen: false, title: '', message: '', buttons: [] });
    };

    useEffect(() => {
        // Save state to localStorage whenever it changes
        try {
            for (const key in state) {
                if (Object.values(DB_KEYS).includes(key)) {
                    localStorage.setItem(key, JSON.stringify(state[key]));
                }
            }
        } catch (error) {
            console.error("Failed to save state to localStorage:", error);
        }
    }, [state]);

    return (
        <StateContext.Provider value={{ state, setState, dialog, showDialog, closeDialog }}>
            {children}
        </StateContext.Provider>
    );
};
