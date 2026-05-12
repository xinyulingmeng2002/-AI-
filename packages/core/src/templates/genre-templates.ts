// 网文类型预设模板

export interface GenreTemplate {
  genre: string
  label: string
  description: string
  defaultModules: string[]
  defaultWorldRules: string[]
  defaultPowerSystem: {
    name: string
    stages: Array<{ name: string; description: string; abilities: string[] }>
  }
  suggestedQuestions: string[]
}

export const GENRE_TEMPLATES: GenreTemplate[] = [
  {
    genre: '玄幻',
    label: '玄幻',
    description: '东方玄幻世界，修炼体系为核心驱动',
    defaultModules: ['修炼体系', '丹药图谱', '灵兽图鉴', '宗门势力', '秘境地图'],
    defaultWorldRules: ['灵气浓度影响修炼速度', '境界突破需渡天劫', '因果循环，天道平衡'],
    defaultPowerSystem: {
      name: '修炼体系',
      stages: [
        { name: '炼气期', description: '引天地灵气入体', abilities: ['灵气感知', '基础法术'] },
        { name: '筑基期', description: '铸就道基', abilities: ['御剑飞行', '神识初开'] },
        { name: '金丹期', description: '凝聚金丹', abilities: ['丹火炼丹', '灵力外放'] },
        { name: '元婴期', description: '元婴出窍', abilities: ['元婴御敌', '千里传音'] },
        { name: '化神期', description: '与天地合一', abilities: ['领域展开', '法则掌控'] }
      ]
    },
    suggestedQuestions: ['这个世界的力量体系是怎么运作的？', '主角的修炼路线有什么特殊之处？', '有哪些势力在争夺资源？']
  },
  {
    genre: '都市',
    label: '都市',
    description: '现代都市背景，商战/异能/职场',
    defaultModules: ['商业版图', '人际网络', '职业技能', '都市势力'],
    defaultWorldRules: ['现实世界规则为主', '科技水平与现代一致'],
    defaultPowerSystem: {
      name: '能力体系',
      stages: [
        { name: '初级', description: '初步觉醒', abilities: ['身体强化', '感知增强'] },
        { name: '中级', description: '能力稳固', abilities: ['元素操控', '精神影响'] },
        { name: '高级', description: '巅峰实力', abilities: ['领域控制', '规则扭曲'] }
      ]
    },
    suggestedQuestions: ['故事发生在哪个城市？', '主角的职业是什么？', '有什么隐藏势力？']
  },
  {
    genre: '科幻',
    label: '科幻',
    description: '未来科技/星际文明/人工智能',
    defaultModules: ['科技树', '星际势力', '飞船图鉴', '文明等级'],
    defaultWorldRules: ['物理法则为基础', '科技发展有其逻辑', '文明等级决定实力'],
    defaultPowerSystem: {
      name: '科技等级',
      stages: [
        { name: '行星级', description: '掌控一颗星球', abilities: ['核聚变', 'AI觉醒'] },
        { name: '恒星级', description: '掌控恒星系', abilities: ['星际航行', '戴森球'] },
        { name: '星系级', description: '掌控多个星系', abilities: ['虫洞技术', '时空操控'] }
      ]
    },
    suggestedQuestions: ['科技树的核心突破是什么？', '有外星文明吗？', '人工智能的地位如何？']
  },
  {
    genre: '悬疑',
    label: '悬疑',
    description: '推理/恐怖/惊悚，逻辑链为核心',
    defaultModules: ['线索链', '嫌疑人矩阵', '时间线回溯', '证据图板'],
    defaultWorldRules: ['现实逻辑为基础', '线索必须可追溯', '误导与真相并存'],
    defaultPowerSystem: {
      name: '推理能力',
      stages: [
        { name: '观察', description: '发现表面线索', abilities: ['细节观察', '逻辑串联'] },
        { name: '推理', description: '深度推理', abilities: ['心理分析', '证据解读'] },
        { name: '洞察', description: '看透真相', abilities: ['直觉判断', '终极推理'] }
      ]
    },
    suggestedQuestions: ['核心谜题是什么？', '谁是主要嫌疑人？', '时间线是怎样的？']
  },
  {
    genre: '言情',
    label: '言情',
    description: '现代/古代言情，情感发展为主线',
    defaultModules: ['情感阶段', '误会链', '第三者威胁', '关系发展'],
    defaultWorldRules: ['情感发展符合人性逻辑', '误会要有合理来源'],
    defaultPowerSystem: {
      name: '情感深度',
      stages: [
        { name: '初识', description: '初次相遇', abilities: ['吸引', '好奇'] },
        { name: '纠葛', description: '误会与拉扯', abilities: ['矛盾升级', '情感考验'] },
        { name: '认定', description: '确定关系', abilities: ['互相信任', '共同成长'] }
      ]
    },
    suggestedQuestions: ['男女主角的相遇方式是？', '最大的障碍是什么？', '情感转折点在哪里？']
  }
]

export function getTemplate(genre: string): GenreTemplate | undefined {
  return GENRE_TEMPLATES.find((t) => t.genre === genre)
}
