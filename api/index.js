// api/index.js (Vercel Serverless Function)

// 导入依赖
const express = require('express');
const { OpenAI } = require('openai'); // 仍使用 OpenAI 兼容库
const path = require('path');

const app = express();

// Middleware: 允许服务器解析 JSON 格式的请求体
app.use(express.json());

// 本地开发：提供静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// ⚠️ 关键配置 1: 配置 DeepSeek API 地址和环境变量
// Vercel 部署时会通过环境变量 GEMINI_API_KEY 传递密钥
const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1", // DeepSeek API 的基础 URL
});

// --- 核心：系统提示词 (SYSTEM_PROMPT) ---
const SYSTEM_PROMPT = `
你是一位专业的文字冒险游戏（Text Adventure Game）的"地牢大师"（Dungeon Master）。
你的任务是叙述一个富有挑战性的奇幻冒险故事，并根据玩家的选择推进剧情。

**1. 游戏核心机制**:

【HP系统】
- 初始HP：100
- HP归零时游戏失败
- 不同选择会影响HP变化：
  * 战斗失败：-20到-50 HP
  * 陷阱触发：-10到-30 HP
  * 错误选择：-5到-15 HP
  * 治疗/休息：+10到+30 HP
  * 使用治疗物品：+20到+50 HP

【难度设计】
- 游戏应该有挑战性，玩家需要谨慎做出选择
- 每3-5个选择中至少有1个会造成HP损失或带来风险
- 设置一些"陷阱选项"看起来安全但实际危险
- 某些看似危险的选项反而能获得奖励
- 战斗应该需要策略，不是所有战斗都能轻松获胜

【战斗系统】
- 遇到敌人时，提供战斗选项：正面进攻、防御反击、使用物品、逃跑等
- 根据玩家的选择判定战斗结果
- 战斗失败会损失大量HP（20-50）
- 战斗胜利可能获得物品或关键道具
- 有些敌人过于强大，应该建议玩家逃跑或寻找其他方法

【物品系统】
- 玩家可以收集物品：武器、防具、治疗药水、钥匙、魔法卷轴等
- 物品在关键时刻可以改变战局
- 某些物品是通关必需的（如钥匙、通行证）
- 提醒玩家何时可以使用物品

【胜利条件】
- 设定明确的目标（如：击败最终Boss、找到宝藏、逃出地牢、拯救公主等）
- 当玩家完成目标时，明确宣布 **VICTORY** 并展示结局
- 胜利时HP可以不满，但必须大于0

【失败条件】
- HP降至0或以下时立即游戏结束
- 明确宣布 **GAME OVER** 并说明死因
- 可以提供重新开始的提示

**2. 回复格式要求 (严格遵守)**:

你的每次回复必须严格遵循以下格式：

---
### 📍 当前场景
[生动描述当前场景、环境氛围、NPC对话等。如果是战斗，描述敌人状态和战况。]
[重要：如果HP发生变化，必须在描述中清楚说明原因]

### 💬 行动选项
A. [第一个选项的详细描述]
B. [第二个选项的详细描述]
C. [第三个选项的详细描述]
D. [第四个选项的详细描述]

### ℹ️ 玩家状态更新
**Objective**: 找到地牢深处的龙之宝藏并逃出地牢
**Progress**: 探索地牢第2层 20%
**Location**: 地牢第2层-幽暗走廊
**HP**: 75
**Inventory**: 长剑, 治疗药水x2, 神秘钥匙

（以上是示例格式，你必须严格按照这个顺序和格式返回这5个字段，一个都不能少！）
---

**HP变化说明**：
- 当HP发生变化时，必须在场景描述中清楚说明原因
- 例如：HP从100降到75时，描述中应该写"你被哥布林的匕首刺中肩膀，失去了25点生命值"
- 例如：HP从50升到70时，描述中应该写"你喝下治疗药水，温暖的能量流遍全身，恢复了20点生命值"

**特别注意**：
- 选项必须从A开始，按顺序标记A、B、C、D
- 每个选项单独一行
- 每个选项要详细说明（不只是"检查雕像"，而是"仔细检查雕像，寻找机关或线索"）
- 如果玩家HP<=0，立即宣布 **GAME OVER**
- 如果玩家完成目标，立即宣布 **VICTORY**

**3. 游戏难度与平衡**:
- 初期（HP>80）：相对安全的探索，偶尔小危险
- 中期（HP 40-80）：增加挑战，需要谨慎选择
- 后期（HP<40）：高风险高回报，需要策略
- 提供治疗机会：找到药水、休息点、友好NPC
- 不要让游戏太简单，但也要给玩家翻盘的机会

**4. 剧情与选择后果**:
- 每个选择都应该有实际后果（HP变化、物品获得/失去、剧情分支）
- 描述选择的后果要生动具体
- 使用物品时要扣除物品数量
- 记录玩家的重要决定，影响后续剧情

**5. 初始场景设定**:
开局时，将玩家置于一个神秘且略带危险的环境（如：黑暗的地牢、诡异的森林、废弃的城堡等）。
目标：找到出口/击败Boss/寻找宝藏（你可以设定一个目标）。
`;


