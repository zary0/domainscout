import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import { useState, useEffect, useRef, useCallback } from "react";
import { ProcessedEvent } from "@/components/ActivityTimeline";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatMessagesView } from "@/components/ChatMessagesView";
import { Sidebar } from "@/components/Sidebar";
import { Search } from "lucide-react";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import type { SearchHistoryRecord } from "@/lib/duckdb";

export default function App() {
  const [processedEventsTimeline, setProcessedEventsTimeline] = useState<
    ProcessedEvent[]
  >([]);
  const [historicalActivities, setHistoricalActivities] = useState<
    Record<string, ProcessedEvent[]>
  >({});
  const [currentSearchParams, setCurrentSearchParams] = useState<{
    effort: string;
    model: string;
  } | null>(null);
  const [historicalMessages, setHistoricalMessages] = useState<Message[] | null>(null);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasFinalizeEventOccurredRef = useRef(false);
  
  // Search history hook
  const { saveSearch } = useSearchHistory();

  const thread = useStream<{
    messages: Message[];
    initial_search_query_count: number;
    max_research_loops: number;
    reasoning_model: string;
  }>({
    apiUrl: import.meta.env.DEV
      ? "http://localhost:2024"
      : "http://localhost:8123",
    assistantId: "agent",
    messagesKey: "messages",
    onFinish: (event: any) => {
      console.log(event);
    },
    onUpdateEvent: (event: any) => {
      let processedEvent: ProcessedEvent | null = null;
      if (event.extract_domains) {
        const domainCount = 
          event.extract_domains.domains_to_analyze?.length || 
          event.extract_domains.domains?.length || 
          0;
        processedEvent = {
          title: "Extracting Domains",
          data: `Found ${domainCount} domains to analyze`,
        };
      } else if (event.domain_analysis) {
        processedEvent = {
          title: "Domain Analysis",
          data: "Performing comprehensive domain analysis including security, performance, and availability checks",
        };
      } else if (event.finalize_domain_answer) {
        processedEvent = {
          title: "Finalizing Domain Report",
          data: "Compiling domain analysis results and recommendations",
        };
        hasFinalizeEventOccurredRef.current = true;
      } else if (event.generate_query) {
        processedEvent = {
          title: "Generating Search Queries",
          data: event.generate_query.query_list && Array.isArray(event.generate_query.query_list)
            ? event.generate_query.query_list.join(", ")
            : "Preparing search queries...",
        };
      } else if (event.web_research) {
        const sources = event.web_research.sources_gathered || [];
        const numSources = sources.length;
        const uniqueLabels = [
          ...new Set(sources.map((s: any) => s.label).filter(Boolean)),
        ];
        const exampleLabels = uniqueLabels.slice(0, 3).join(", ");
        processedEvent = {
          title: "Web Research",
          data: `Gathered ${numSources} sources. Related to: ${
            exampleLabels || "N/A"
          }.`,
        };
      } else if (event.reflection) {
        processedEvent = {
          title: "Reflection",
          data: event.reflection.is_sufficient
            ? "Search successful, generating final answer."
            : `Need more information, searching for ${
                event.reflection.follow_up_queries && Array.isArray(event.reflection.follow_up_queries)
                  ? event.reflection.follow_up_queries.join(", ")
                  : "additional topics"
              }`,
        };
      } else if (event.finalize_answer) {
        processedEvent = {
          title: "Finalizing Answer",
          data: "Composing and presenting the final answer.",
        };
        hasFinalizeEventOccurredRef.current = true;
      }
      if (processedEvent) {
        setProcessedEventsTimeline((prevEvents) => [
          ...prevEvents,
          processedEvent!,
        ]);
      }
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [thread.messages]);

  useEffect(() => {
    if (
      hasFinalizeEventOccurredRef.current &&
      !thread.isLoading &&
      thread.messages.length > 0
    ) {
      const lastMessage = thread.messages[thread.messages.length - 1];
      if (lastMessage && lastMessage.type === "ai" && lastMessage.id) {
        setHistoricalActivities((prev) => ({
          ...prev,
          [lastMessage.id!]: [...processedEventsTimeline],
        }));
        
        // Save search to history
        if (currentSearchParams) {
          console.log('Attempting to save search to history:', {
            messagesLength: thread.messages.length,
            lastMessageId: lastMessage.id,
            effort: currentSearchParams.effort,
            model: currentSearchParams.model
          });
          saveSearch(
            thread.messages,
            currentSearchParams.effort,
            currentSearchParams.model,
            [] // sources - could be extracted from processedEventsTimeline
          ).then(() => {
            console.log('Search saved successfully');
          }).catch((error) => {
            console.error('Failed to save search:', error);
          });
        } else {
          console.log('No currentSearchParams, skipping save');
        }
      }
      hasFinalizeEventOccurredRef.current = false;
    }
  }, [thread.messages, thread.isLoading, processedEventsTimeline, currentSearchParams, saveSearch]);

  const handleSubmit = useCallback(
    (submittedInputValue: string, effort: string, model: string) => {
      if (!submittedInputValue.trim()) return;
      setProcessedEventsTimeline([]);
      hasFinalizeEventOccurredRef.current = false;
      
      // Clear history viewing mode when starting a new search
      setIsViewingHistory(false);
      setHistoricalMessages(null);
      
      // Store current search parameters for history saving
      setCurrentSearchParams({ effort, model });

      // convert effort to, initial_search_query_count and max_research_loops
      // low means max 1 loop and 1 query
      // medium means max 3 loops and 3 queries
      // high means max 10 loops and 5 queries
      let initial_search_query_count = 0;
      let max_research_loops = 0;
      switch (effort) {
        case "low":
          initial_search_query_count = 1;
          max_research_loops = 1;
          break;
        case "medium":
          initial_search_query_count = 3;
          max_research_loops = 3;
          break;
        case "high":
          initial_search_query_count = 5;
          max_research_loops = 10;
          break;
      }

      const newMessages: Message[] = [
        ...(thread.messages || []),
        {
          type: "human",
          content: submittedInputValue,
          id: Date.now().toString(),
        },
      ];
      thread.submit({
        messages: newMessages,
        initial_search_query_count: initial_search_query_count,
        max_research_loops: max_research_loops,
        reasoning_model: model,
      });
    },
    [thread]
  );

  const handleCancel = useCallback(() => {
    thread.stop();
    window.location.reload();
  }, [thread]);

  // Handle selecting a search from history
  const handleSelectSearch = useCallback((record: SearchHistoryRecord) => {
    // Clear current timeline and activities
    setProcessedEventsTimeline([]);
    setHistoricalActivities({});
    hasFinalizeEventOccurredRef.current = false;
    
    // Display the historical search in the chat without triggering a new search
    const userMessage: Message = {
      type: "human",
      content: record.query,
      id: `${record.id}_user`,
    };
    
    const aiMessage: Message = {
      type: "ai", 
      content: record.response,
      id: record.id,
    };
    
    // Set historical messages and switch to history viewing mode  
    setHistoricalMessages([userMessage, aiMessage]);
    setIsViewingHistory(true);
    
    // Set up historical activities for this search if we have the data
    if (record.id) {
      setHistoricalActivities({
        [record.id]: [] // Historical activities would be loaded here if stored
      });
    }
  }, []);

  // Handle reloading a search (re-running the query)
  const handleReloadSearch = useCallback((query: string, effortLevel: string, modelUsed: string) => {
    // Clear history viewing mode when reloading a search
    setIsViewingHistory(false);
    setHistoricalMessages(null);
    handleSubmit(query, effortLevel, modelUsed);
  }, [handleSubmit]);

  // Handle follow-up question suggestions
  const handleSuggestionClick = useCallback((suggestion: string) => {
    // Clear history viewing mode when clicking suggestions
    setIsViewingHistory(false);
    setHistoricalMessages(null);
    // Use default settings for follow-up questions
    handleSubmit(suggestion, "medium", "gemini-2.5-flash-preview-04-17");
  }, [handleSubmit]);

  // Determine which messages to display and loading state
  const currentMessages = isViewingHistory ? historicalMessages || [] : thread.messages;
  const currentIsLoading = isViewingHistory ? false : thread.isLoading;
  const hasMessages = currentMessages.length > 0;

  return (
    <div className="flex h-screen bg-neutral-800 text-neutral-100 font-sans antialiased">
      <main className="flex-1 flex flex-col overflow-hidden max-w-5xl mx-auto w-full relative">
        {/* Header for chat view */}
        {hasMessages && (
          <header className="border-b border-neutral-700/50 bg-neutral-800/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Search className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-neutral-100">
                    Domain<span className="text-blue-400">Scout</span>
                  </h1>
                  <p className="text-xs text-neutral-400">
                    AIドメイン分析エージェント
                    {isViewingHistory && <span className="ml-2 text-yellow-400">(履歴表示)</span>}
                  </p>
                </div>
              </div>
              <div className="text-xs text-neutral-500">
                {currentIsLoading && (
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Analyzing...</span>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}
        
        <div
          className={`flex-1 overflow-y-auto ${
            !hasMessages ? "flex" : ""
          }`}
        >
          {!hasMessages ? (
            <WelcomeScreen
              handleSubmit={handleSubmit}
              isLoading={currentIsLoading}
              onCancel={handleCancel}
            />
          ) : (
            <ChatMessagesView
              messages={currentMessages}
              isLoading={currentIsLoading}
              scrollAreaRef={scrollAreaRef}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              liveActivityEvents={processedEventsTimeline}
              historicalActivities={historicalActivities}
              onSuggestionClick={handleSuggestionClick}
            />
          )}
        </div>
      </main>
      
      {/* Sidebar with Search History */}
      <Sidebar
        onSelectSearch={handleSelectSearch}
        onReloadSearch={handleReloadSearch}
      />
    </div>
  );
}