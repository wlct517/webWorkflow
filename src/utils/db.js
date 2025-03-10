// IndexedDB 数据库工具函数

const DB_NAME = 'workflowDB';
const DB_VERSION = 1;
const STORE_NAME = 'workflows';

let db = null;

/**
 * 初始化数据库
 * @returns {Promise<void>}
 */
export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error('数据库打开失败'));
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('name', 'name', { unique: false });
                store.createIndex('created_at', 'created_at', { unique: false });
            }
        };
    });
}

/**
 * 获取所有工作流
 * @returns {Promise<Array>}
 */
export function getAllWorkflows() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(new Error('获取工作流失败'));
        };
    });
}

/**
 * 添加工作流
 * @param {Object} workflow - 工作流对象
 * @returns {Promise<void>}
 */
export function addWorkflow(workflow) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(workflow);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(new Error('添加工作流失败'));
        };
    });
}

/**
 * 更新工作流
 * @param {Object} workflow - 工作流对象
 * @returns {Promise<void>}
 */
export function updateWorkflow(workflow) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(workflow);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(new Error('更新工作流失败'));
        };
    });
}

/**
 * 删除工作流
 * @param {string} id - 工作流ID
 * @returns {Promise<void>}
 */
export function deleteWorkflow(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(new Error('删除工作流失败'));
        };
    });
}

/**
 * 获取单个工作流
 * @param {string} id - 工作流ID
 * @returns {Promise<Object>}
 */
export function getWorkflow(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(new Error('获取工作流失败'));
        };
    });
} 