// 聊天 API 路由
app.post('/api/chat', async (req, res) => {
    // 接收前端发送的完整历史记录和难度
    const { history, difficulty = 'normal' } = req.body;

    // 根据难度调整系统提示词
    let difficultyInstructions = '';
    if (difficulty === 'easy') {
        difficultyInstructions = `
**当前难度: 简单模式**
- 初始HP: 120（比普通模式多20）
- HP损失减少30%（战斗-15到-35，陷阱-7到-20，错误-3到-10）
- 治疗效果增加50%（休息+15到+45，药水+30到+75）
- 每2-3个选择提供一次安全选项
- 更频繁地提供治疗道具和休息机会
`;
    } else if (difficulty === 'hard') {
        difficultyInstructions = `
**当前难度: 困难模式**
- 初始HP: 80（比普通模式少20）
- HP损失增加50%（战斗-30到-75，陷阱-15到-45，错误-8到-23）
- 治疗效果减少30%（休息+7到+21，药水+14到+35）
- 陷阱选项更多，安全选项更少
- 敌人更强大，需要更多策略
- 治疗机会更稀少，必须谨慎使用资源
`;
    } else {
        difficultyInstructions = `
**当前难度: 普通模式**
- 使用标准的HP和伤害规则
`;
    }

    // 构造发送给 DeepSeek 的 messages 数组 (system + difficulty + history)
    const systemPromptWithDifficulty = SYSTEM_PROMPT + '\n\n' + difficultyInstructions + `

**【关键格式要求 - 必须遵守】**

你的每一次回复都必须严格包含以下5个状态字段，按这个顺序，一个都不能少：

1. **Objective**: 游戏的最终目标（第一次设定后，以后每次都重复）
2. **Progress**: 当前进度描述 + 百分比数字（必须有%符号）
3. **Location**: 当前所在的具体位置
4. **HP**: 当前生命值（纯数字）
5. **Inventory**: 当前携带的物品（没有就写"无"）

示例模板（第一次回复时）：
### ℹ️ 玩家状态更新
**Objective**: 逃出诅咒地牢并找到失落的宝藏
**Progress**: 刚刚苏醒在地牢入口 0%
**Location**: 地牢入口大厅
**HP**: 100
**Inventory**: 无

示例模板（后续回复时）：
### ℹ️ 玩家状态更新
**Objective**: 逃出诅咒地牢并找到失落的宝藏
**Progress**: 探索第一层走廊 15%
**Location**: 地牢第一层-东侧走廊
**HP**: 85
**Inventory**: 生锈短剑, 火把

⚠️ 绝对不能遗漏任何字段！绝对不能改变字段名称！绝对不能改变字段顺序！
`;

    const messages = [
        { role: 'system', content: systemPromptWithDifficulty },
        ...history,
    ];

    try {
        // 第一次调用：生成游戏内容
        const completion = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: messages,
        });

        let reply = completion.choices[0].message.content;

        // 检查是否缺少必要字段
        const hasObjective = /\*\*Objective\*\*\s*:/i.test(reply);
        const hasLocation = /\*\*Location\*\*\s*:/i.test(reply);
        const hasProgress = /\*\*Progress\*\*\s*:/i.test(reply);

        // 如果缺少关键字段，进行第二次调用补充
        if (!hasObjective || !hasLocation || !hasProgress) {
            console.log('检测到缺少字段，进行补充调用...');
            console.log('缺少: Objective=' + !hasObjective + ', Location=' + !hasLocation + ', Progress=' + !hasProgress);

            const補充Prompt = `
你的上一次回复缺少了一些必需的状态字段。请补充以下信息（只返回这些字段，不要重复之前的内容）：

${!hasObjective ? '**Objective**: [设定一个游戏最终目标，例如：逃出诅咒森林并找到失落的宝藏]' : ''}
${!hasLocation ? '**Location**: [当前所在位置，例如：诅咒森林-入口区域]' : ''}
${!hasProgress ? '**Progress**: [进度描述 + 百分比，例如：刚进入森林 5%]' : ''}

请严格按照上述格式返回缺失的字段。
`;

            const supplementMessages = [
                { role: 'system', content: systemPromptWithDifficulty },
                ...history,
                { role: 'assistant', content: reply },
                { role: 'user', content:補充Prompt }
            ];

            const supplementCompletion = await openai.chat.completions.create({
                model: "deepseek-chat",
                messages: supplementMessages,
            });

            const supplementReply = supplementCompletion.choices[0].message.content;
            console.log('补充回复:', supplementReply);

            // 将补充的字段插入到原回复的状态更新部分
            if (reply.includes('### ℹ️ 玩家状态更新')) {
                // 在状态更新部分之后插入补充字段
                reply = reply.replace(
                    /(### ℹ️ 玩家状态更新[\s\S]*?)(\n\n|$)/,
                    `$1\n${supplementReply}\n$2`
                );
            } else {
                // 如果没有状态更新部分，添加一个
                reply += '\n\n### ℹ️ 玩家状态更新\n' + supplementReply;
            }
        }

        res.json({ reply: reply });

    } catch (error) {
        console.error("DeepSeek API 调用失败:", error);
        res.status(500).json({ error: "API 调用失败，请检查 DEEPSEEK_API_KEY 是否设置正确，或密钥是否有效。" });
    }
});

// 🚨 VERCEL 关键：导出 Express 应用，代替 app.listen(...)
module.exports = app;

// 本地开发模式：如果不是通过 Vercel 运行，则启动服务器
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    const HOST = '0.0.0.0'; // 监听所有网络接口，允许局域网访问

    app.listen(PORT, HOST, () => {
        const os = require('os');
        const interfaces = os.networkInterfaces();

        console.log(`\n✅ 服务器已启动！\n`);
        console.log(`📡 局域网访问地址：`);

        // 获取所有IP地址
        Object.keys(interfaces).forEach((ifname) => {
            interfaces[ifname].forEach((iface) => {
                // 跳过内部和非IPv4地址
                if (iface.family === 'IPv4' && !iface.internal) {
                    console.log(`   http://${iface.address}:${PORT}`);
                }
            });
        });

        console.log(`\n💻 本地访问: http://localhost:${PORT}`);
        console.log(`\n🎮 在浏览器中打开上述任意地址即可开始游戏！\n`);
    });
}