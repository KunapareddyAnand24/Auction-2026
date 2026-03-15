import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyD_HgWQilUyiuEpkabOucQB8o1vBtrU3Gw",
    authDomain: "auction-game-43de1.firebaseapp.com",
    databaseURL: "https://auction-game-43de1-default-rtdb.firebaseio.com",
    projectId: "auction-game-43de1",
    storageBucket: "auction-game-43de1.firebasestorage.app",
    messagingSenderId: "440355558828",
    appId: "1:440355558828:web:92c48837fabc9b1b7a5609",
    measurementId: "G-KK5FHK2QQY"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function testWrite() {
    try {
        const testRef = ref(db, 'test/connectivity');
        await set(testRef, { timestamp: Date.now() });
        console.log("SUCCESS: Can write to the database");
    } catch (error) {
        console.error("ERROR details:", error.message, error.code, error.name);
    }
    process.exit();
}

testWrite();
