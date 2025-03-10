// Chrome Storage API 工具函数

/**
 * 初始化数据库
 * @returns {Promise<void>}
 */
export function initDB() {
    return Promise.resolve();
}

/**
 * 获取所有工作流
 * @returns {Promise<Array>}
 */
export function getAllWorkflows() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['workflows'], (result) => {
            resolve(result.workflows || []);
        });
    });
}

/**
 * 添加工作流
 * @param {Object} workflow - 工作流对象
 * @returns {Promise<void>}
 */
export function addWorkflow(workflow) {
    return new Promise((resolve, reject) => {
        getAllWorkflows().then(workflows => {
            workflows.push(workflow);
            chrome.storage.local.set({ workflows }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error('添加工作流失败：' + chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    });
}

/**
 * 更新工作流
 * @param {Object} workflow - 工作流对象
 * @returns {Promise<void>}
 */
export function updateWorkflow(workflow) {
    return new Promise((resolve, reject) => {
        getAllWorkflows().then(workflows => {
            const index = workflows.findIndex(w => w.id === workflow.id);
            if (index === -1) {
                reject(new Error('工作流不存在'));
                return;
            }
            workflows[index] = workflow;
            chrome.storage.local.set({ workflows }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error('更新工作流失败：' + chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    });
}

/**
 * 删除工作流
 * @param {string} id - 工作流ID
 * @returns {Promise<void>}
 */
export function deleteWorkflow(id) {
    return new Promise((resolve, reject) => {
        getAllWorkflows().then(workflows => {
            const filteredWorkflows = workflows.filter(w => w.id !== id);
            chrome.storage.local.set({ workflows: filteredWorkflows }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error('删除工作流失败：' + chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    });
}

/**
 * 获取单个工作流
 * @param {string} id - 工作流ID
 * @returns {Promise<Object>}
 */
export function getWorkflow(id) {
    return new Promise((resolve, reject) => {
        getAllWorkflows().then(workflows => {
            const workflow = workflows.find(w => w.id === id);
            if (!workflow) {
                reject(new Error('工作流不存在'));
            } else {
                resolve(workflow);
            }
        });
    });
} 