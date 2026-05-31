// 课堂互动方案的 prompt 构造 + AI 返回解析。
// 这些逻辑原先在前端 src/api/xfyun.js，现搬到后端，使 AI 密钥与调用不再暴露于浏览器。

/** 构造发给讯飞的对话消息（system + user） */
export function buildInteractionMessages({ topic, supplement, caseType, difficulty, bookContext }) {
  const systemPrompt = getInteractionSystemPrompt(caseType, difficulty);
  let userPrompt = `【教学主题】${topic}
【互动类型】${caseType}
【难易程度】${difficulty || "进阶"}
【适用对象】高等院校专业课学生`;

  if (bookContext && bookContext.trim()) {
    userPrompt += `\n【参考教材】${bookContext.trim()}
请结合该教材的知识体系设计互动案例，确保场景和知识点与教材内容一致。`;
  }
  if (supplement && supplement.trim()) {
    userPrompt += `\n【补充要求】${supplement.trim()}`;
  }
  userPrompt += `\n\n请严格按照JSON格式输出，不要包含任何markdown代码块标记，直接输出可解析的JSON对象。`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

/** 解析 AI 返回的 JSON 字符串（容错 markdown 包裹 / 提取首个 JSON 对象） */
export function parseAIJsonResponse(rawText) {
  let text = String(rawText).trim();

  if (text.startsWith("```")) {
    const firstNewline = text.indexOf("\n");
    if (firstNewline !== -1) text = text.substring(firstNewline + 1);
    if (text.endsWith("```")) text = text.substring(0, text.length - 3);
    text = text.trim();
  }

  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error("AI 返回内容格式异常，无法解析为有效的JSON");
      }
    }
    throw new Error("AI 返回内容格式异常，无法解析为有效的JSON");
  }
}

/**
 * 课堂互动系统提示词
 * 融入难度适配：基础→引入式讨论、进阶→分析式讨论、挑战→思辨式讨论
 */
