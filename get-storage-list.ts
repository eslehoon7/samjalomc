import { initializeApp } from "firebase/app";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import firebaseConfig from "./firebase-applet-config.json";

// samjal-oriental-clinic.firebasestorage.app 버킷을 직접 가리키도록 설정
const config = {
  ...firebaseConfig,
  storageBucket: "samjal-oriental-clinic.firebasestorage.app"
};

const app = initializeApp(config);
const storage = getStorage(app);

async function listDir(path: string) {
  console.log(`Listing samjal-oriental-clinic storage: ${path}`);
  try {
    const listRef = ref(storage, path);
    const res = await listAll(listRef);
    console.log(`Found ${res.prefixes.length} folders and ${res.items.length} files in "${path}"`);
    for (const prefix of res.prefixes) {
      console.log(`Folder: ${prefix.fullPath}`);
    }
    for (const itemRef of res.items) {
      const url = await getDownloadURL(itemRef);
      console.log(`File: ${itemRef.name} -> URL: ${url}`);
    }
  } catch (error) {
    console.error(`Error listing ${path}:`, error);
  }
}

async function main() {
  await listDir("image");
  process.exit(0);
}

main();
