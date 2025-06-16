import { useState, useEffect, useCallback } from 'react';
import type { Message } from "@langchain/langgraph-sdk";
import { duckdbManager, SearchHistoryRecord, SearchSessionSummary } from '@/lib/duckdb';

export interface UseSearchHistoryResult {
  // State
  history: SearchSessionSummary[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  saveSearch: (
    messages: Message[],
    effortLevel: string,
    modelUsed: string,
    sources?: any[]
  ) => Promise<void>;
  loadHistory: () => Promise<void>;
  searchHistory: (searchTerm: string) => Promise<SearchSessionSummary[]>;
  getSearchDetail: (id: string) => Promise<SearchHistoryRecord | null>;
  deleteSearch: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  
  // Statistics
  statistics: {
    totalSearches: number;
    domainAnalyses: number;
    recentSearches: number;
  } | null;
  loadStatistics: () => Promise<void>;
}

export function useSearchHistory(): UseSearchHistoryResult {
  const [history, setHistory] = useState<SearchSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<{
    totalSearches: number;
    domainAnalyses: number;
    recentSearches: number;
  } | null>(null);

  // Extract domain names from AI response
  const extractDomains = (response: string): string[] => {
    const domainPattern = /### ([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const domains: string[] = [];
    let match;
    
    while ((match = domainPattern.exec(response)) !== null) {
      domains.push(match[1]);
    }
    
    return domains;
  };

  // Check if response contains domain analysis
  const isDomainAnalysis = (response: string): boolean => {
    return response.includes("技術分析結果") || 
           response.includes("Technical Analysis Results") ||
           response.includes("総合スコア");
  };

  // Extract analysis results from response
  const extractAnalysisResults = (response: string): any[] => {
    // This would parse the structured domain analysis results
    // For now, return empty array - could be enhanced to parse markdown structure
    return [];
  };

  const saveSearch = useCallback(async (
    messages: Message[],
    effortLevel: string,
    modelUsed: string,
    sources: any[] = []
  ) => {
    try {
      setError(null);
      console.log('saveSearch called with:', { messagesLength: messages.length, effortLevel, modelUsed });
      
      if (messages.length < 2) {
        console.log('Not enough messages, skipping save');
        return;
      }
      
      const userMessage = messages.find(m => m.type === 'human');
      const aiMessage = messages[messages.length - 1]; // Last message should be AI response
      
      console.log('Message analysis:', {
        userMessage: userMessage ? 'found' : 'not found',
        aiMessage: aiMessage ? `found (type: ${aiMessage.type})` : 'not found'
      });
      
      if (!userMessage || !aiMessage || aiMessage.type !== 'ai') {
        console.log('Invalid message structure, skipping save');
        return;
      }
      
      const query = typeof userMessage.content === 'string' ? userMessage.content : JSON.stringify(userMessage.content);
      const response = typeof aiMessage.content === 'string' ? aiMessage.content : JSON.stringify(aiMessage.content);
      
      const domains = extractDomains(response);
      const domainAnalysis = isDomainAnalysis(response);
      const analysisResults = domainAnalysis ? extractAnalysisResults(response) : [];
      
      const record: SearchHistoryRecord = {
        id: aiMessage.id || `search_${Date.now()}`,
        query,
        timestamp: new Date().toISOString(),
        response,
        domain_analysis: domainAnalysis,
        domains,
        analysis_results: analysisResults,
        effort_level: effortLevel,
        model_used: modelUsed,
        sources
      };
      
      console.log('Saving record:', {
        id: record.id,
        query: record.query.substring(0, 50) + '...',
        responseLength: record.response.length,
        domainAnalysis: record.domain_analysis,
        domains: record.domains
      });
      
      await duckdbManager.saveSearchHistory(record);
      console.log('Record saved successfully');
      
      // Reload history after saving
      await loadHistory(50);
      console.log('History reloaded');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save search');
      console.error('Failed to save search:', err);
    }
  }, []);

  const loadHistory = useCallback(async (limit: number = 50) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const numericLimit = Number(limit) || 50;
      const historyData = await duckdbManager.getSearchHistory(numericLimit);
      setHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchHistory = useCallback(async (searchTerm: string): Promise<SearchSessionSummary[]> => {
    try {
      setError(null);
      return await duckdbManager.searchHistory(searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search history');
      console.error('Failed to search history:', err);
      return [];
    }
  }, []);

  const getSearchDetail = useCallback(async (id: string): Promise<SearchHistoryRecord | null> => {
    try {
      setError(null);
      return await duckdbManager.getSearchById(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get search detail');
      console.error('Failed to get search detail:', err);
      return null;
    }
  }, []);

  const deleteSearch = useCallback(async (id: string) => {
    try {
      setError(null);
      await duckdbManager.deleteSearchHistory(id);
      
      // Remove from local state
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete search');
      console.error('Failed to delete search:', err);
    }
  }, []);

  const clearAllHistory = useCallback(async () => {
    try {
      setError(null);
      await duckdbManager.clearAllHistory();
      setHistory([]);
      setStatistics(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear history');
      console.error('Failed to clear history:', err);
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      setError(null);
      const stats = await duckdbManager.getStatistics();
      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
      console.error('Failed to load statistics:', err);
    }
  }, []);

  // Load history and statistics on mount
  useEffect(() => {
    loadHistory(50);
    loadStatistics();
  }, []);

  return {
    history,
    isLoading,
    error,
    saveSearch,
    loadHistory,
    searchHistory,
    getSearchDetail,
    deleteSearch,
    clearAllHistory,
    statistics,
    loadStatistics
  };
}