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
    if (message.type === 'GET_FAVICON') {
        // 获取网站图标
        chrome.tabs.get(sender.tab.id, (tab) => {
            sendResponse({ favicon: tab.favIconUrl });
        });
        return true; // 保持消息通道打开
    }
}); 