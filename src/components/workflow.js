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
    
    // 根据颜色属性添加描边
    if (workflow.color) {
        element.style.borderColor = workflow.color;
        element.style.borderWidth = '1px';
        element.style.borderStyle = 'solid';
    }

    // 工作流头部（标题和操作按钮）
    const header = document.createElement('div');
    header.className = 'workflow-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';
    header.style.width = '100%';  // 添加宽度100%
    header.style.boxSizing = 'border-box';  // 添加盒模型

    // 标题
    const title = document.createElement('div');
    title.textContent = workflow.name;
    title.style.margin = '0';
    title.style.fontSize = '16px';
    title.style.fontWeight = '500';
    title.style.flex = '1';
    title.style.minWidth = '100px';
    title.style.padding = '4px 0';
    title.style.whiteSpace = 'nowrap';
    title.style.overflow = 'hidden';
    title.style.textOverflow = 'ellipsis';
    title.style.cursor = 'pointer';

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

    // 描述
    const description = document.createElement('div');
    description.textContent = workflow.description || '';
    description.style.margin = '0';
    description.style.fontSize = '14px';
    description.style.color = '#666';
    description.style.width = '100%';
    description.style.padding = '4px 0';
    description.style.backgroundColor = 'transparent';
    description.style.cursor = 'pointer';
    description.style.whiteSpace = 'nowrap';  // 不换行
    description.style.overflow = 'hidden';     // 隐藏溢出内容
    description.style.textOverflow = 'ellipsis';  // 显示省略号

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

    // 添加点击事件处理函数
    async function openWorkflowSteps() {
        if (workflow.steps.length === 0) return;
        
        // 获取所有步骤的进度条
        const progressFills = stepsList.querySelectorAll('.progress-fill');
        
        let firstTabId = null; // 存储第一个标签页的ID

        // 按顺序打开每个步骤
        for (let i = 0; i < workflow.steps.length; i++) {
            const step = workflow.steps[i];
            if (step.url) {
                // 打开网页
                const tab = await chrome.tabs.create({ url: step.url });
                
                // 保存第一个标签页的ID
                if (i === 0) {
                    firstTabId = tab.id;
                }
                
                // 点亮进度条
                if (progressFills[i]) {
                    progressFills[i].style.height = '100%';
                    progressFills[i].style.backgroundColor = '#34C759';
                }
                
                // 等待一小段时间再打开下一个
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // 激活第一个标签页
        if (firstTabId) {
            await chrome.tabs.update(firstTabId, { active: true });
        }
        
        // 10秒后重置所有进度条颜色
        setTimeout(() => {
            progressFills.forEach(fill => {
                fill.style.transition = 'all 2s ease';
                fill.style.backgroundColor = '#eee';
            });
        }, 10000);
    }

    // 为标题和描述添加点击事件
    title.addEventListener('click', openWorkflowSteps);
    description.addEventListener('click', openWorkflowSteps);

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
    element.style.position = 'relative';
    element.style.width = '100%';  // 添加宽度100%
    element.style.boxSizing = 'border-box';  // 添加盒模型
    element.style.minWidth = '250px';  // 添加最小宽度

    // 创建进度条
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.position = 'absolute';
    progressBar.style.right = '0';
    progressBar.style.top = '0';
    progressBar.style.bottom = '0';
    progressBar.style.width = '4px';
    progressBar.style.backgroundColor = '#eee';
    progressBar.style.borderRadius = '0 6px 6px 0';
    progressBar.style.overflow = 'hidden';

    // 创建进度条填充
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.width = '100%';
    progressFill.style.height = '0%';
    progressFill.style.backgroundColor = '#34C759';
    progressFill.style.transition = 'all 0.3s ease';  // 修改为all，使背景色也有过渡效果
    progressFill.style.position = 'absolute';
    progressFill.style.bottom = '0';
    progressFill.style.left = '0';

    // 检查是否所有步骤都已完成
    function checkAllStepsCompleted() {
        const allProgressFills = element.parentElement.querySelectorAll('.progress-fill');
        return Array.from(allProgressFills).every(fill => fill.style.height === '100%');
    }

    // 重置所有进度条的颜色
    function resetAllProgressBars() {
        const allProgressFills = element.parentElement.querySelectorAll('.progress-fill');
        allProgressFills.forEach(fill => {
            // 先移除transition，立即重置所有属性
            fill.style.transition = 'none';
            fill.style.backgroundColor = '#eee';
            fill.style.height = '0%';  // 重置高度
            
            // 强制浏览器重绘
            fill.offsetHeight;
            
            // 恢复快速transition
            fill.style.transition = 'all 0.3s ease';
        });
    }

    progressBar.appendChild(progressFill);
    element.appendChild(progressBar);

    // 创建主要内容容器
    const mainContent = document.createElement('div');
    mainContent.style.display = 'flex';
    mainContent.style.alignItems = 'center';
    mainContent.style.width = '100%';
    mainContent.style.cursor = 'pointer';
    mainContent.style.position = 'relative';
    mainContent.style.zIndex = '1';

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
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '4px';
    content.style.minWidth = '0';  // 允许内容收缩
    content.style.overflow = 'hidden';  // 隐藏溢出内容

    // 标题行容器
    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.alignItems = 'center';
    titleRow.style.gap = '8px';
    titleRow.style.minWidth = '0';  // 允许内容收缩
    titleRow.style.overflow = 'hidden';  // 隐藏溢出内容

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
    };

    const title = document.createElement('div');
    title.textContent = step.title;
    title.style.fontWeight = '500';
    title.style.flex = '1';
    title.style.whiteSpace = 'nowrap';  // 不换行
    title.style.overflow = 'hidden';     // 隐藏溢出内容
    title.style.textOverflow = 'ellipsis';  // 显示省略号

    const url = document.createElement('div');
    const displayUrl = step.url ? (() => {
        try {
            const urlObj = new URL(step.url);
            // 去掉www.前缀
            return urlObj.hostname.replace(/^www\./, '');
        } catch (e) {
            return step.url;
        }
    })() : '';
    url.textContent = displayUrl;
    url.style.fontSize = '12px';
    url.style.color = '#666';

    titleRow.appendChild(favicon);
    titleRow.appendChild(title);
    
    content.appendChild(titleRow);
    content.appendChild(url);

    // 添加点击事件到整个内容区域（不包括箭头按钮）
    mainContent.addEventListener('click', (e) => {
        // 如果点击的是toggleButton，不执行跳转
        if (e.target.closest('.toggle-button')) {
            return;
        }
        if (step.url) {
            // 重置transition以确保动画正常
            progressFill.style.transition = 'all 0.3s ease';
            // 设置进度条属性
            progressFill.style.height = '100%';
            progressFill.style.backgroundColor = '#34C759';
            
            // 检查是否所有步骤都已完成
            setTimeout(() => {
                if (checkAllStepsCompleted()) {
                    // 所有步骤完成后10秒开始重置
                    setTimeout(() => {
                        resetAllProgressBars();
                    }, 10000);
                }
            }, 500);
            
            chrome.tabs.create({ url: step.url });
        }
    });

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
    memoContainer.style.overflowY = 'hidden';   // 修改：隐藏父容器的滚动条
    
    // 创建备注输入框
    const memoInput = document.createElement('textarea');
    memoInput.value = step.memo || '暂无备注';
    memoInput.style.width = '100%';
    memoInput.style.border = 'none';
    memoInput.style.outline = 'none';
    memoInput.style.backgroundColor = 'transparent';
    memoInput.style.color = '#666';
    memoInput.style.fontSize = '12px';
    memoInput.style.padding = '0';
    memoInput.style.resize = 'none';
    memoInput.style.minHeight = '20px';
    memoInput.style.maxHeight = '200px';  // 添加：限制文本框最大高度
    memoInput.style.overflowY = 'auto';   // 添加：启用文本框的滚动条
    memoInput.style.fontFamily = 'inherit';
    memoInput.style.textDecoration = 'none';
    
    // 自动调整高度的函数
    function adjustHeight() {
        memoInput.style.height = 'auto';
        const newHeight = Math.min(memoInput.scrollHeight, 200);  // 限制最大高度为200px
        memoInput.style.height = newHeight + 'px';
    }
    
    // 初始调整高度
    setTimeout(adjustHeight, 0);
    
    // 添加输入事件
    memoInput.addEventListener('input', async (e) => {
        adjustHeight();
        step.memo = e.target.value;
        try {
            await updateWorkflow(workflow);
        } catch (error) {
            console.error('更新备注失败：', error);
        }
    });
    
    // 添加焦点样式
    memoInput.addEventListener('focus', () => {
        memoInput.style.backgroundColor = '#f5f5f5';
    });
    
    memoInput.addEventListener('blur', () => {
        memoInput.style.backgroundColor = 'transparent';
    });
    
    memoContainer.appendChild(memoInput);

    // 添加下拉箭头点击事件
    toggleButton.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        const isExpanded = memoContainer.style.display === 'block';
        memoContainer.style.display = isExpanded ? 'none' : 'block';
        toggleButton.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
    });

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