// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBIx7w4QR8KJKWwtYTOozTOI2UhSIjr1SE",
  authDomain: "henobuildevents.firebaseapp.com",
  projectId: "henobuildevents",
  storageBucket: "henobuildevents.firebasestorage.app",
  messagingSenderId: "127030566136",
  appId: "1:127030566136:web:801b027cd342e3e42daf0d",
  measurementId: "G-97J5XDS7ZV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);