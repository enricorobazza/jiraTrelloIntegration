import admin from 'firebase-admin';
import serviceAccount from './jiratrellointegration-firebase-adminsdk-tygwc-26d0324d75.json';

let isInitialized = false;
let db = null;

const getInstance = () => {
  if (!isInitialized) {
    isInitialized = true;

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://jiratrellointegration.firebaseio.com',
    });

    db = admin.firestore();
  }
  return db;
};

export default getInstance;
