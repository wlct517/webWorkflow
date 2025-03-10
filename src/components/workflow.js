import { updateWorkflow, deleteWorkflow } from '../utils/db.js';
import { createWorkflowEditor } from './workflow-editor.js';

/**
 * 创建工作流DOM元素
 * @param {Object} workflow - 工作流对象
 * @returns {HTMLElement}
 */
export function createWorkflowElement(workflow) {
    const element = document.createElement('div');
    element.className = 'workflow-item';
    element.dataset.id = workflow.id;

    // 工作流头部（标题和操作按钮）
    const header = document.createElement('div');
    header.className = 'workflow-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';

    // 标题
    const title = document.createElement('input');
    title.type = 'text';
    title.value = workflow.name;
    title.placeholder = '输入标题';
    title.style.margin = '0';
    title.style.fontSize = '16px';
    title.style.fontWeight = '500';
    title.style.border = 'none';
    title.style.outline = 'none';
    title.style.backgroundColor = 'transparent';
    title.style.width = '200px';  // 给定合适的宽度
    title.style.padding = '4px 0';

    // 操作按钮容器
    const actions = document.createElement('div');
    actions.className = 'workflow-actions';
    actions.style.display = 'flex';
    actions.style.gap = '8px';

    // 编辑按钮
    const editBtn = createIconButton('编辑', `
        <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
        </svg>
    `);

    // 删除按钮
    const deleteBtn = createIconButton('删除', `
        <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
        </svg>
    `);

    // 添加按钮事件
    editBtn.addEventListener('click', () => editWorkflow(workflow, element));
    deleteBtn.addEventListener('click', () => deleteWorkflowHandler(workflow.id));

    // 组装头部
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    header.appendChild(title);
    header.appendChild(actions);

    // 添加输入事件
    title.addEventListener('input', async (e) => {
        workflow.name = e.target.value;
        try {
            await updateWorkflow(workflow);
        } catch (error) {
            console.error('更新标题失败：', error);
        }
    });

    // 添加焦点样式
    title.addEventListener('focus', () => {
        title.style.borderBottom = '1px solid #007AFF';
    });

    title.addEventListener('blur', () => {
        title.style.borderBottom = 'none';
    });

    // 描述
    const description = document.createElement('input');
    description.type = 'text';
    description.value = workflow.description || '';
    description.placeholder = '点击编辑工作流描述';
    description.style.margin = '0';
    description.style.fontSize = '14px';
    description.style.color = '#666';
    description.style.width = '100%';
    description.style.border = 'none';
    description.style.padding = '4px 0';
    description.style.outline = 'none';
    description.style.backgroundColor = 'transparent';

    // 添加输入事件
    description.addEventListener('input', async (e) => {
        workflow.description = e.target.value;
        try {
            await updateWorkflow(workflow);
        } catch (error) {
            console.error('更新描述失败：', error);
        }
    });

    // 添加焦点样式
    description.addEventListener('focus', () => {
        description.style.borderBottom = '1px solid #007AFF';
    });

    description.addEventListener('blur', () => {
        description.style.borderBottom = 'none';
    });

    // 步骤列表
    const stepsList = document.createElement('div');
    stepsList.className = 'workflow-steps';
    stepsList.style.marginTop = '12px';

    if (workflow.steps.length > 0) {
        workflow.steps.forEach((step, index) => {
            const stepElement = createStepElement(step, index + 1);
            stepsList.appendChild(stepElement);
        });
    } else {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = '暂无步骤，点击编辑添加步骤';
        emptyMessage.style.color = '#999';
        emptyMessage.style.fontSize = '14px';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.margin = '12px 0';
        stepsList.appendChild(emptyMessage);
    }

    // 组装工作流元素
    element.appendChild(header);
    element.appendChild(description);
    element.appendChild(stepsList);

    return element;
}

/**
 * 创建步骤DOM元素
 * @param {Object} step - 步骤对象
 * @param {number} index - 步骤序号
 * @returns {HTMLElement}
 */
