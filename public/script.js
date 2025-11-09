// script.js

const messagesDiv = document.getElementById('messages');
const welcomeScreen = document.getElementById('welcome-screen');
const gameContainer = document.getElementById('game-container');
const statusPanel = document.getElementById('status-panel');

// 状态面板元素
const hpValue = document.getElementById('hp-value');
const inventoryValue = document.getElementById('inventory-value');
const locationValue = document.getElementById('location-value');
const difficultyValue = document.getElementById('difficulty-value');
const objectiveValue = document.getElementById('objective-value');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const hpChange = document.getElementById('hp-change');

// 保存上一次的HP值，用于计算变化
let lastHP = 100;

// 游戏状态
let chatHistory = [];
let currentOptions = [];
let gameEnded = false;
let selectedDifficulty = '';

// 难度选择
document.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    selectedDifficulty = this.getAttribute('data-difficulty');

    const difficultyNames = {
      'easy': '简单',
      'normal': '普通',
      'hard': '困难'
    };
    difficultyValue.textContent = difficultyNames[selectedDifficulty];

    // 隐藏欢迎界面，显示游戏
    welcomeScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    statusPanel.style.display = 'block';

    // 开始游戏
    setTimeout(() => {
      sendMessage(`开始游戏，难度：${selectedDifficulty}`);
    }, 300);
  });
});

/**
 * 将消息添加到聊天窗口
 */
