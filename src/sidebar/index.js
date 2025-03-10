// 导入工具函数
import { initDB, getAllWorkflows, addWorkflow, deleteWorkflow, updateWorkflow } from '../utils/db.js';
import { exportSelected, exportAll, importData } from '../utils/io.js';
import { createWorkflowElement, editWorkflow } from '../components/workflow.js';
import { createWorkflowEditor } from '../components/workflow-editor.js';
import { showSettings } from '../components/settings.js';
import { searchWithAI } from '../utils/ai-search.js';

// 初始化数据库
initDB().then(() => {
    // DOM 元素
    const searchInput = document.getElementById('searchInput');
    const workflowList = document.getElementById('workflowList');
    const newWorkflowBtn = document.getElementById('newWorkflowBtn');
    const importBtn = document.getElementById('importBtn');
    const exportBtn = document.getElementById('exportBtn');
    const exportSelectedBtn = document.getElementById('exportSelectedBtn');
    const exportAllBtn = document.getElementById('exportAllBtn');
    const settingsBtn = document.getElementById('settingsBtn');

    // 加载工作流列表
    async function loadWorkflows(searchTerm = '') {
        const workflows = await getAllWorkflows();
        
        // 清空现有列表
        workflowList.innerHTML = '';
        
        let filteredWorkflows = workflows;
        
        if (searchTerm) {
            try {
                // 尝试使用AI搜索
                filteredWorkflows = await searchWithAI(searchTerm, workflows);
            } catch (error) {
                console.error('AI搜索失败，使用普通搜索：', error);
                // 如果AI搜索失败，使用普通搜索
                filteredWorkflows = workflows.filter(w => 
                    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    w.description?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
        }
        
        // 渲染工作流列表
        filteredWorkflows.forEach(workflow => {
            const element = createWorkflowElement(workflow);
            workflowList.appendChild(element);
        });
    }

    // 创建新工作流
    async function createNewWorkflow() {
        const workflow = {
            id: crypto.randomUUID(),
            name: '新工作流',
            description: '',
            icon: 'default',
            color: '',
            steps: [
                {
                    id: crypto.randomUUID(),
                    title: '步骤1',
                    url: '',
                    description: ''
                },
                {
                    id: crypto.randomUUID(),
                    title: '步骤2',
                    url: '',
                    description: ''
                }
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        createWorkflowEditor(workflow, async (updatedWorkflow) => {
            try {
                const element = createWorkflowElement(updatedWorkflow);
                workflowList.appendChild(element);
            } catch (error) {
                console.error('创建工作流失败：', error);
                alert('创建工作流失败：' + error.message);
            }
        }, true);
    }

    // 搜索功能
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadWorkflows(e.target.value);
        }, 300);
    });

    // 导入导出功能
    importBtn.addEventListener('click', async () => {
        try {
            await importData();
            await loadWorkflows();
            alert('导入成功！');
        } catch (error) {
            alert('导入失败：' + error.message);
        }
    });

    // 选择导出功能
    exportSelectedBtn.addEventListener('click', async () => {
        try {
            // 获取所有工作流
            const workflows = await getAllWorkflows();
            
            // 创建选择对话框
            const dialog = document.createElement('div');
            dialog.className = 'export-dialog';
            dialog.innerHTML = `
                <div class="export-dialog-content">
                    <h3>选择要导出的工作流</h3>
                    <div class="workflow-checkboxes"></div>
                    <div class="dialog-actions">
                        <button class="secondary-button" id="cancelExport">取消</button>
                        <button class="primary-button" id="confirmExport">确认导出</button>
                    </div>
                </div>
            `;
            
            // 添加工作流选择框
            const checkboxesContainer = dialog.querySelector('.workflow-checkboxes');
            workflows.forEach(workflow => {
                const label = document.createElement('label');
                label.className = 'workflow-checkbox';
                label.innerHTML = `
                    <input type="checkbox" value="${workflow.id}">
                    <span>${workflow.name}</span>
                `;
                checkboxesContainer.appendChild(label);
            });
            
            // 添加到页面
            document.body.appendChild(dialog);
            
            // 绑定事件
            const cancelBtn = dialog.querySelector('#cancelExport');
            const confirmBtn = dialog.querySelector('#confirmExport');
            
            cancelBtn.addEventListener('click', () => {
                dialog.remove();
            });
            
            confirmBtn.addEventListener('click', async () => {
                const selectedIds = Array.from(dialog.querySelectorAll('input[type="checkbox"]:checked'))
                    .map(checkbox => checkbox.value);
                
                if (selectedIds.length === 0) {
                    alert('请至少选择一个工作流');
                    return;
                }
                
                try {
                    await exportSelected(selectedIds);
                    dialog.remove();
                    alert('导出成功！');
                } catch (error) {
                    alert('导出失败：' + error.message);
                }
            });
        } catch (error) {
            alert('导出失败：' + error.message);
        }
    });

    // 全部导出功能
    exportAllBtn.addEventListener('click', async () => {
        try {
            await exportAll();
            alert('导出成功！');
        } catch (error) {
            alert('导出失败：' + error.message);
        }
    });

    // 设置按钮点击事件
    settingsBtn.addEventListener('click', () => {
        showSettings();
    });

    // 新建工作流
    newWorkflowBtn.addEventListener('click', createNewWorkflow);

    // 初始加载
    loadWorkflows();
}); 