function createStepElement(step, index) {
    const element = document.createElement('div');
    element.className = 'workflow-step';
    element.style.display = 'flex';
    element.style.flexDirection = 'column';
    element.style.padding = '8px';
    element.style.marginTop = '8px';
    element.style.backgroundColor = '#f5f5f5';
    element.style.borderRadius = '6px';

    // 创建主要内容容器
    const mainContent = document.createElement('div');
    mainContent.style.display = 'flex';
    mainContent.style.alignItems = 'center';
    mainContent.style.width = '100%';

    // 步骤序号
    const number = document.createElement('span');
    number.textContent = index;
    number.style.width = '24px';
    number.style.height = '24px';
    number.style.borderRadius = '12px';
    number.style.backgroundColor = '#007AFF';
    number.style.color = 'white';
    number.style.display = 'flex';
    number.style.alignItems = 'center';
    number.style.justifyContent = 'center';
    number.style.marginRight = '8px';
    number.style.fontSize = '12px';
    number.style.flexShrink = '0';
    number.style.minWidth = '24px';

    // 步骤内容
    const content = document.createElement('div');
    content.style.flex = '1';

    const title = document.createElement('div');
    title.textContent = step.title;
    title.style.fontWeight = '500';

    const url = document.createElement('div');
    const displayUrl = step.url ? new URL(step.url).hostname : '';
    url.textContent = displayUrl;
    url.style.fontSize = '12px';
    url.style.color = '#666';
    url.style.cursor = 'pointer';
    url.style.textDecoration = 'underline';
    url.title = step.url;

    // 添加下拉箭头
    const toggleButton = document.createElement('button');
    toggleButton.className = 'toggle-button';
    toggleButton.style.background = 'none';
    toggleButton.style.border = 'none';
    toggleButton.style.padding = '4px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.color = '#666';
    toggleButton.style.transition = 'transform 0.3s';
    toggleButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
        </svg>
    `;

    // 创建备注容器
    const memoContainer = document.createElement('div');
    memoContainer.style.display = 'none';
    memoContainer.style.marginTop = '8px';
    memoContainer.style.paddingTop = '8px';
    memoContainer.style.borderTop = '1px solid #ddd';
    memoContainer.style.color = '#666';
    memoContainer.style.fontSize = '12px';
    memoContainer.textContent = step.memo || '暂无备注';

    // 添加点击事件
    url.addEventListener('click', () => {
        if (step.url) {
            chrome.tabs.create({ url: step.url });
        }
    });

    // 添加下拉箭头点击事件
    toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = memoContainer.style.display === 'block';
        memoContainer.style.display = isExpanded ? 'none' : 'block';
        toggleButton.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    content.appendChild(title);
    content.appendChild(url);
    mainContent.appendChild(number);
    mainContent.appendChild(content);
    mainContent.appendChild(toggleButton);
    element.appendChild(mainContent);
    element.appendChild(memoContainer);

    return element;
}

/**
 * 创建图标按钮
 * @param {string} title - 按钮标题
 * @param {string} svg - SVG图标字符串
 * @returns {HTMLElement}
 */
function createIconButton(title, svg) {
    const button = document.createElement('button');
    button.className = 'icon-button';
    button.title = title;
    button.innerHTML = svg;
    return button;
}

/**
 * 编辑工作流
 * @param {Object} workflow - 工作流对象
 * @param {HTMLElement} element - 工作流DOM元素
 */
export async function editWorkflow(workflow, element) {
    createWorkflowEditor(workflow, async (updatedWorkflow) => {
        // 更新界面
        const parent = element.parentElement;
        const newElement = createWorkflowElement(updatedWorkflow);
        parent.replaceChild(newElement, element);
    });
}

/**
 * 删除工作流
 * @param {string} id - 工作流ID
 */
async function deleteWorkflowHandler(id) {
    if (confirm('确定要删除这个工作流吗？')) {
        try {
            await deleteWorkflow(id);
            const element = document.querySelector(`[data-id="${id}"]`);
            if (element) {
                element.remove();
            }
        } catch (error) {
            alert('删除失败：' + error.message);
        }
    }
} 