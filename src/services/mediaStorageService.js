// src/services/mediaStorageService.js
// Authoritative IndexedDB Durable Storage Service for Video & Heavy Media Evidence

const DB_NAME = 'ids_pulse_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

let dbPromise = null;

function openMediaDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });

  return dbPromise;
}

/**
 * Stores a Blob or File in IndexedDB under a unique key.
 * @param {string} key - Unique media key
 * @param {Blob|File} blob - Raw binary media file
 * @returns {Promise<string>} Stored media key
 */
export async function storeMediaBlob(key, blob) {
  if (!key || !blob) throw new Error('Key and Blob are required to store media.');
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(blob, key);
    tx.oncomplete = () => resolve(key);
    tx.onerror = () => reject(tx.error);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves a Blob from IndexedDB by media key.
 * @param {string} key - Unique media key
 * @returns {Promise<Blob|null>} Binary media blob or null
 */
export async function getMediaBlob(key) {
  if (!key) return null;
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('[MediaStorageService] Error reading IndexedDB blob:', err);
    return null;
  }
}

/**
 * Deletes a Blob from IndexedDB by media key.
 * @param {string} key - Unique media key
 * @returns {Promise<boolean>} Success flag
 */
export async function deleteMediaBlob(key) {
  if (!key) return false;
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('[MediaStorageService] Error deleting IndexedDB blob:', err);
    return false;
  }
}
