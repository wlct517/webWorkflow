import { updateWorkflow, addWorkflow } from '../utils/db.js';

/**
 * 创建流程图编辑器
 * @param {Object} workflow - 工作流对象
 * @param {Function} onSave - 保存回调函数
 * @param {boolean} isNew - 是否为新建工作流
 * @returns {HTMLElement}
 */
export function createWorkflowEditor(workflow, onSave, isNew = false) {
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
    titleInput.style.marginBottom = '12px';
    titleInput.style.boxSizing = 'border-box';

    // 创建描述输入框
    const descriptionInput = document.createElement('input');
    descriptionInput.type = 'text';
    descriptionInput.value = workflow.description || '';
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
        workflow.description = e.target.value;
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
        if (workflow.color === color.value) {
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
            if (workflow.color === color.value) {
                button.innerHTML = '';
                workflow.color = '';
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
            workflow.color = color.value;
        });

        colorButtons.appendChild(button);
    });

    // 组装颜色选择器
    colorContainer.appendChild(colorLabel);
    colorContainer.appendChild(colorButtons);

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
    actions.style.justifyContent = 'center';
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
    cancelBtn.style.width = '120px';
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
    saveBtn.style.width = '120px';
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
                await addWorkflow(workflow);
            } else {
                await updateWorkflow(workflow);
            }
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
    const memoInput = document.createElement('input');
    memoInput.type = 'text';
    memoInput.value = step.memo || '';
    memoInput.placeholder = '备注';
    memoInput.style.width = '100%';
    memoInput.style.padding = '4px 8px';
    memoInput.style.border = '1px solid #ddd';
    memoInput.style.borderRadius = '4px';
    memoInput.style.fontSize = '14px';
    memoInput.style.boxSizing = 'border-box';
    memoInput.style.color = '#666';

    // 添加输入事件
    let urlInputTimeout;
    urlInput.addEventListener('input', (e) => {
        step.url = e.target.value;
        
        // 清除之前的定时器
        clearTimeout(urlInputTimeout);
        
        // 设置新的定时器，延迟500ms后获取网站信息
        urlInputTimeout = setTimeout(async () => {
            const url = e.target.value;
            if (url && url.startsWith('http')) {
                try {
                    // 发送消息给background获取网站信息
                    chrome.runtime.sendMessage(
                        { type: 'GET_WEBSITE_INFO', url: url },
                        (response) => {
                            if (response) {
                                if (response.title) {
                                    titleInput.value = response.title;
                                    step.title = response.title;
                                }
                                if (response.favicon) {
                                    favicon.src = response.favicon;
                                    step.favicon = response.favicon;
                                }
                            }
                        }
                    );
                } catch (error) {
                    console.error('获取网站信息失败:', error);
                }
            } else {
                // 如果URL为空或无效，显示默认图标
                favicon.src = defaultIcon;
                step.favicon = defaultIcon;
            }
        }, 500);
    });

    titleInput.addEventListener('input', (e) => {
        step.title = e.target.value;
    });

    memoInput.addEventListener('input', (e) => {
        step.memo = e.target.value;
    });

    node.appendChild(urlInput);
    node.appendChild(titleContainer);
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
    arrow.style.display = 'flex';
    arrow.style.justifyContent = 'center';
    arrow.style.alignItems = 'center';
    arrow.style.margin = '4px 0';
    arrow.style.height = '32px';
    
    // 创建SVG箭头
    arrow.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
            <path d="M12 4L12 16M12 16L7 11M12 16L17 11" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;

    return arrow;
} 