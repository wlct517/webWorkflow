// 导入工具函数
import { initDB, getAllWorkflows, addWorkflow, deleteWorkflow, updateWorkflow } from '../utils/db.js';
import { exportData, importData } from '../utils/io.js';
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
            description: '点击编辑工作流描述',
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

    exportBtn.addEventListener('click', async () => {
        try {
            await exportData();
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