function getInteractionSystemPrompt(interactionType, difficulty) {
  const difficultyGuide = {
    基础: `【难度：基础】适合课程引入环节。案例场景应贴近学生日常生活，问题引导直接明了，参考答案包含基础知识点即可。`,
    进阶: `【难度：进阶】适合课堂核心讨论。案例需有一定复杂度和分析深度，问题引导需推动学生运用学科知识进行推理，参考答案需包含多角度分析和评价维度。`,
    挑战: `【难度：挑战】适合高阶研讨或期末综合讨论。案例应涉及学科前沿或跨学科问题，问题引导需激发批判性思维和创新观点，参考答案需体现深度思辨和学术争议。`,
  };

  const diffGuide = difficultyGuide[difficulty] || difficultyGuide["进阶"];

  const basePrompt = `你是谨世ATA研究院的高级教学设计师，专为高校教师设计课堂互动方案。

${diffGuide}

请为高等院校专业课学生生成一个课堂互动方案。你必须返回一个包含以下三个顶层字段的JSON对象：
{
  "caseContent": { ... },
  "referenceAnswer": { ... },
  "keyPoints": { ... }
}

互动内容要求：
1. 场景设置需真实、有代入感，能让大学生产生"这确实可能发生"的感受
2. 核心问题需有讨论空间和争议性，不能是"对或错"的判断题
3. 引导问题需层层递进，从事实识别→分析推理→价值判断
4. 参考答案需提供不同立场的分析，体现学术讨论的多元性
5. 核心要点需提炼可迁移到其他主题的方法论`;

  const typeSpecs = {
    案例分析: `${basePrompt}

===== 互动类型：案例分析 =====

caseContent字段：
{
  "title": "案例标题（吸引人、有信息量）",
  "scenario": "详细的情境描述（300-500字），包含背景、人物、矛盾、决策困境",
  "coreQuestions": ["核心问题1（需分析和判断）", "核心问题2（需提出方案）", "核心问题3（需评价反思）"],
  "guidingQuestions": ["事实层：发生了什么？关键因素有哪些？", "分析层：为什么会出现这个局面？", "判断层：如果是你，会怎么做？理由？", "反思层：这个案例对你理解该学科有何启发？"]
}

referenceAnswer字段：
{
  "coreArguments": ["核心论点1（基于学科理论的解释）", "核心论点2", "核心论点3"],
  "multiplePerspectives": ["角度1：从XX理论看……", "角度2：从XX利益方看……", "角度3：从长期影响看……"],
  "evaluationDimensions": ["理论应用准确度", "分析逻辑完整性", "方案可行性", "表达清晰度"]
}

keyPoints字段：
{
  "knowledgePoints": ["本案例涉及的学科知识点1", "知识点2", "知识点3", "知识点4"],
  "teachingSuggestions": ["建议1：可先让学生独立思考5分钟再分组讨论", "建议2：可引入真实新闻/数据佐证", "建议3"],
  "extendedThinking": ["延伸思考1：如果条件改变，结论会变吗？", "延伸思考2：这个案例与其他学科领域的关联"]
}`,

    正反辩论: `${basePrompt}

===== 互动类型：辩论 =====

caseContent字段：
{
  "title": "辩论主题（以'是否应该……'或类似争议性句式）",
  "scenario": "辩论背景描述（200-300字），说明为什么这个议题有争议、涉及哪些利益相关方",
  "affirmativePosition": "正方核心立场（含2-3个支撑论点）",
  "negativePosition": "反方核心立场（含2-3个支撑论点）",
  "coreQuestions": ["核心辩题表述"],
  "guidingQuestions": ["正方角度：支持该立场的理由有哪些？证据是什么？", "反方角度：反对该立场的理由有哪些？证据是什么？", "批判性思考：双方的论证中是否存在逻辑漏洞？", "综合思考：是否存在折中方案或第三条路？"]
}

referenceAnswer字段：
{
  "coreArguments": ["正方核心论据", "反方核心论据", "辩题背后更本质的问题"],
  "multiplePerspectives": ["伦理角度", "实践角度", "长远影响角度"],
  "evaluationDimensions": ["论点逻辑性", "论据充分度", "反驳能力", "语言表达", "团队协作"]
}

keyPoints字段：同案例分析结构`,

    角色扮演: `${basePrompt}

===== 互动类型：角色扮演 =====

caseContent字段：
{
  "title": "角色扮演主题",
  "scenario": "场景描述（200-300字），设定时间、地点、背景、冲突",
  "roles": [
    {"name": "角色名", "description": "角色身份和背景", "task": "该角色的目标和任务", "traits": ["性格/立场特征1", "特征2"]}
  ],
  "coreQuestions": ["各角色需要共同解决的问题", "角色间的主要冲突点"],
  "guidingQuestions": ["你在角色中的核心利益是什么？", "对方的核心利益可能是什么？", "有哪些可能的让步空间？", "如果谈判失败，各方的后果是什么？"]
}

referenceAnswer字段：
{
  "coreArguments": ["各角色的最优策略分析", "可能的谈判结果及条件"],
  "multiplePerspectives": ["角色A视角", "角色B视角", "第三方/观察者视角"],
  "evaluationDimensions": ["角色理解深度", "策略合理性", "沟通技巧", "团队协作", "临场应变"]
}

keyPoints字段：同案例分析结构`,

    项目探究: `${basePrompt}

===== 互动类型：项目探究 =====

caseContent字段：
{
  "title": "探究项目标题",
  "scenario": "探究背景（200-300字），说明现实问题、探究动机和意义",
  "inquiryQuestions": ["核心探究问题1", "核心探究问题2"],
  "methods": ["建议的研究/探究方法1", "方法2", "方法3"],
  "coreQuestions": ["这个探究项目要解决的具体问题"],
  "guidingQuestions": ["第一步：如何界定问题？需要收集哪些信息？", "第二步：有哪些可能的解决方案或假设？", "第三步：如何验证你的方案？需要哪些数据？", "第四步：你的结论是什么？有何局限性？"]
}

referenceAnswer字段：
{
  "coreArguments": ["探究思路框架", "可能的发现方向"],
  "multiplePerspectives": ["理论角度", "实践角度", "创新角度"],
  "evaluationDimensions": ["问题界定清晰度", "探究方法科学性", "数据分析深度", "结论创新性", "汇报展示质量"]
}

keyPoints字段：同案例分析结构`,

    问题解决: `${basePrompt}

===== 互动类型：问题解决 =====

caseContent字段：
{
  "title": "问题解决主题",
  "scenario": "问题情境（200-300字），设定具体问题和背景",
  "problemDescription": "具体的问题描述，明确需要解决什么",
  "constraints": ["约束条件1（资源/时间/技术/伦理等）", "约束条件2"],
  "coreQuestions": ["在给定约束下，如何解决该问题？"],
  "guidingQuestions": ["第一步：问题的本质是什么？根因在哪里？", "第二步：在不考虑约束的情况下，理想的解决方案是什么？", "第三步：在约束条件下，可行的方案有哪些？", "第四步：最优方案是什么？风险评估？"]
}

referenceAnswer字段：
{
  "coreArguments": ["问题分析框架", "可行方案及优劣比较"],
  "multiplePerspectives": ["方案A及适用条件", "方案B及适用条件", "方案C及适用条件", "最优选择及理由"],
  "evaluationDimensions": ["问题分析深度", "方案创新性", "可行性", "风险评估", "表达清晰度"]
}

keyPoints字段：同案例分析结构`,
    头脑风暴: `${basePrompt}

===== 互动类型：头脑风暴 =====

caseContent字段：
{
  "title": "头脑风暴主题（聚焦一个开放性议题）",
  "scenario": "情境/任务描述（200-400字），抛出一个值得多角度发散思考的开放议题，鼓励尽可能多元的想法，不预设唯一答案",
  "coreQuestions": ["发散问题1（鼓励产生尽可能多的设想）", "发散问题2（从不同学科/角度切入）", "发散问题3（追问想法的可行性与创新点）"],
  "guidingQuestions": ["联想层：围绕主题能联想到哪些相关点子？", "迁移层：其他领域的做法能否借鉴过来？", "组合层：把不同想法组合会碰撞出什么新方案？", "评估层：哪些想法最值得深入？理由是什么？"]
}

referenceAnswer字段：
{
  "coreArguments": ["可能的创意方向1", "可能的创意方向2", "可能的创意方向3"],
  "multiplePerspectives": ["技术/方法角度", "用户/受众角度", "成本与可行性角度"],
  "evaluationDimensions": ["想法数量", "创新程度", "可行性", "多样性", "表达清晰度"]
}

keyPoints字段：同案例分析结构`,

    自定义: `${basePrompt}

===== 互动类型：自定义 =====

caseContent字段：
{
  "title": "互动主题",
  "scenario": "情境描述（200-400字）。请严格依据【补充要求】中教师指定的互动形式与内容来组织；若补充要求未明确指定，则采用通用的课堂讨论形式",
  "coreQuestions": ["核心问题1", "核心问题2", "核心问题3"],
  "guidingQuestions": ["引导问题1", "引导问题2", "引导问题3", "引导问题4"]
}

referenceAnswer字段：
{
  "coreArguments": ["核心论点1", "核心论点2", "核心论点3"],
  "multiplePerspectives": ["角度1", "角度2", "角度3"],
  "evaluationDimensions": ["评分维度1", "评分维度2", "评分维度3", "评分维度4"]
}

keyPoints字段：同案例分析结构`,
  };

  return typeSpecs[interactionType] || typeSpecs["案例分析"];
}
