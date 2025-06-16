/**
 * Generates contextual follow-up questions based on AI response content
 */
export function generateFollowUpQuestions(messageContent: string): string[] {
  if (!messageContent || messageContent.trim().length === 0) {
    return [];
  }
  
  const content = messageContent.toLowerCase();
  const suggestions: string[] = [];

  // Domain analysis related questions
  if (content.includes('domain') || content.includes('ドメイン')) {
    if (content.includes('available') || content.includes('登録可能')) {
      suggestions.push("How do I register this domain?");
      suggestions.push("What are the best domain registrars?");
      suggestions.push("How much does domain registration cost?");
    }
    
    if (content.includes('ssl') || content.includes('証明書')) {
      suggestions.push("How do I set up SSL certificate?");
      suggestions.push("What are the best SSL providers?");
    }
    
    if (content.includes('dns') || content.includes('ネームサーバー')) {
      suggestions.push("How do I configure DNS settings?");
      suggestions.push("What is the best DNS provider?");
    }
    
    if (content.includes('security') || content.includes('セキュリティ')) {
      suggestions.push("How can I improve domain security?");
      suggestions.push("What are common domain security threats?");
    }
    
    if (content.includes('score') || content.includes('スコア')) {
      suggestions.push("How can I improve the domain score?");
      suggestions.push("What factors affect domain scoring?");
    }
    
    // Always include general domain questions
    suggestions.push("Can you suggest alternative domain names?");
    suggestions.push("What should I consider when choosing a domain?");
  }

  // Technical analysis related questions
  if (content.includes('technical') || content.includes('技術')) {
    suggestions.push("Can you explain the technical details?");
    suggestions.push("What are the performance implications?");
  }

  // Risk related questions
  if (content.includes('risk') || content.includes('リスク')) {
    suggestions.push("How can I mitigate these risks?");
    suggestions.push("What are the worst-case scenarios?");
  }

  // Recommendation related questions
  if (content.includes('recommend') || content.includes('推奨')) {
    suggestions.push("Can you prioritize these recommendations?");
    suggestions.push("What's the implementation timeline?");
  }

  // Cost related questions
  if (content.includes('cost') || content.includes('費用') || content.includes('価格')) {
    suggestions.push("What are the total costs involved?");
    suggestions.push("Are there any free alternatives?");
  }

  // Performance related questions
  if (content.includes('performance') || content.includes('パフォーマンス')) {
    suggestions.push("How can I optimize performance?");
    suggestions.push("What are the performance benchmarks?");
  }

  // Generic follow-up questions that are always relevant
  const genericQuestions = [
    "Can you provide more details?",
    "What are the next steps?",
    "Are there any alternatives?",
    "What would you recommend?",
    "Can you explain this in simpler terms?"
  ];

  // Add 1-2 generic questions if we don't have enough specific ones
  if (suggestions.length < 3) {
    const remainingSlots = Math.min(3 - suggestions.length, genericQuestions.length);
    for (let i = 0; i < remainingSlots; i++) {
      if (!suggestions.includes(genericQuestions[i])) {
        suggestions.push(genericQuestions[i]);
      }
    }
  }

  // Limit to 4 suggestions and remove duplicates
  return [...new Set(suggestions)].slice(0, 4);
}

/**
 * Generates Japanese follow-up questions based on AI response content
 */
export function generateJapaneseFollowUpQuestions(messageContent: string): string[] {
  if (!messageContent || messageContent.trim().length === 0) {
    return [];
  }
  
  const content = messageContent.toLowerCase();
  const suggestions: string[] = [];

  // Domain analysis related questions in Japanese
  if (content.includes('domain') || content.includes('ドメイン')) {
    // Deep investigation options - prioritize these
    if (!content.includes('whois詳細') && !content.includes('登録者情報')) {
      suggestions.push("このドメインのWHOIS詳細情報を調査してください");
    }
    if (!content.includes('評判') && !content.includes('ブラックリスト')) {
      suggestions.push("このドメインの評判とブラックリスト状況を詳しく調べてください");
    }
    if (!content.includes('ssl labs') && !content.includes('ssl評価')) {
      suggestions.push("SSL証明書の詳細とSSL Labs評価を確認してください");
    }
    if (!content.includes('トラフィック') && !content.includes('アクセス数')) {
      suggestions.push("このドメインのトラフィック統計とSEO情報を調査してください");
    }
    
    if (content.includes('available') || content.includes('登録可能')) {
      suggestions.push("このドメインの登録方法と費用を教えてください");
      suggestions.push("類似ドメインの可用性も調べてください");
    }
    
    if (content.includes('登録済み') || content.includes('使用中')) {
      suggestions.push("このドメインの所有者履歴と有効期限を調べてください");
      suggestions.push("ドメインの取得可能性と推定価格を調査してください");
    }
    
    if (content.includes('ssl') || content.includes('証明書')) {
      suggestions.push("SSL実装の品質評価とセキュリティスコアを詳しく調べてください");
      suggestions.push("過去のセキュリティインシデントを調査してください");
    }
    
    if (content.includes('security') || content.includes('セキュリティ')) {
      suggestions.push("マルウェアとフィッシングの検出履歴を詳しく調べてください");
      suggestions.push("セキュリティベンダーのブラックリストを全て確認してください");
    }
    
    if (content.includes('performance') || content.includes('パフォーマンス')) {
      suggestions.push("詳細なスピードテストとサーバー応答時間を測定してください");
      suggestions.push("稼働率履歴とダウンタイム情報を調査してください");
    }
  }

  // Generic follow-up questions in Japanese
  const genericQuestions = [
    "もっと詳しく教えてください",
    "次のステップは何ですか？",
    "他に選択肢はありますか？",
    "どのような対策を推奨しますか？",
    "もう少し簡単に説明してください"
  ];

  // Add generic questions if we don't have enough specific ones
  if (suggestions.length < 3) {
    const remainingSlots = Math.min(3 - suggestions.length, genericQuestions.length);
    for (let i = 0; i < remainingSlots; i++) {
      if (!suggestions.includes(genericQuestions[i])) {
        suggestions.push(genericQuestions[i]);
      }
    }
  }

  // Limit to 4 suggestions and remove duplicates
  return [...new Set(suggestions)].slice(0, 4);
}

/**
 * Generates follow-up questions with mixed English and Japanese
 */
export function generateMixedFollowUpQuestions(messageContent: string): string[] {
  const englishQuestions = generateFollowUpQuestions(messageContent);
  const japaneseQuestions = generateJapaneseFollowUpQuestions(messageContent);
  
  // Mix questions (2 English, 2 Japanese)
  const mixed: string[] = [];
  
  if (englishQuestions.length > 0) mixed.push(englishQuestions[0]);
  if (japaneseQuestions.length > 0) mixed.push(japaneseQuestions[0]);
  if (englishQuestions.length > 1) mixed.push(englishQuestions[1]);
  if (japaneseQuestions.length > 1) mixed.push(japaneseQuestions[1]);
  
  return mixed.slice(0, 4);
}