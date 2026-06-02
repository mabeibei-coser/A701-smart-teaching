/**
 * AI 提示词模板
 * 知识卡片 & 讨论案例的系统级/用户级提示词
 */

// ======================== 知识卡片提示词 ========================

export const CARD_PROMPTS = {
  '概念总览': {
    system: `你是教育内容生成专家。请极度提炼：定义≤30字，特征用2-4字关键词，示例用标题+短说明。`,
    format: `{
  "title": "概念名称",
  "definition": "≤30字",
  "keyFeatures": ["关键词", "关键词"],
  "examples": [{"title": "≤8字", "desc": "≤15字"}],
  "relatedConcepts": [{"from": "A", "to": "B", "relation": "≤6字"}],
  "summary": "≤20字"
}`,
  },
  '时间线卡': {
    system: `你是教育内容生成专家。请提供6-8个节点，每个含简短的time/label/description。`,
    format: `{
  "title": "时间线标题",
  "events": [{"time": "时间", "label": "事件", "description": "简述", "phase": "阶段"}],
  "phases": ["阶段1", "阶段2"],
  "summary": "≤30字"
}`,
  },
  '教学讲义': {
    system: `你是教育内容生成专家。请生成结构化讲义：章节标题≤12字，重点条目3-5条、每条≤20字，标注要点。`,
    format: `{
  "title": "讲义标题",
  "sections": [{"heading": "章节(≤12字)", "keyPoints": ["≤20字"], "notes": "≤15字"}],
  "emphasis": ["重点标注≤15字"],
  "summary": "≤30字"
}`,
  },
  '重点提要': {
    system: `你是教育内容生成专家。请拆解为5-7步，每步名称≤8字、说明≤15字。`,
    format: `{
  "title": "流程标题",
  "steps": [{"order": 1, "name": "步骤", "description": "≤15字", "keyPoint": "≤10字"}],
  "outcome": "≤20字"
}`,
  },
  '层级卡': {
    system: `你是教育内容生成专家。请构建3-4层分类结构，每层3-5条目，名称≤8字。`,
    format: `{
  "title": "层级主题",
  "levels": [{"level": 1, "name": "分类", "children": [{"level": 2, "name": "子类"}]}]
}`,
  },
  '公式卡': {
    system: `你是教育内容生成专家。请解析公式，变量说明≤6字，例题解答≤40字。`,
    format: `{
  "title": "公式名称",
  "formula": "LaTeX",
  "variables": [{"symbol": "x", "name": "≤6字", "unit": "单位"}],
  "conditions": ["≤15字"],
  "examples": [{"problem": "≤30字", "solution": "≤40字"}],
  "notes": "≤20字"
}`,
  },
  '全景图卡': {
    system: `你是教育内容生成专家。请构建知识全景：核心定位≤40字，子领域5-7个。`,
    format: `{
  "title": "主题",
  "coreConcept": "≤40字",
  "subFields": [{"name": "子领域", "description": "≤15字"}],
  "connections": [{"from": "A", "to": "B", "relation": "≤8字"}],
  "applications": [{"name": "应用", "description": "≤20字"}],
  "summary": "≤30字"
}`,
  },
};

// ======================== 讨论案例提示词 ========================

export const DISCUSSION_COMMON_FORMAT = {
  caseContent: {
    title: '案例标题',
    scenario: '情境描述（200-400字）',
    coreQuestions: ['核心问题1', '核心问题2', '核心问题3'],
    guidingQuestions: ['引导问题1', '引导问题2', '引导问题3', '引导问题4', '引导问题5'],
  },
  referenceAnswer: {
    coreArguments: ['核心论点1', '核心论点2', '核心论点3'],
    multiplePerspectives: ['角度1', '角度2', '角度3'],
    evaluationDimensions: ['评分维度1', '评分维度2', '评分维度3', '评分维度4'],
  },
  keyPoints: {
    knowledgePoints: ['知识点1', '知识点2', '知识点3'],
    teachingSuggestions: ['教学建议1', '教学建议2'],
    extendedThinking: ['延伸思考1', '延伸思考2'],
  },
};

