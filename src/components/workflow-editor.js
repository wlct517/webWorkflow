import { updateWorkflow, addWorkflow } from '../utils/db.js';

/**
 * 创建流程图编辑器
 * @param {Object} workflow - 工作流对象
 * @param {Function} onSave - 保存回调函数
 * @param {boolean} isNew - 是否为新建工作流
 * @returns {HTMLElement}
 */
export function createWorkflowEditor(workflow, onSave, isNew = false) {
    // 创建工作流数据的深拷贝
    const workflowCopy = JSON.parse(JSON.stringify(workflow));
    
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
    editor.style.maxWidth = '90%';
    editor.style.minWidth = '280px';
    editor.style.height = '90%';
    editor.style.maxHeight = '90%';
    editor.style.display = 'flex';
    editor.style.flexDirection = 'column';
    editor.style.position = 'relative';
    editor.style.overflowY = 'auto';
    editor.style.boxSizing = 'border-box';

    // 创建标题输入框
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = workflowCopy.name;
    titleInput.placeholder = '输入工作流名称';
    titleInput.style.width = '100%';
    titleInput.style.fontSize = '18px';
    titleInput.style.fontWeight = '500';
    titleInput.style.padding = '8px';
    titleInput.style.border = '1px solid #ddd';
    titleInput.style.borderRadius = '4px';
    titleInput.style.marginBottom = '12px';
    titleInput.style.boxSizing = 'border-box';

    // 创建描述输入框
    const descriptionInput = document.createElement('input');
    descriptionInput.type = 'text';
    descriptionInput.value = workflowCopy.description || '';
    descriptionInput.placeholder = '输入工作流描述';
    descriptionInput.style.width = '100%';
    descriptionInput.style.fontSize = '14px';
    descriptionInput.style.padding = '8px';
    descriptionInput.style.border = '1px solid #ddd';
    descriptionInput.style.borderRadius = '4px';
    descriptionInput.style.marginBottom = '16px';
    descriptionInput.style.boxSizing = 'border-box';
    descriptionInput.style.color = '#666';

    // 添加描述输入事件
    descriptionInput.addEventListener('input', (e) => {
        workflowCopy.description = e.target.value;
    });

    // 创建颜色选择器容器
    const colorContainer = document.createElement('div');
    colorContainer.style.marginBottom = '16px';
    colorContainer.style.display = 'flex';
    colorContainer.style.alignItems = 'center';
    colorContainer.style.gap = '8px';
    colorContainer.style.flexDirection = 'row';
    colorContainer.style.flexWrap = 'nowrap';

    // 颜色选择器标签
    const colorLabel = document.createElement('span');
    colorLabel.textContent = '标签颜色：';
    colorLabel.style.fontSize = '14px';
    colorLabel.style.color = '#666';
    colorLabel.style.whiteSpace = 'nowrap';

    // 颜色选择器按钮组
    const colorButtons = document.createElement('div');
    colorButtons.style.display = 'flex';
    colorButtons.style.gap = '8px';
    colorButtons.style.flexDirection = 'row';
    colorButtons.style.flexWrap = 'nowrap';

    // 定义颜色选项
    const colors = [
        { name: '红色', value: '#FF3B30' },
        { name: '橙色', value: '#FF9500' },
        { name: '黄色', value: '#FFCC00' },
        { name: '绿色', value: '#34C759' },
        { name: '蓝色', value: '#007AFF' },
        { name: '紫色', value: '#AF52DE' },
        { name: '灰色', value: '#8E8E93' }
    ];

    // 创建颜色按钮
    colors.forEach(color => {
        const button = document.createElement('button');
        button.title = color.name;
        button.style.width = '20px';
        button.style.height = '20px';
        button.style.borderRadius = '10px';
        button.style.backgroundColor = color.value;
        button.style.border = '1px solid rgba(0,0,0,0.1)';
        button.style.cursor = 'pointer';
        button.style.padding = '0';
        button.style.transition = 'transform 0.2s';
        button.style.position = 'relative';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';

        // 创建选中状态的对勾
        if (workflowCopy.color === color.value) {
            const checkmark = document.createElement('div');
            checkmark.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                    <path d="M20 6L9 17L4 12"/>
                </svg>
            `;
            button.appendChild(checkmark);
        }

        button.addEventListener('mouseover', () => {
            button.style.transform = 'scale(1.1)';
        });

        button.addEventListener('mouseout', () => {
            button.style.transform = 'scale(1)';
        });

        button.addEventListener('click', () => {
            // 如果当前颜色已经被选中，则取消选择
            if (workflowCopy.color === color.value) {
                button.innerHTML = '';
                workflowCopy.color = '';
                return;
            }
            
            // 移除所有按钮的对勾
            colorButtons.querySelectorAll('button').forEach(btn => {
                btn.innerHTML = '';
            });
            
            // 添加新的对勾到当前按钮
            const checkmark = document.createElement('div');
            checkmark.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                    <path d="M20 6L9 17L4 12"/>
                </svg>
            `;
            button.appendChild(checkmark);
            
            // 更新工作流颜色
            workflowCopy.color = color.value;
        });

        colorButtons.appendChild(button);
    });

    // 组装颜色选择器
    colorContainer.appendChild(colorLabel);
    colorContainer.appendChild(colorButtons);

    // 标题输入事件
    titleInput.addEventListener('input', (e) => {
        workflowCopy.name = e.target.value;
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
    stepsList.workflow = workflowCopy;  // 添加workflow引用

    // 添加现有步骤
    workflowCopy.steps.forEach((step, index) => {
        const stepNode = createStepNode(step, index, workflowCopy, stepsList);
        stepsList.appendChild(stepNode);
        if (index < workflowCopy.steps.length - 1) {
            const arrow = createArrow();
            stepsList.appendChild(arrow);
        }
    });

    // 创建添加步骤按钮
    const addStepBtn = document.createElement('button');
    addStepBtn.className = 'add-step-button';
    addStepBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4a.5.5 0 0 1 .5.5V11h6.5a.5.5 0 0 1 0 1H12.5v6.5a.5.5 0 0 1-1 0V12H5a.5.5 0 0 1 0-1h6.5V4.5A.5.5 0 0 1 12 4Z"/>
        </svg>
    `;
    addStepBtn.style.padding = '8px';
    addStepBtn.style.backgroundColor = '#007AFF';
    addStepBtn.style.color = 'white';
    addStepBtn.style.border = 'none';
    addStepBtn.style.borderRadius = '50%';
    addStepBtn.style.cursor = 'pointer';
    addStepBtn.style.display = 'flex';
    addStepBtn.style.alignItems = 'center';
    addStepBtn.style.justifyContent = 'center';
    addStepBtn.style.margin = '20px auto';
    addStepBtn.style.width = '40px';
    addStepBtn.style.height = '40px';

    // 添加步骤事件
    addStepBtn.addEventListener('click', () => {
        const newStep = {
            id: crypto.randomUUID(),
            title: '新步骤',
            url: '',
            description: ''
        };
        
        if (workflowCopy.steps.length > 0) {
            const arrow = createArrow();
            stepsList.appendChild(arrow);
        }
        
        const stepNode = createStepNode(newStep, workflowCopy.steps.length, workflowCopy, stepsList);
        stepsList.appendChild(stepNode);
        workflowCopy.steps.push(newStep);
    });

    // 创建底部按钮组
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'center';
    actions.style.gap = '12px';
    actions.style.marginTop = '20px';
    actions.style.width = '100%';
    actions.style.padding = '0 16px';

    // 取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.className = 'secondary-button';
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.style.border = '1px solid #ddd';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.backgroundColor = 'white';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.flex = '1';
    cancelBtn.style.fontWeight = '500';
    cancelBtn.style.display = 'flex';
    cancelBtn.style.alignItems = 'center';
    cancelBtn.style.justifyContent = 'center';

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
    saveBtn.style.flex = '1';
    saveBtn.style.fontWeight = '500';
    saveBtn.style.display = 'flex';
    saveBtn.style.alignItems = 'center';
    saveBtn.style.justifyContent = 'center';

    // 添加按钮事件
    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });

    saveBtn.addEventListener('click', async () => {
        try {
            // 根据是否为新建工作流选择不同的保存方法
            if (isNew) {
                await addWorkflow(workflowCopy);
            } else {
                await updateWorkflow(workflowCopy);
            }
            onSave(workflowCopy);
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
    editor.appendChild(descriptionInput);
    editor.appendChild(colorContainer);
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
 * @param {Object} workflow - 工作流对象
 * @param {HTMLElement} stepsList - 步骤列表容器
 * @returns {HTMLElement}
 */
function createStepNode(step, index, workflow, stepsList) {
    const node = document.createElement('div');
    node.className = 'workflow-step-node';
    node.style.backgroundColor = 'white';
    node.style.borderRadius = '8px';
    node.style.padding = '12px';
    node.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    node.style.width = '100%';
    node.style.minWidth = '250px';
    node.style.boxSizing = 'border-box';
    node.style.display = 'flex';
    node.style.flexDirection = 'column';
    node.style.gap = '8px';
    node.style.position = 'relative';

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

    // 步骤标题输入框
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.gap = '8px';
    titleContainer.style.width = '100%';
    titleContainer.style.marginBottom = '8px';

    // 网站图标
    const favicon = document.createElement('img');
    favicon.style.width = '24px';
    favicon.style.height = '24px';
    favicon.style.flexShrink = '0';
    favicon.style.objectFit = 'contain';
    favicon.style.display = 'block';
    favicon.style.border = '1px solid #E5E5EA';
    favicon.style.borderRadius = '4px';
    favicon.style.padding = '2px';
    favicon.style.backgroundColor = '#fff';

    // 设置默认图标
    const defaultIcon = 'data:image/svg+xml,' + encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="4" fill="#E5E5EA"/>
            <path d="M6 12h12M12 6v12" stroke="#8E8E93" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `);
    
    // 如果已经有保存的图标，直接使用
    if (step.favicon) {
        favicon.src = step.favicon;
    } else {
        favicon.src = defaultIcon;
    }

    // 添加图片加载错误处理
    favicon.onerror = () => {
        favicon.src = defaultIcon;
        step.favicon = defaultIcon;
    };

    // 如果已经有URL但没有图标，尝试获取图标
    if (step.url && step.url.startsWith('http') && !step.favicon) {
        chrome.runtime.sendMessage(
            { type: 'GET_WEBSITE_INFO', url: step.url },
            (response) => {
                if (response && response.favicon) {
                    favicon.src = response.favicon;
                    step.favicon = response.favicon;
                }
            }
        );
    }
    
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = step.title;
    titleInput.placeholder = '步骤标题';
    titleInput.style.flex = '1';
    titleInput.style.padding = '4px 8px';
    titleInput.style.border = '1px solid #ddd';
    titleInput.style.borderRadius = '4px';
    titleInput.style.fontSize = '14px';
    titleInput.style.boxSizing = 'border-box';

    titleContainer.appendChild(favicon);
    titleContainer.appendChild(titleInput);

    // 备注输入框
    const memoInput = document.createElement('textarea');
    memoInput.value = step.memo || '';
    memoInput.placeholder = '备注';
    memoInput.style.width = '100%';
    memoInput.style.padding = '4px 8px';
    memoInput.style.border = '1px solid #ddd';
    memoInput.style.borderRadius = '4px';
    memoInput.style.fontSize = '14px';
    memoInput.style.boxSizing = 'border-box';
    memoInput.style.color = '#666';
    memoInput.style.resize = 'vertical';
    memoInput.style.minHeight = '32px';
    memoInput.style.maxHeight = '200px';
    memoInput.style.overflow = 'hidden';
    memoInput.style.fontFamily = 'inherit';
    
    // 自动调整高度的函数
    function adjustHeight() {
        memoInput.style.height = 'auto';
        memoInput.style.height = memoInput.scrollHeight + 'px';
    }
    
    // 初始调整高度
    setTimeout(adjustHeight, 0);
    
    memoInput.addEventListener('input', (e) => {
        adjustHeight();
        step.memo = e.target.value;
    });

    // 创建底部工具栏
    const bottomToolbar = document.createElement('div');
    bottomToolbar.style.display = 'flex';
    bottomToolbar.style.justifyContent = 'space-between';
    bottomToolbar.style.alignItems = 'center';
    bottomToolbar.style.gap = '8px';
    bottomToolbar.style.marginTop = '8px';

    // 创建左侧序号容器
    const orderContainer = document.createElement('div');
    orderContainer.style.display = 'flex';
    orderContainer.style.alignItems = 'center';
    orderContainer.style.gap = '4px';

    // 创建右侧按钮容器
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.alignItems = 'center';
    buttonsContainer.style.gap = '8px';

    // 序号输入框
    const orderInput = document.createElement('input');
    orderInput.type = 'number';
    orderInput.value = index + 1;
    orderInput.min = 1;
    orderInput.style.width = '50px';
    orderInput.style.padding = '4px';
    orderInput.style.border = '1px solid #ddd';
    orderInput.style.borderRadius = '4px';
    orderInput.style.fontSize = '12px';
    orderInput.style.textAlign = 'left';

    // 序号标签
    const orderLabel = document.createElement('span');
    orderLabel.textContent = '序号';
    orderLabel.style.fontSize = '12px';
    orderLabel.style.color = '#666';

    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '×';
    deleteBtn.style.backgroundColor = 'transparent';
    deleteBtn.style.border = 'none';
    deleteBtn.style.color = '#666';
    deleteBtn.style.fontSize = '16px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.padding = '4px 8px';
    deleteBtn.style.display = 'flex';
    deleteBtn.style.alignItems = 'center';
    deleteBtn.style.justifyContent = 'center';
    deleteBtn.style.borderRadius = '4px';
    deleteBtn.title = '删除此步骤';

    // 添加删除按钮悬停效果
    deleteBtn.addEventListener('mouseover', () => {
        deleteBtn.style.backgroundColor = '#f5f5f5';
        deleteBtn.style.color = '#ff3b30';
    });

    deleteBtn.addEventListener('mouseout', () => {
        deleteBtn.style.backgroundColor = 'transparent';
        deleteBtn.style.color = '#666';
    });

    // 添加序号输入事件
    orderInput.addEventListener('change', () => {
        const newIndex = parseInt(orderInput.value) - 1;
        const currentIndex = Array.from(stepsList.children).indexOf(node) / 2; // 因为有箭头，所以除以2
        
        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < workflow.steps.length) {
            // 更新workflow.steps数组
            const step = workflow.steps.splice(currentIndex, 1)[0];
            workflow.steps.splice(newIndex, 0, step);
            
            // 重新渲染所有步骤
            while (stepsList.firstChild) {
                stepsList.firstChild.remove();
            }
            
            workflow.steps.forEach((step, idx) => {
                const stepNode = createStepNode(step, idx, workflow, stepsList);
                stepsList.appendChild(stepNode);
                if (idx < workflow.steps.length - 1) {
                    const arrow = createArrow();
                    stepsList.appendChild(arrow);
                }
            });
        }
    });

    // 添加删除事件
    deleteBtn.addEventListener('click', () => {
        if (confirm('确定要删除这个步骤吗？')) {
            const currentIndex = Array.from(stepsList.children).indexOf(node) / 2;
            workflow.steps.splice(currentIndex, 1);
            
            // 如果不是最后一个节点，也要删除后面的箭头
            const nextArrow = node.nextElementSibling;
            if (nextArrow && nextArrow.className === 'workflow-arrow') {
                nextArrow.remove();
            }
            // 如果是最后一个节点，要删除前面的箭头
            else if (node.previousElementSibling && node.previousElementSibling.className === 'workflow-arrow') {
                node.previousElementSibling.remove();
            }
            
            node.remove();
            
            // 更新剩余节点的序号
            const remainingNodes = stepsList.querySelectorAll('.workflow-step-node');
            remainingNodes.forEach((node, idx) => {
                const orderInput = node.querySelector('input[type="number"]');
                if (orderInput) {
                    orderInput.value = idx + 1;
                }
            });
        }
    });

    // 重新组织底部工具栏的结构
    orderContainer.appendChild(orderLabel);
    orderContainer.appendChild(orderInput);
    buttonsContainer.appendChild(deleteBtn);  // 添加删除按钮到右侧容器
    bottomToolbar.appendChild(orderContainer);
    bottomToolbar.appendChild(buttonsContainer);

    // 组装节点
    node.appendChild(urlInput);
    node.appendChild(titleContainer);
    node.appendChild(memoInput);
    node.appendChild(bottomToolbar);

    return node;
}

