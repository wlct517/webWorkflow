import { getAllWorkflows, addWorkflow } from './db.js';

/**
 * 导出选中的工作流数据
 * @param {Array<string>} selectedIds - 选中的工作流ID数组
 * @returns {Promise<void>}
 */
export function exportSelected(selectedIds) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get(['workflows'], (result) => {
                const allWorkflows = result.workflows || [];
                const selectedWorkflows = allWorkflows.filter(workflow => selectedIds.includes(workflow.id));
                
                const blob = new Blob([JSON.stringify(selectedWorkflows, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                // 使用 chrome.downloads.download API 保存到桌面
                chrome.downloads.download({
                    url: url,
                    filename: `workflows_${new Date().toLocaleDateString().replace(/[\/\\]/g, '-')}.json`,
                    saveAs: false,
                    conflictAction: 'uniquify'
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        URL.revokeObjectURL(url);
                        resolve();
                    }
                });
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 导出全部工作流数据
 * @returns {Promise<void>}
 */
export function exportAll() {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get(['workflows'], (result) => {
                const workflows = result.workflows || [];
                const blob = new Blob([JSON.stringify(workflows, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                // 使用 chrome.downloads.download API 保存到桌面
                chrome.downloads.download({
                    url: url,
                    filename: `workflows_${new Date().toLocaleDateString().replace(/[\/\\]/g, '-')}.json`,
                    saveAs: false,
                    conflictAction: 'uniquify'
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        URL.revokeObjectURL(url);
                        resolve();
                    }
                });
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 导入工作流数据
 * @returns {Promise<void>}
 */
export function importData() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (event) => {
            try {
                const file = event.target.files[0];
                if (!file) {
                    reject(new Error('未选择文件'));
                    return;
                }

                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const workflows = JSON.parse(e.target.result);
                        
                        // 验证数据格式
                        if (!Array.isArray(workflows)) {
                            throw new Error('无效的数据格式');
                        }

                        // 验证每个工作流的必要字段
                        workflows.forEach(workflow => {
                            if (!workflow.id || !workflow.name || !Array.isArray(workflow.steps)) {
                                throw new Error('工作流数据格式不正确');
                            }
                        });

                        // 获取现有工作流
                        const existingWorkflows = await getAllWorkflows();
                        const existingIds = new Set(existingWorkflows.map(w => w.id));
                        const existingNames = new Set(existingWorkflows.map(w => w.name));

                        // 过滤出不重复的工作流
                        const newWorkflows = workflows.filter(workflow => {
                            const isDuplicate = existingIds.has(workflow.id) || existingNames.has(workflow.name);
                            return !isDuplicate;
                        });

                        // 导入不重复的工作流
                        for (const workflow of newWorkflows) {
                            await addWorkflow(workflow);
                        }

                        // 如果有被过滤掉的工作流，提示用户
                        if (newWorkflows.length < workflows.length) {
                            const skippedCount = workflows.length - newWorkflows.length;
                            resolve({
                                success: true,
                                message: `成功导入 ${newWorkflows.length} 个工作流，跳过 ${skippedCount} 个重复的工作流。`
                            });
                        } else {
                            resolve({
                                success: true,
                                message: `成功导入 ${newWorkflows.length} 个工作流。`
                            });
                        }
                    } catch (error) {
                        reject(new Error('解析文件失败: ' + error.message));
                    }
                };

                reader.onerror = () => {
                    reject(new Error('读取文件失败'));
                };

                reader.readAsText(file);
            } catch (error) {
                reject(error);
            }
        };

        input.click();
    });
} 