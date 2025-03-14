/**
 * 创建设置面板
 * @returns {HTMLElement}
 */
export function createSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'settings-modal';
    modal.style.display = 'none';

    const content = document.createElement('div');
    content.className = 'settings-content';

    // 创建头部
    const header = document.createElement('div');
    header.className = 'settings-header';

    const title = document.createElement('h2');
    title.textContent = 'AI搜索设置';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'settings-close';
    closeBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
        </svg>
    `;

    header.appendChild(title);
    header.appendChild(closeBtn);

    // 创建表单
    const form = document.createElement('form');
    form.className = 'settings-form';

    const apiKeyGroup = document.createElement('div');
    apiKeyGroup.className = 'form-group';

    const apiKeyLabel = document.createElement('label');
    apiKeyLabel.textContent = 'API Key';

    const apiKeyLabelContainer = document.createElement('div');
    apiKeyLabelContainer.style.display = 'flex';
    apiKeyLabelContainer.style.justifyContent = 'space-between';
    apiKeyLabelContainer.style.alignItems = 'center';
    apiKeyLabelContainer.style.marginBottom = '8px';

    const getApiKeyLink = document.createElement('a');
    getApiKeyLink.href = 'https://account.aliyun.com/login/login.htm?oauth_callback=https%3A%2F%2Fbailian.console.aliyun.com%2F%3FapiKey%3D1&clearRedirectCookie=1&lang=zh';
    getApiKeyLink.target = '_blank';
    getApiKeyLink.style.color = '#007AFF';
    getApiKeyLink.style.textDecoration = 'none';
    getApiKeyLink.style.fontSize = '12px';
    getApiKeyLink.style.whiteSpace = 'nowrap';
    getApiKeyLink.textContent = '获取千问 API Key';

    apiKeyLabelContainer.appendChild(apiKeyLabel);
    apiKeyLabelContainer.appendChild(getApiKeyLink);

    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'password';
    apiKeyInput.id = 'apiKeyInput';
    apiKeyInput.placeholder = '请输入阿里云API Key';
    apiKeyInput.style.width = '100%';

    apiKeyGroup.appendChild(apiKeyLabelContainer);
    apiKeyGroup.appendChild(apiKeyInput);

    // 从storage中获取已保存的API Key和启用状态
    chrome.storage.local.get(['apiKey', 'aiEnabled'], (result) => {
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }
        // 根据存储的状态更新按钮
        updateToggleButton(result.aiEnabled);
    });

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'primary-button';
    toggleBtn.type = 'submit';
    toggleBtn.style.transition = 'all 0.3s ease';

    // 更新按钮状态的函数
    function updateToggleButton(enabled) {
        toggleBtn.textContent = enabled ? '关闭' : '启用';
        toggleBtn.style.backgroundColor = enabled ? '#8E8E93' : '#007AFF';
    }

    form.appendChild(apiKeyGroup);
    form.appendChild(toggleBtn);

    // 添加表单提交事件
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const apiKey = apiKeyInput.value.trim();
        
        try {
            // 获取当前的启用状态并切换
            const { aiEnabled = false } = await chrome.storage.local.get(['aiEnabled']);
            const newEnabled = !aiEnabled;
            
            // 保存API Key和新的启用状态
            await chrome.storage.local.set({ 
                apiKey,
                aiEnabled: newEnabled 
            });
            
            // 更新按钮状态
            updateToggleButton(newEnabled);
            
            // 自动关闭弹窗
            modal.style.display = 'none';
            
        } catch (error) {
            alert('设置失败：' + error.message);
        }
    });

    // 添加关闭按钮事件
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    content.appendChild(header);
    content.appendChild(form);
    modal.appendChild(content);

    return modal;
}

/**
 * 显示设置面板
 */
export function showSettings() {
    const existingModal = document.querySelector('.settings-modal');
    if (existingModal) {
        existingModal.style.display = 'flex';
        return;
    }

    const modal = createSettingsModal();
    document.body.appendChild(modal);
    modal.style.display = 'flex';
} 