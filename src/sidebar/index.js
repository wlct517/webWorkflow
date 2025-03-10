// 导入工具函数
import { initDB, getAllWorkflows, addWorkflow, deleteWorkflow, updateWorkflow } from '../utils/db.js';
import { exportSelected, exportAll, importData } from '../utils/io.js';
import { createWorkflowElement, editWorkflow } from '../components/workflow.js';
import { createWorkflowEditor } from '../components/workflow-editor.js';
import { showSettings } from '../components/settings.js';
import { searchWithAI } from '../utils/ai-search.js';

// 加载工作流列表
async function loadWorkflows(searchTerm = '') {
    const workflows = await getAllWorkflows();
    
    // 获取工作流列表元素
    const workflowList = document.getElementById('workflowList');
    
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

    // 更多选项按钮点击事件
    const moreOptionsBtn = document.getElementById('moreOptionsBtn');
    moreOptionsBtn.addEventListener('click', () => {
        showMoreOptionsDialog();
    });

    // 新建工作流
    newWorkflowBtn.addEventListener('click', createNewWorkflow);

    // 初始加载
    loadWorkflows();
});

// 显示更多选项对话框
function showMoreOptionsDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'settings-modal';
    dialog.style.display = 'flex';

    const content = document.createElement('div');
    content.className = 'settings-content';

    // 创建头部
    const header = document.createElement('div');
    header.className = 'settings-header';
    header.innerHTML = `
        <h2>更多选项</h2>
        <button class="settings-close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
            </svg>
        </button>
    `;

    // 创建选项列表
    const optionsList = document.createElement('div');
    optionsList.style.display = 'flex';
    optionsList.style.flexDirection = 'column';
    optionsList.style.gap = '12px';
    optionsList.style.marginTop = '16px';

    // 展开所有备注选项
    const expandAllBtn = document.createElement('button');
    expandAllBtn.className = 'secondary-button';
    expandAllBtn.style.width = '100%';
    expandAllBtn.textContent = '展开所有备注';
    expandAllBtn.addEventListener('click', () => {
        const toggleButtons = document.querySelectorAll('.toggle-button');
        toggleButtons.forEach(btn => {
            const memoContainer = btn.closest('.workflow-step').querySelector('.memo-container');
            if (memoContainer && memoContainer.style.display === 'none') {
                btn.click();
            }
        });
    });

    // 批量删除选项
    const deleteSection = document.createElement('div');
    deleteSection.style.display = 'flex';
    deleteSection.style.flexDirection = 'column';
    deleteSection.style.gap = '8px';

    const selectAllContainer = document.createElement('div');
    selectAllContainer.style.display = 'flex';
    selectAllContainer.style.alignItems = 'center';
    selectAllContainer.style.gap = '8px';
    selectAllContainer.style.marginBottom = '8px';

    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = 'selectAll';

    const selectAllLabel = document.createElement('label');
    selectAllLabel.htmlFor = 'selectAll';
    selectAllLabel.textContent = '全选';

    selectAllContainer.appendChild(selectAllCheckbox);
    selectAllContainer.appendChild(selectAllLabel);

    const workflowList = document.createElement('div');
    workflowList.style.maxHeight = '200px';
    workflowList.style.overflowY = 'auto';
    workflowList.style.display = 'flex';
    workflowList.style.flexDirection = 'column';
    workflowList.style.gap = '8px';

    // 获取所有工作流并创建复选框
    chrome.storage.local.get(['workflows'], ({ workflows = [] }) => {
        workflows.forEach(workflow => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '8px';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = workflow.id;
            checkbox.className = 'workflow-checkbox';

            const label = document.createElement('label');
            label.textContent = workflow.name;

            item.appendChild(checkbox);
            item.appendChild(label);
            workflowList.appendChild(item);
        });

        // 全选/取消全选功能
        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = workflowList.querySelectorAll('.workflow-checkbox');
            checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
        });
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'primary-button';
    deleteBtn.style.backgroundColor = '#ff3b30';
    deleteBtn.style.marginTop = '12px';
    deleteBtn.textContent = '删除选中项';
    deleteBtn.addEventListener('click', async () => {
        const selectedIds = Array.from(workflowList.querySelectorAll('.workflow-checkbox:checked'))
            .map(cb => cb.value);

        if (selectedIds.length === 0) {
            alert('请至少选择一个工作流');
            return;
        }

        if (confirm(`确定要删除选中的 ${selectedIds.length} 个工作流吗？`)) {
            try {
                const { workflows = [] } = await chrome.storage.local.get(['workflows']);
                const updatedWorkflows = workflows.filter(w => !selectedIds.includes(w.id));
                await chrome.storage.local.set({ workflows: updatedWorkflows });
                await loadWorkflows();
                dialog.remove();
                alert('删除成功！');
            } catch (error) {
                alert('删除失败：' + error.message);
            }
        }
    });

    deleteSection.appendChild(selectAllContainer);
    deleteSection.appendChild(workflowList);
    deleteSection.appendChild(deleteBtn);

    optionsList.appendChild(expandAllBtn);
    optionsList.appendChild(document.createElement('hr'));
    optionsList.appendChild(deleteSection);

    content.appendChild(header);
    content.appendChild(optionsList);
    dialog.appendChild(content);

    // 关闭按钮事件
    const closeBtn = header.querySelector('.settings-close');
    closeBtn.addEventListener('click', () => dialog.remove());

    // 点击遮罩层关闭
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
        }
    });

    document.body.appendChild(dialog);
} 