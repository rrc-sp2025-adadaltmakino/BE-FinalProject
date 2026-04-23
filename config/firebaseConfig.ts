/**
 * Firebase Admin SDK initialization module
 *
 * This module handles the initialization of Firebase Admin SDK for server-side
 * operations. It sets up authentication and Firestore database connections.
 */

import {
    initializeApp,
    cert,
    getApps,
    App,
    AppOptions,
    ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

/**
 * Retrieves Firebase configuration from environment variables
 *
 * @returns {AppOptions} Firebase application configuration object
 * @throws {Error} If any required environment variables are missing
 */
const getFirebaseConfig = (): AppOptions => {
    // Extract Firebase credentials from environment variables
    const {
        FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY,
    } = process.env;

    // Validate that all required configuration values are present
    if (
        !FIREBASE_PROJECT_ID ||
        !FIREBASE_CLIENT_EMAIL ||
        !FIREBASE_PRIVATE_KEY
    ) {
        // You could definitely create a custom error to use here
        throw new Error(
            "Missing Firebase configuration. Please check your environment variables."
        );
    }

    // Create a service account object with the provided credentials
    const serviceAccount: ServiceAccount = {
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines in the private key string with actual newlines
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };

    // Return the app configuration with credentials
    return {
        credential: cert(serviceAccount),
    };
};

/**
 * Initializes Firebase Admin SDK if not already initialized
 *
 * This function implements the singleton pattern to ensure only
 * one Firebase app instance is created.
 *
 * @returns {App} Firebase Admin app instance
 */
const initializeFirebaseAdmin = (): App => {
    // Check if an app is already initialized
    const existingApp: App = getApps()[0];
    if (existingApp) {
        // Return existing app if found
        return existingApp;
    }
    // Otherwise create and return a new app
    return initializeApp(getFirebaseConfig());
};

// Initialize the Firebase Admin app
const app: App = initializeFirebaseAdmin();

const db: Firestore = getFirestore(app);

const auth: Auth = getAuth(app);

export { db, auth };