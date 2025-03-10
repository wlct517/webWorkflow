// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
    console.log('工作流助手已安装');
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
    // 打开侧边栏
    chrome.sidePanel.open({ windowId: tab.windowId });
});

// 监听侧边栏打开事件
if (chrome.sidePanel && chrome.sidePanel.onShown) {
    chrome.sidePanel.onShown.addListener((panel) => {
        console.log('侧边栏已打开');
    });
}

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_WEBSITE_INFO') {
        // 获取网站信息
        getFaviconAndTitle(message.url).then(response => {
            sendResponse(response);
        });
        return true; // 保持消息通道打开
    }
});

// 获取网站图标和标题
async function getFaviconAndTitle(url) {
    try {
        // 解析URL
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        // 尝试不同的图标获取方式
        const possibleFaviconUrls = [
            `${urlObj.origin}/favicon.ico`,
            `${urlObj.origin}/favicon.png`,
            `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
        ];

        // 创建一个临时标签页来获取标题
        const tab = await chrome.tabs.create({ url: url, active: false });

        // 等待页面加载完成
        await new Promise(resolve => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            });
        });

        // 获取标题
        const [{ result: title }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => document.title
        });

        // 关闭临时标签页
        await chrome.tabs.remove(tab.id);

        // 尝试获取图标
        let favicon = null;
        for (const faviconUrl of possibleFaviconUrls) {
            try {
                const response = await fetch(faviconUrl);
                if (response.ok) {
                    favicon = faviconUrl;
                    break;
                }
            } catch (error) {
                console.log('尝试下一个图标URL');
            }
        }

        // 如果所有方法都失败，使用Google的favicon服务
        if (!favicon) {
            favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        }

        return { title, favicon };
    } catch (error) {
        console.error('获取网站信息失败:', error);
        return { title: '', favicon: '' };
    }
} 