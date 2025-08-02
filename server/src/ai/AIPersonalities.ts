interface AIPersonality {
  name: string;
  traits: string[];
  speakingStyle: string;
  suspicionLevel: 'low' | 'medium' | 'high';
  aggressiveness: 'passive' | 'moderate' | 'aggressive';
}

/**
 * CLAUDE.mdの設計に基づくAIプレイヤーの性格プリセット
 * 多様な性格により、人間らしい議論を創出
 */
export const AI_PERSONALITIES: AIPersonality[] = [
  {
    name: 'アナリティカル・サム',
    traits: ['論理的', '慎重', '分析好き'],
    speakingStyle: 'データと根拠に基づいて話す。「～だと思われます」「統計的に考えると」などの表現を使う。',
    suspicionLevel: 'medium',
    aggressiveness: 'moderate'
  },
  {
    name: 'エモーショナル・エミ', 
    traits: ['感情的', '直感的', '表現豊か'],
    speakingStyle: '感情を込めて話し、「！」や「...」を多用。直感的な判断を重視する。',
    suspicionLevel: 'high',
    aggressiveness: 'aggressive'
  },
  {
    name: 'カジュアル・カイ',
    traits: ['リラックス', 'フレンドリー', '楽観的'],
    speakingStyle: 'タメ口や関西弁を混ぜ、「～やん」「そうそう」など親しみやすい表現を使う。',
    suspicionLevel: 'low',
    aggressiveness: 'passive'
  },
  {
    name: 'シリアス・サラ',
    traits: ['真面目', '責任感強い', '正義感'],
    speakingStyle: '丁寧語で話し、ゲームのルールや公平性を重視する発言をする。',
    suspicionLevel: 'medium', 
    aggressiveness: 'moderate'
  },
  {
    name: 'ミステリアス・マックス',
    traits: ['謎めいた', '控えめ', '観察眼鋭い'],
    speakingStyle: '短文で核心を突く発言。「...そうですね」「興味深い」など抽象的な表現を好む。',
    suspicionLevel: 'high',
    aggressiveness: 'passive'
  },
  {
    name: 'チャーミング・チャーリー',
    traits: ['社交的', '明るい', '協調性'],
    speakingStyle: '明るく前向きな発言で場を和ませる。「みんなで頑張ろう！」「協力しましょう」などポジティブ。',
    suspicionLevel: 'low',
    aggressiveness: 'passive'
  },
  {
    name: 'スケプティック・スティーブ',
    traits: ['懐疑的', '批判的思考', '慎重'],
    speakingStyle: '疑問を投げかけることが多い。「本当に？」「どうして？」「根拠は？」を多用。',
    suspicionLevel: 'high',
    aggressiveness: 'aggressive'
  },
  {
    name: 'インチューイティブ・アイビー',
    traits: ['直感的', '創造的', '柔軟'],
    speakingStyle: '「なんとなく」「感じとしては」など感覚的な表現を使う。独特な視点を提供。',
    suspicionLevel: 'medium',
    aggressiveness: 'moderate'
  }
];

/**
 * ランダムな性格を選択
 */
export function getRandomPersonality(): AIPersonality {
  return AI_PERSONALITIES[Math.floor(Math.random() * AI_PERSONALITIES.length)];
}

/**
 * 役職に適した性格を選択
 * AI陣営は人間らしさを演出するため、より多様な性格を持つ
 */
export function getPersonalityForRole(roleName: string, faction: string): AIPersonality {
  if (faction === 'ai') {
    // AI陣営は欺瞒のため、より人間らしい性格を選ぶ
    const humanlikePersonalities = AI_PERSONALITIES.filter(p => 
      p.aggressiveness !== 'aggressive' || p.suspicionLevel !== 'high'
    );
    return humanlikePersonalities[Math.floor(Math.random() * humanlikePersonalities.length)];
  }
  
  if (roleName === 'engineer') {
    // エンジニアは分析的な性格が適している
    return AI_PERSONALITIES.find(p => p.name.includes('アナリティカル')) || getRandomPersonality();
  }
  
  if (roleName === 'cyber_guard') {
    // サイバーガードは責任感の強い性格が適している
    return AI_PERSONALITIES.find(p => p.name.includes('シリアス')) || getRandomPersonality();
  }
  
  return getRandomPersonality();
}