function appendMessage(content, sender) {
  const div = document.createElement('div');
  div.classList.add('message', `${sender}-message`);

  if (sender === 'bot') {
    content = cleanBotMessage(content);
  }

  div.innerHTML = formatMessage(content);
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * 清理bot消息，移除状态和选项部分
 */
function cleanBotMessage(content) {
  // 移除状态更新部分（从 ### ℹ️ 开始到最后）
  content = content.replace(/###\s*ℹ️\s*玩家状态更新[\s\S]*/i, '').trim();

  // 移除行动选项部分（从 ### 💬 开始到下一个 ### 或结尾）
  content = content.replace(/###\s*💬\s*行动选项[\s\S]*?(?=###|$)/i, '').trim();

  // 额外清理：移除任何残留的 A. B. C. D. 选项行
  content = content.replace(/^[A-D]\.\s*.+$/gm, '').trim();

  // 移除多余的空行
  content = content.replace(/\n{3,}/g, '\n\n');

  return content;
}

/**
 * 添加选项按钮
 */
function appendOptionsButtons(options) {
  const oldButtons = document.querySelector('.options-container');
  if (oldButtons) {
    oldButtons.remove();
  }

  if (options.length === 0 || gameEnded) return;

  const container = document.createElement('div');
  container.classList.add('options-container');

  options.forEach(option => {
    const button = document.createElement('button');
    button.classList.add('option-button');
    button.setAttribute('data-option', option.key);

    const label = document.createElement('span');
    label.classList.add('option-label');
    label.textContent = option.key;

    const text = document.createElement('span');
    text.classList.add('option-text');
    text.textContent = option.text;

    button.appendChild(label);
    button.appendChild(text);

    button.addEventListener('click', () => {
      if (!gameEnded) {
        selectOption(option.key);
      }
    });

    container.appendChild(button);
  });

  messagesDiv.appendChild(container);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * 选择选项
 */
function selectOption(optionKey) {
  const buttons = document.querySelectorAll('.option-button');
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.getAttribute('data-option') === optionKey) {
      btn.classList.add('selected');
    } else {
      btn.classList.add('disabled');
    }
  });

  // 只显示选择了哪个选项，不显示内容
  const message = `选择了 ${optionKey}`;
  appendMessage(message, 'user');
  chatHistory.push({ role: 'user', content: optionKey });
  sendMessage(optionKey);
}

/**
 * 格式化消息
 */
function formatMessage(content) {
  content = content.replace(/###\s*(.*?)(\n|$)/g, '<strong style="display:block; margin: 10px 0; color: #667eea; font-size: 16px;">$1</strong>');
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
  content = content.replace(/\n/g, '<br>');
  return content;
}

/**
 * 解析选项 - 修复版本，只提取选项字母，不提取描述
 */
function parseOptions(reply) {
  const options = [];

  // 只匹配 A. B. C. D. 的行，但只保存字母，不保存描述
  // 因为描述已经在AI回复中显示了
  const lines = reply.split('\n');
  for (const line of lines) {
    const match = line.match(/^([A-D])\.\s*(.+)/);
    if (match) {
      options.push({
        key: match[1],
        text: match[2].trim()
      });
    }
  }

  return options;
}

/**
 * 显示HP变化特效 - 增强版
 */
function showHPChange(oldHP, newHP, reason) {
  const change = newHP - oldHP;
  if (change === 0) return;

  const changeElement = hpChange;
  changeElement.textContent = change > 0 ? `+${change}` : `${change}`;
  changeElement.className = 'hp-change';

  if (change > 0) {
    changeElement.classList.add('hp-gain');
  } else {
    changeElement.classList.add('hp-loss');
  }

  // 如果有原因，显示悬浮提示
  if (reason) {
    changeElement.setAttribute('title', reason);
  }

  // 添加动画类
  changeElement.classList.add('show');

  // 3秒后移除
  setTimeout(() => {
    changeElement.classList.remove('show');
  }, 3000);

  // 获取HP容器元素
  const hpContainer = document.querySelector('.hp-container');

  // 增强的震动和闪烁效果
  if (change < 0) {
    // 扣血：震动 + 红色闪烁
    hpValue.classList.add('shake');
    hpContainer.classList.add('hp-damage-flash');
    setTimeout(() => {
      hpValue.classList.remove('shake');
      hpContainer.classList.remove('hp-damage-flash');
    }, 500);
  } else {
    // 回血：绿色闪烁
    hpContainer.classList.add('hp-heal-flash');
    setTimeout(() => {
      hpContainer.classList.remove('hp-heal-flash');
    }, 500);
  }
}

/**
 * 更新状态面板
 */
function updateStatusPanel(reply) {
  console.log('=== 调试：AI原始回复 ===');
  console.log(reply);

  // 提取游戏目标 - 更宽松的正则，支持多种格式
  // 匹配: **Objective**: xxx 或 **Objective**:xxx 或 **Objective** : xxx
  const objectiveMatch = reply.match(/\*\*Objective\*\*\s*[：:]\s*(.+?)(?=\n\*\*|\n\n|\n[A-D]\.|$)/is);
  if (objectiveMatch) {
    const objective = objectiveMatch[1].trim();
    if (objective && objective.length > 0) {
      objectiveValue.textContent = objective;
      console.log('✓ 找到目标:', objective);
    }
  } else {
    console.log('✗ 未找到Objective字段');
    console.log('尝试查找原始文本中的Objective...');
    // 尝试更宽松的匹配
    const fallbackMatch = reply.match(/Objective[：:]\s*(.+?)(?=\n|$)/i);
    if (fallbackMatch) {
      const objective = fallbackMatch[1].trim();
      if (objective && objective.length > 0) {
        objectiveValue.textContent = objective;
        console.log('✓ 备用匹配找到目标:', objective);
      }
    }
  }

  // 提取目标进度（百分比） - 更宽松的匹配
  const progressPercentMatch = reply.match(/\*\*Progress\*\*\s*[：:]\s*[^%\n]*?(\d+)\s*%/is);
  if (progressPercentMatch) {
    const percent = parseInt(progressPercentMatch[1]);
    progressBar.style.width = percent + '%';
    progressText.textContent = percent + '%';
    console.log('✓ 找到进度:', percent + '%');

    // 进度条颜色变化
    if (percent < 30) {
      progressBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
    } else if (percent < 70) {
      progressBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
    } else {
      progressBar.style.background = 'linear-gradient(90deg, #27ae60, #229954)';
    }
  } else {
    console.log('✗ 未找到Progress百分比');
    // 尝试更宽松的匹配
    const fallbackMatch = reply.match(/Progress[：:]\s*[^%\n]*?(\d+)\s*%/i);
    if (fallbackMatch) {
      const percent = parseInt(fallbackMatch[1]);
      progressBar.style.width = percent + '%';
      progressText.textContent = percent + '%';
      console.log('✓ 备用匹配找到进度:', percent + '%');
    }
  }

  // 提取当前位置 - 更宽松的正则
  const locationMatch = reply.match(/\*\*Location\*\*\s*[：:]\s*(.+?)(?=\n\*\*|\n\n|\n[A-D]\.|$)/is);
  if (locationMatch) {
    const location = locationMatch[1].trim();
    if (location && location.length > 0) {
      locationValue.textContent = location;
      console.log('✓ 找到位置:', location);
    }
  } else {
    console.log('✗ 未找到Location字段');
    // 尝试更宽松的匹配
    const fallbackMatch = reply.match(/Location[：:]\s*(.+?)(?=\n|$)/i);
    if (fallbackMatch) {
      const location = fallbackMatch[1].trim();
      if (location && location.length > 0) {
        locationValue.textContent = location;
        console.log('✓ 备用匹配找到位置:', location);
      }
    }
  }

  // HP - 检测变化并提取原因
  const hpMatch = reply.match(/\*\*HP\*\*[：:]\s*(\d+)/i);
  if (hpMatch) {
    const hp = parseInt(hpMatch[1]);

    // 提取HP变化原因
    let reason = '';
    const reasonMatch = reply.match(/HP[：:]\s*\d+\s*\((.+?)\)/i);
    if (reasonMatch) {
      reason = reasonMatch[1];
    } else {
      // 尝试从上下文推断原因
      if (hp < lastHP) {
        if (reply.includes('战斗') || reply.includes('攻击') || reply.includes('敌人')) {
          reason = '战斗受伤';
        } else if (reply.includes('陷阱') || reply.includes('机关')) {
          reason = '触发陷阱';
        } else if (reply.includes('失败') || reply.includes('错误')) {
          reason = '选择失误';
        } else {
          reason = '受到伤害';
        }
      } else if (hp > lastHP) {
        if (reply.includes('治疗') || reply.includes('药水')) {
          reason = '使用治疗';
        } else if (reply.includes('休息')) {
          reason = '休息恢复';
        } else {
          reason = '恢复生命';
        }
      }
    }

    // 显示HP变化特效
    if (hp !== lastHP) {
      showHPChange(lastHP, hp, reason);
      lastHP = hp;
    }

    hpValue.textContent = hp;

    // 颜色变化
    if (hp > 70) {
      hpValue.style.color = '#27ae60';
    } else if (hp > 30) {
      hpValue.style.color = '#f39c12';
    } else if (hp > 0) {
      hpValue.style.color = '#e74c3c';
    } else {
      hpValue.style.color = '#000';
      hpValue.textContent = '0 (死亡)';
    }
  }

  // Inventory
  const inventoryMatch = reply.match(/\*\*Inventory\*\*[：:]\s*(.+?)(?=\*\*|\n|$)/i);
  if (inventoryMatch) {
    let inventory = inventoryMatch[1].trim();
    inventoryValue.textContent = inventory || '无';
  }
}

/**
 * 检查游戏结束
 */
function checkGameEnd(reply) {
  if (reply.includes('VICTORY') || reply.includes('胜利')) {
    gameEnded = true;
    showGameEndMessage('victory');
    return true;
  }

  if (reply.includes('GAME OVER') || reply.includes('游戏结束')) {
    gameEnded = true;
    showGameEndMessage('defeat');
    return true;
  }

  const hpMatch = reply.match(/\*\*HP\*\*[：:]\s*(\d+)/i);
  if (hpMatch && parseInt(hpMatch[1]) <= 0) {
    gameEnded = true;
    showGameEndMessage('defeat');
    return true;
  }

  return false;
}

/**
 * 显示游戏结束消息
 */
function showGameEndMessage(result) {
  const container = document.createElement('div');
  container.classList.add('game-end-container');

  if (result === 'victory') {
    container.innerHTML = `
      <div class="game-end victory">
        <h2>🎉 胜利！</h2>
        <p>恭喜你成功完成了冒险！</p>
        <button onclick="location.reload()" class="restart-button">重新开始</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="game-end defeat">
        <h2>💀 游戏结束</h2>
        <p>你的冒险到此为止...</p>
        <button onclick="location.reload()" class="restart-button">重新开始</button>
      </div>
    `;
  }

  messagesDiv.appendChild(container);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * 调用后端 API
 */
async function sendMessage(message) {
  const loadingText = message.includes('开始游戏') ? "🎲 AI正在构建冒险世界..." : "⏳ AI正在思考...";
  appendMessage(`<em>${loadingText}</em>`, 'bot');
  const thinkingMessage = messagesDiv.lastChild;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history: chatHistory,
        difficulty: selectedDifficulty
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    messagesDiv.removeChild(thinkingMessage);

    const reply = data.reply;

    // 1. 更新状态面板
    updateStatusPanel(reply);

    // 2. 检查游戏是否结束
    const ended = checkGameEnd(reply);

    // 3. 显示AI回复（已清理状态和选项）
    appendMessage(reply, 'bot');

    // 4. 如果没结束，解析并显示选项按钮
    if (!ended) {
      const options = parseOptions(reply);
      currentOptions = options;
      appendOptionsButtons(options);
    }

    // 5. 将AI回复加入历史
    chatHistory.push({ role: 'assistant', content: reply });

  } catch (error) {
    console.error("发送消息失败:", error);
    if (thinkingMessage) messagesDiv.removeChild(thinkingMessage);
    appendMessage(`❌ 系统错误：无法连接到服务器。请检查网络连接。`, 'bot');
  }
}