export const DISCUSSION_PROMPTS = {
  '案例分析': {
    system: `你是一个教学设计专家。请生成基于真实或虚构情境的案例分析讨论。案例需要有深度、有讨论空间。`,
    extraFields: {},
  },
  '正反辩论': {
    system: `你是一个教学设计专家。请生成具有正反方立场的辩论讨论案例。立场设置需平衡、有争议空间。`,
    extraFields: {
      affirmativePosition: '正方立场描述',
      negativePosition: '反方立场描述',
    },
  },
  '角色扮演': {
    system: `你是一个教学设计专家。请生成包含多角色设定的角色扮演讨论案例。角色设计需有区分度和互动空间。`,
    extraFields: {
      roles: [
        { name: '角色名称', description: '角色描述', task: '角色任务', traits: ['特质1', '特质2'] },
      ],
    },
  },
  '项目探究': {
    system: `你是一个教学设计专家。请生成基于项目式学习的探究讨论案例。需包含探究问题和建议方法。`,
    extraFields: {
      inquiryQuestions: ['探究问题1', '探究问题2'],
      methods: ['建议方法1', '建议方法2', '建议方法3'],
    },
  },
  '问题解决': {
    system: `你是一个教学设计专家。请生成基于问题解决模式的讨论案例。需包含具体问题和约束条件。`,
    extraFields: {
      problemDescription: '具体问题描述',
      constraints: ['约束条件1', '约束条件2'],
    },
  },
  '投票选择': {
    system: `你是一个教学设计专家。请生成一个课堂投票互动方案。投票需要具有教学意义，选项设置应有区分度和讨论价值。`,
    extraFields: {
      options: [
        { label: '选项A描述', description: '该选项的简要说明' },
        { label: '选项B描述', description: '该选项的简要说明' },
      ],
    },
  },
};

// ======================== 卡片尺寸映射 ========================

export const CARD_SIZE_MAP = {
  'A5': { width: 450, label: 'A5 (148×210mm)' },
  'B5': { width: 550, label: 'B5 (176×250mm)' },
  'A4': { width: 700, label: 'A4 (210×297mm)' },
};

// ======================== 卡片类型映射 ========================

export const CARD_TYPES = [
  '概念全景', '公式口诀', '时间线卡', '重点难点', '宣传推广', '自定义卡',
];

export const CARD_SIZES = ['A5', 'B5', 'A4'];

// ======================== SVG 图标工厂 ========================
const I = (d) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;

// ======================== 卡片风格（共 10 种） ========================
export const CARD_STYLES = [
  { value: '高等教育', label: '高等教育', desc: '专业大气，适合教学培训',
    icon: I('M22 10 12 5 2 10l10 5 10-5z M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5') },
  { value: '基础教学', label: '基础教学', desc: '形象生动，适合小初高教育',
    icon: I('M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z') },
  { value: '白板风格', label: '白板风格', desc: '清晰明亮，万能日常',
    icon: I('M3 3h18v4H3z M3 9h18v3H3z M3 14h14v3H3z M3 19h10v2H3z') },
  { value: '黑板风格', label: '黑板风格', desc: '粉笔手绘，适合讲解',
    icon: I('M22 10l-6-6L4 16v6h6z M18 4l4 4') },
  { value: '商务报告', label: '商务报告', desc: '专业大气，适合商业职场',
    icon: I('M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M8 12h.01 M12 12h.01 M16 12h.01') },
  { value: '信息图表', label: '信息图表', desc: '数据可视，适合统计对比',
    icon: I('M18 20V10 M12 20V4 M6 20v-6') },
  { value: '创意海报', label: '创意海报', desc: '个性灵感，适合社交传播',
    icon: I('M9 18h6 M10 22h4 M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z') },
  { value: '火柴人', label: '火柴人', desc: '极简人物，适合场景演示',
    icon: I('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2') },
  { value: '手绘稿', label: '手绘稿', desc: '轻松活泼，适合引入话题',
    icon: I('M12 20h9 M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z') },
  { value: '自定义', label: '自定义', desc: '自由发挥，适合个性创作',
    icon: I('M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6') },
];

export const DISCUSSION_TYPES = [
  '案例分析', '正反辩论', '角色扮演', '头脑风暴', '投票选择', '自定义',
];
