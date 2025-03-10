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
                const a = document.createElement('a');
                a.href = url;
                a.download = `workflows_${new Date().toISOString()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                resolve();
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
                const a = document.createElement('a');
                a.href = url;
                a.download = `workflows_${new Date().toISOString()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                resolve();
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

                        // 导入工作流
                        for (const workflow of workflows) {
                            await addWorkflow(workflow);
                        }

                        resolve();
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