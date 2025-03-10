import { updateWorkflow } from '../utils/db.js';

/**
 * 创建流程图编辑器
 * @param {Object} workflow - 工作流对象
 * @param {Function} onSave - 保存回调函数
 * @returns {HTMLElement}
 */
export function createWorkflowEditor(workflow, onSave) {
    // 创建模态框容器
    const modal = document.createElement('div');
    modal.className = 'workflow-editor-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    // 创建编辑器容器
    const editor = document.createElement('div');
    editor.className = 'workflow-editor';
    editor.style.backgroundColor = 'white';
    editor.style.borderRadius = '8px';
    editor.style.padding = '16px';
    editor.style.width = '90%';
    editor.style.maxWidth = '600px';
    editor.style.height = '90%';
    editor.style.maxHeight = '800px';
    editor.style.display = 'flex';
    editor.style.flexDirection = 'column';
    editor.style.position = 'relative';
    editor.style.overflowY = 'auto';
    editor.style.boxSizing = 'border-box';

    // 创建标题输入框
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = workflow.name;
    titleInput.placeholder = '输入工作流名称';
    titleInput.style.width = '100%';
    titleInput.style.fontSize = '18px';
    titleInput.style.fontWeight = '500';
    titleInput.style.padding = '8px';
    titleInput.style.border = '1px solid #ddd';
    titleInput.style.borderRadius = '4px';
    titleInput.style.marginBottom = '16px';
    titleInput.style.boxSizing = 'border-box';

    // 标题输入事件
    titleInput.addEventListener('input', (e) => {
        workflow.name = e.target.value;
    });

    // 创建流程图容器
    const flowchart = document.createElement('div');
    flowchart.className = 'workflow-flowchart';
    flowchart.style.flex = '1';
    flowchart.style.backgroundColor = '#f5f5f5';
    flowchart.style.borderRadius = '4px';
    flowchart.style.padding = '16px';
    flowchart.style.position = 'relative';
    flowchart.style.overflowY = 'auto';
    flowchart.style.marginBottom = '16px';
    flowchart.style.boxSizing = 'border-box';

    // 创建步骤列表
    const stepsList = document.createElement('div');
    stepsList.className = 'workflow-steps-list';
    stepsList.style.display = 'flex';
    stepsList.style.flexDirection = 'column';
    stepsList.style.gap = '16px';
    stepsList.style.alignItems = 'stretch';
    stepsList.style.width = '100%';
    stepsList.style.boxSizing = 'border-box';

    // 添加现有步骤
    workflow.steps.forEach((step, index) => {
        const stepNode = createStepNode(step, index);
        stepsList.appendChild(stepNode);
        if (index < workflow.steps.length - 1) {
            const arrow = createArrow();
            stepsList.appendChild(arrow);
        }
    });

    // 创建添加步骤按钮
    const addStepBtn = document.createElement('button');
    addStepBtn.className = 'add-step-button';
    addStepBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M12 4a.5.5 0 0 1 .5.5V11h6.5a.5.5 0 0 1 0 1H12.5v6.5a.5.5 0 0 1-1 0V12H5a.5.5 0 0 1 0-1h6.5V4.5A.5.5 0 0 1 12 4Z"/>
        </svg>
        添加步骤
    `;
    addStepBtn.style.padding = '8px 16px';
    addStepBtn.style.backgroundColor = '#007AFF';
    addStepBtn.style.color = 'white';
    addStepBtn.style.border = 'none';
    addStepBtn.style.borderRadius = '4px';
    addStepBtn.style.cursor = 'pointer';
    addStepBtn.style.display = 'flex';
    addStepBtn.style.alignItems = 'center';
    addStepBtn.style.gap = '8px';
    addStepBtn.style.margin = '20px auto';

    // 添加步骤事件
    addStepBtn.addEventListener('click', () => {
        const newStep = {
            id: crypto.randomUUID(),
            title: '新步骤',
            url: '',
            description: ''
        };
        
        if (workflow.steps.length > 0) {
            const arrow = createArrow();
            stepsList.appendChild(arrow);
        }
        
        const stepNode = createStepNode(newStep, workflow.steps.length);
        stepsList.appendChild(stepNode);
        workflow.steps.push(newStep);
    });

    // 创建底部按钮组
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.gap = '12px';
    actions.style.marginTop = '20px';

    // 取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.className = 'secondary-button';
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.style.border = '1px solid #ddd';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.backgroundColor = 'white';
    cancelBtn.style.cursor = 'pointer';

    // 保存按钮
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '保存';
    saveBtn.className = 'primary-button';
    saveBtn.style.padding = '8px 16px';
    saveBtn.style.backgroundColor = '#007AFF';
    saveBtn.style.color = 'white';
    saveBtn.style.border = 'none';
    saveBtn.style.borderRadius = '4px';
    saveBtn.style.cursor = 'pointer';

    // 添加按钮事件
    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });

    saveBtn.addEventListener('click', async () => {
        try {
            await updateWorkflow(workflow);
            onSave(workflow);
            modal.remove();
        } catch (error) {
            alert('保存失败：' + error.message);
        }
    });

    // 组装界面
    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);

    flowchart.appendChild(stepsList);
    flowchart.appendChild(addStepBtn);

    editor.appendChild(titleInput);
    editor.appendChild(flowchart);
    editor.appendChild(actions);

    modal.appendChild(editor);
    document.body.appendChild(modal);

    return modal;
}

/**
 * 创建步骤节点
 * @param {Object} step - 步骤对象
 * @param {number} index - 步骤索引
 * @returns {HTMLElement}
 */
function createStepNode(step, index) {
    const node = document.createElement('div');
    node.className = 'workflow-step-node';
    node.style.backgroundColor = 'white';
    node.style.borderRadius = '8px';
    node.style.padding = '12px';
    node.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    node.style.width = '100%';
    node.style.boxSizing = 'border-box';

    // 步骤标题输入框
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = step.title;
    titleInput.placeholder = '步骤标题';
    titleInput.style.width = '100%';
    titleInput.style.marginBottom = '8px';
    titleInput.style.padding = '4px 8px';
    titleInput.style.border = '1px solid #ddd';
    titleInput.style.borderRadius = '4px';
    titleInput.style.fontSize = '14px';
    titleInput.style.boxSizing = 'border-box';

    // URL输入框
    const urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.value = step.url;
    urlInput.placeholder = '网站URL';
    urlInput.style.width = '100%';
    urlInput.style.marginBottom = '8px';
    urlInput.style.padding = '4px 8px';
    urlInput.style.border = '1px solid #ddd';
    urlInput.style.borderRadius = '4px';
    urlInput.style.fontSize = '14px';
    urlInput.style.boxSizing = 'border-box';

    // 备注输入框
    const memoInput = document.createElement('input');
    memoInput.type = 'text';
    memoInput.value = step.memo || '';
    memoInput.placeholder = '步骤备注';
    memoInput.style.width = '100%';
    memoInput.style.padding = '4px 8px';
    memoInput.style.border = '1px solid #ddd';
    memoInput.style.borderRadius = '4px';
    memoInput.style.fontSize = '14px';
    memoInput.style.boxSizing = 'border-box';
    memoInput.style.color = '#666';

    // 添加输入事件
    titleInput.addEventListener('input', (e) => {
        step.title = e.target.value;
    });

    urlInput.addEventListener('input', (e) => {
        step.url = e.target.value;
    });

    memoInput.addEventListener('input', (e) => {
        step.memo = e.target.value;
    });

    node.appendChild(titleInput);
    node.appendChild(urlInput);
    node.appendChild(memoInput);

    return node;
}

/**
 * 创建箭头连接线
 * @returns {HTMLElement}
 */
function createArrow() {
    const arrow = document.createElement('div');
    arrow.className = 'workflow-arrow';
    arrow.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
        </svg>
    `;
    arrow.style.margin = '8px 0';
    return arrow;
} 