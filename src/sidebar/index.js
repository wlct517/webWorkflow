// 导入工具函数
import { initDB, getAllWorkflows, addWorkflow, deleteWorkflow, updateWorkflow } from '../utils/db.js';
import { exportSelected, exportAll, importData } from '../utils/io.js';
import { createWorkflowElement, editWorkflow } from '../components/workflow.js';
import { createWorkflowEditor } from '../components/workflow-editor.js';
import { showSettings } from '../components/settings.js';
import { searchWithAI } from '../utils/ai-search.js';

// 定义颜色选项
const colors = [
    { name: '默认', value: '' },
    { name: '红色', value: '#FF3B30' },
    { name: '橙色', value: '#FF9500' },
    { name: '黄色', value: '#FFCC00' },
    { name: '绿色', value: '#34C759' },
    { name: '蓝色', value: '#007AFF' },
    { name: '紫色', value: '#AF52DE' },
    { name: '灰色', value: '#8E8E93' }
];

// 改为数组以支持多选
let selectedColors = [];

// 更新AI按钮状态
async function updateAIButtonState() {
    const settingsBtn = document.getElementById('settingsBtn');
    const result = await chrome.storage.local.get(['apiKey', 'aiEnabled']);
    if (result.apiKey && result.aiEnabled) {
        settingsBtn.classList.add('active');
    } else {
        settingsBtn.classList.remove('active');
    }
}

// 加载工作流列表
async function loadWorkflows(searchTerm = '', filterColors = []) {
    const workflows = await getAllWorkflows();
    
    // 获取工作流列表元素
    const workflowList = document.getElementById('workflowList');
    
    // 清空现有列表
    workflowList.innerHTML = '';
    
    let filteredWorkflows = workflows;
    
    // 应用搜索过滤
    if (searchTerm) {
        try {
            // 检查AI搜索是否启用
            const { apiKey, aiEnabled } = await chrome.storage.local.get(['apiKey', 'aiEnabled']);
            
            if (apiKey && aiEnabled) {
                // 使用AI搜索
                filteredWorkflows = await searchWithAI(searchTerm, workflows);
            } else {
                // 使用普通搜索
                filteredWorkflows = workflows.filter(w => 
                    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    w.description?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            // 确保工作流的唯一性：使用Map来去重，保持相关度排序
            const uniqueWorkflows = new Map();
            filteredWorkflows.forEach(workflow => {
                if (!uniqueWorkflows.has(workflow.id)) {
                    uniqueWorkflows.set(workflow.id, workflow);
                }
            });
            
            // 转换回数组，保持原有顺序
            filteredWorkflows = Array.from(uniqueWorkflows.values());

        } catch (error) {
            console.error('搜索失败，使用普通搜索：', error);
            // 如果搜索失败，使用普通搜索
            filteredWorkflows = workflows.filter(w => 
                w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                w.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            // 对普通搜索结果也进行去重
            const uniqueWorkflows = new Map();
            filteredWorkflows.forEach(workflow => {
                if (!uniqueWorkflows.has(workflow.id)) {
                    uniqueWorkflows.set(workflow.id, workflow);
                }
            });
            
            filteredWorkflows = Array.from(uniqueWorkflows.values());
        }
    }

    // 应用颜色过滤
    if (filterColors.length > 0) {
        filteredWorkflows = filteredWorkflows.filter(w => filterColors.includes(w.color));
    }
    
    // 渲染工作流列表
    filteredWorkflows.forEach(workflow => {
        const element = createWorkflowElement(workflow);
        workflowList.appendChild(element);
    });

    // 更新筛选按钮的状态
    const filterBtn = document.getElementById('filterBtn');
    if (filterColors.length > 0) {
        filterBtn.style.backgroundColor = 'var(--hover-color)';
    } else {
        filterBtn.style.backgroundColor = 'transparent';
    }
}

// 显示颜色筛选对话框
function showColorFilterDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'color-filter-dialog';

    const content = document.createElement('div');
    content.className = 'color-filter-content';

    content.innerHTML = `
        <div class="color-filter-header">
            <h3>筛选标签颜色（可多选）</h3>
            <button class="settings-close">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                </svg>
            </button>
        </div>
        <div class="color-options">
            ${colors.map(color => `
                <div class="color-option ${selectedColors.includes(color.value) ? 'selected' : ''}"
                     style="background-color: ${color.value || '#FFFFFF'}; ${!color.value ? 'border: 2px dashed #ddd;' : ''}"
                     title="${color.name}"
                     data-color="${color.value}">
                     ${selectedColors.includes(color.value) ? '<div class="checkmark"></div>' : ''}
                </div>
            `).join('')}
        </div>
        <div class="color-filter-actions">
            <button class="secondary-button" id="clearFilter">清除筛选</button>
            <button class="primary-button" id="applyFilter">应用</button>
        </div>
    `;

    // 添加颜色选择事件
    content.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            const color = option.dataset.color;
            const index = selectedColors.indexOf(color);
            
            if (index === -1) {
                // 添加选中状态
                selectedColors.push(color);
                option.classList.add('selected');
                const checkmark = document.createElement('div');
                checkmark.className = 'checkmark';
                option.appendChild(checkmark);
            } else {
                // 移除选中状态
                selectedColors.splice(index, 1);
                option.classList.remove('selected');
                option.querySelector('.checkmark')?.remove();
            }
        });
    });

    // 添加清除筛选事件
    content.querySelector('#clearFilter').addEventListener('click', () => {
        selectedColors = [];
        loadWorkflows(searchInput.value, []);
        dialog.remove();
    });

    // 添加应用筛选事件
    content.querySelector('#applyFilter').addEventListener('click', () => {
        loadWorkflows(searchInput.value, selectedColors);
        dialog.remove();
    });

    // 添加关闭按钮事件
    const closeButton = content.querySelector('.settings-close');
    closeButton.addEventListener('click', () => {
        dialog.remove();
    });

    dialog.appendChild(content);

    // 点击遮罩层关闭
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
        }
    });

    document.body.appendChild(dialog);
}

