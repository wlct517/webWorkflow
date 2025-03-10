/**
 * 使用阿里云API进行AI搜索
 * @param {string} query - 搜索关键词
 * @param {Array} workflows - 工作流列表
 * @returns {Promise<Array>} - 返回搜索结果
 */
export async function searchWithAI(query, workflows) {
    try {
        // 获取API Key
        const result = await chrome.storage.local.get(['apiKey']);
        if (!result.apiKey) {
            throw new Error('请先在设置中配置API Key');
        }

        // 构建搜索上下文
        const context = workflows.map(workflow => ({
            id: workflow.id,
            name: workflow.name,
            description: workflow.description || '',
            steps: workflow.steps.map(step => ({
                title: step.title,
                description: step.description || ''
            }))
        }));

        // 调用阿里云API
        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${result.apiKey}`
            },
            body: JSON.stringify({
                model: 'qwen-max-latest',
                messages: [
                    {
                        role: 'system',
                        content: `你是一个搜索助手，需要根据用户的搜索词在工作流列表中找到最相关的内容。
                        工作流数据：${JSON.stringify(context)}
                        请分析用户的搜索意图，返回最相关的工作流ID列表，按相关度从高到低排序。
                        只返回ID数组，不要返回其他内容。例如：["id1", "id2", "id3"]`
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error('API请求失败');
        }

        const data = await response.json();
        const relevantIds = JSON.parse(data.choices[0].message.content);

        // 根据相关度排序返回工作流
        return relevantIds
            .map(id => workflows.find(w => w.id === id))
            .filter(Boolean);

    } catch (error) {
        console.error('AI搜索失败：', error);
        // 如果AI搜索失败，回退到普通搜索
        return workflows.filter(w => 
            w.name.toLowerCase().includes(query.toLowerCase()) ||
            w.description?.toLowerCase().includes(query.toLowerCase())
        );
    }
} 