/**
 * 创建箭头连接线
 * @returns {HTMLElement}
 */
function createArrow() {
    const arrow = document.createElement('div');
    arrow.className = 'workflow-arrow';
    arrow.style.display = 'flex';
    arrow.style.flexDirection = 'column';
    arrow.style.justifyContent = 'center';
    arrow.style.alignItems = 'center';
    arrow.style.margin = '4px 0';
    arrow.style.minHeight = '40px';
    arrow.style.position = 'relative';
    
    // 创建上半部分的竖线
    const topLine = document.createElement('div');
    topLine.style.width = '1px';
    topLine.style.flex = '1';
    topLine.style.backgroundColor = '#999';
    
    // 创建加号按钮
    const addButton = document.createElement('div');
    addButton.style.width = '20px';
    addButton.style.height = '20px';
    addButton.style.display = 'flex';
    addButton.style.alignItems = 'center';
    addButton.style.justifyContent = 'center';
    addButton.style.cursor = 'pointer';
    addButton.style.margin = '2px 0';
    addButton.style.color = '#999';
    addButton.style.fontSize = '20px';
    addButton.innerHTML = '+';
    
    // 创建下半部分的竖线容器
    const bottomContainer = document.createElement('div');
    bottomContainer.style.display = 'flex';
    bottomContainer.style.flexDirection = 'column';
    bottomContainer.style.flex = '1';
    bottomContainer.style.alignItems = 'center';
    
    // 创建下半部分的竖线
    const bottomLine = document.createElement('div');
    bottomLine.style.width = '1px';
    bottomLine.style.flex = '1';
    bottomLine.style.backgroundColor = '#999';
    
    // 创建箭头
    const arrowIcon = document.createElement('div');
    arrowIcon.innerHTML = `
        <svg width="16" height="8" viewBox="0 0 16 8" fill="none">
            <path d="M8 8L0 0L16 0L8 8Z" fill="#999"/>
        </svg>
    `;
    
    // 组装底部容器
    bottomContainer.appendChild(bottomLine);
    bottomContainer.appendChild(arrowIcon);
    
    // 组装箭头组件
    arrow.appendChild(topLine);
    arrow.appendChild(addButton);
    arrow.appendChild(bottomContainer);
    
    // 修改hover效果
    addButton.addEventListener('mouseover', () => {
        addButton.style.color = '#666';
        topLine.style.backgroundColor = '#666';
        bottomLine.style.backgroundColor = '#666';
        arrow.querySelector('path').setAttribute('fill', '#666');
    });
    
    addButton.addEventListener('mouseout', () => {
        addButton.style.color = '#999';
        topLine.style.backgroundColor = '#999';
        bottomLine.style.backgroundColor = '#999';
        arrow.querySelector('path').setAttribute('fill', '#999');
    });
    
    // 添加点击事件
    addButton.addEventListener('click', () => {
        const newStep = {
            id: crypto.randomUUID(),
            title: '新步骤',
            url: '',
            description: ''
        };
        
        // 获取当前箭头的位置
        const arrowIndex = Array.from(arrow.parentElement.children).indexOf(arrow);
        const stepIndex = Math.floor(arrowIndex / 2);
        
        // 在当前位置插入新步骤
        const stepsList = arrow.parentElement;
        const workflow = stepsList.workflow;
        workflow.steps.splice(stepIndex + 1, 0, newStep);
        
        // 创建新的步骤节点
        const stepNode = createStepNode(newStep, stepIndex + 2, workflow, stepsList);
        
        // 创建新的箭头
        const newArrow = createArrow();
        
        // 插入新节点和箭头
        arrow.parentElement.insertBefore(stepNode, arrow.nextSibling);
        arrow.parentElement.insertBefore(newArrow, stepNode.nextSibling);
        
        // 更新所有序号
        const allSteps = stepsList.querySelectorAll('.workflow-step-node');
        allSteps.forEach((node, idx) => {
            const orderInput = node.querySelector('input[type="number"]');
            if (orderInput) {
                orderInput.value = idx + 1;
            }
        });
    });

    return arrow;
} 