// 初始化数据库
initDB().then(() => {
    // DOM 元素
    const searchInput = document.getElementById('searchInput');
    const filterBtn = document.getElementById('filterBtn');
    const workflowList = document.getElementById('workflowList');
    const newWorkflowBtn = document.getElementById('newWorkflowBtn');
    const importBtn = document.getElementById('importBtn');
    const exportBtn = document.getElementById('exportBtn');
    const exportSelectedBtn = document.getElementById('exportSelectedBtn');
    const exportAllBtn = document.getElementById('exportAllBtn');
    const settingsBtn = document.getElementById('settingsBtn');

    // 初始化时更新AI按钮状态
    updateAIButtonState();

    // 设置按钮点击事件
    const toggleNotesBtn = document.getElementById('toggleNotesBtn');
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');

    // 用于跟踪备注状态
    let isNotesExpanded = false;

    toggleNotesBtn.addEventListener('click', () => {
        const toggleButtons = document.querySelectorAll('.workflow-item .toggle-button');
        if (!isNotesExpanded) {
            // 展开所有备注
            toggleButtons.forEach(btn => {
                const memoContainer = btn.parentElement.nextElementSibling;
                if (memoContainer && memoContainer.style.display === 'none') {
                    btn.click();
                }
            });
            toggleNotesBtn.textContent = '备注关闭';
        } else {
            // 关闭所有备注
            toggleButtons.forEach(btn => {
                const memoContainer = btn.parentElement.nextElementSibling;
                if (memoContainer && memoContainer.style.display !== 'none') {
                    btn.click();
                }
            });
            toggleNotesBtn.textContent = '备注展开';
        }
        isNotesExpanded = !isNotesExpanded;
    });

    batchDeleteBtn.addEventListener('click', () => {
        showBatchDeleteDialog();
    });

    // AI设置按钮点击事件
    settingsBtn.addEventListener('click', () => {
        showSettings();
    });

    // 监听storage变化，更新AI按钮状态
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.apiKey || changes.aiEnabled) {
            updateAIButtonState();
        }
    });

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
            loadWorkflows(e.target.value, selectedColors);
        }, 300);
    });

    // 导入导出功能
    importBtn.addEventListener('click', async () => {
        try {
            const result = await importData();
            await loadWorkflows();
            alert(result.message);
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

    // 更多选项按钮点击事件
    const moreOptionsBtn = document.getElementById('moreOptionsBtn');
    moreOptionsBtn.addEventListener('click', () => {
        // 移除原有的showMoreOptionsDialog调用
    });

    // 颜色筛选按钮点击事件
    filterBtn.addEventListener('click', showColorFilterDialog);

    // 新建工作流
    newWorkflowBtn.addEventListener('click', createNewWorkflow);

    // 初始加载
    loadWorkflows();
});

// 显示批量删除对话框
function showBatchDeleteDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'settings-modal';
    dialog.style.display = 'flex';
    dialog.style.justifyContent = 'center';  // 水平居中
    dialog.style.alignItems = 'center';      // 垂直居中
    dialog.style.paddingTop = '0';           // 移除顶部内边距

    const content = document.createElement('div');
    content.className = 'settings-content';
    content.style.margin = '0 auto';         // 居中对齐
    content.style.maxHeight = '90vh';        // 最大高度
    content.style.width = '90%';             // 宽度
    content.style.maxWidth = '400px';        // 最大宽度

    // 创建头部
    const header = document.createElement('div');
    header.className = 'settings-header';
    header.innerHTML = `
        <h2>选择要删除的工作流</h2>
        <button class="settings-close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
            </svg>
        </button>
    `;

    // 创建选择区域
    const selectSection = document.createElement('div');
    selectSection.style.display = 'flex';
    selectSection.style.flexDirection = 'column';
    selectSection.style.gap = '8px';
    selectSection.style.marginTop = '16px';

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

    selectSection.appendChild(selectAllContainer);
    selectSection.appendChild(workflowList);
    selectSection.appendChild(deleteBtn);

    content.appendChild(header);
    content.appendChild(selectSection);
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