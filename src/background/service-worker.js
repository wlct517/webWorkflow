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
        getFaviconAndTitle(message.url)
            .then(response => {
                console.log('获取到网站信息:', response); // 添加调试日志
                sendResponse(response);
            })
            .catch(error => {
                console.error('获取网站信息失败:', error); // 添加错误日志
                sendResponse({
                    title: new URL(message.url).hostname,
                    favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(message.url).hostname)}&sz=64`
                });
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
            // 1. 先尝试获取页面中声明的图标
            `${urlObj.origin}/favicon.ico`,
            `${urlObj.origin}/favicon.png`,
            // 2. 尝试apple-touch-icon
            `${urlObj.origin}/apple-touch-icon.png`,
            `${urlObj.origin}/apple-touch-icon-precomposed.png`,
            // 3. 最后使用Google的favicon服务
            `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
        ];

        // 创建一个临时标签页来获取标题和页面中声明的图标
        const tab = await chrome.tabs.create({ 
            url: url, 
            active: false,
            pinned: true // 固定标签页以减少视觉干扰
        });

        // 等待页面加载完成
        await new Promise((resolve) => {
            function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            }
            chrome.tabs.onUpdated.addListener(listener);
        });

        // 获取标题和页面中声明的图标
        const [{ result: pageInfo }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // 获取页面中声明的所有图标
                const icons = Array.from(document.querySelectorAll('link[rel*="icon"]'))
                    .map(link => link.href)
                    .filter(href => href); // 过滤掉空值

                return {
                    title: document.title,
                    icons: icons
                };
            }
        });

        // 关闭临时标签页
        await chrome.tabs.remove(tab.id);

        // 将页面中声明的图标添加到尝试列表的最前面
        if (pageInfo.icons && pageInfo.icons.length > 0) {
            possibleFaviconUrls.unshift(...pageInfo.icons);
        }

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
            favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
        }

        return { 
            title: pageInfo.title || domain, // 如果没有标题就使用域名
            favicon 
        };
    } catch (error) {
        console.error('获取网站信息失败:', error);
        // 返回域名作为标题和默认图标
        return { 
            title: new URL(url).hostname,
            favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=64`
        };
    }
} 