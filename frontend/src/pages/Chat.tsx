import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Bot, User, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useGetAllSlots, useGetAllTasks } from '../hooks/useQueries';
import { callGeminiApi, type ConversationTurn } from '../utils/geminiChat';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import type { ChatMessage } from '../backend';

function formatTimestamp(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === 'user';
  const lines = message.content.split('\n');

  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-primary' : 'bg-sidebar'}`}>
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-sidebar-foreground" />
        )}
      </div>
      <div className={`max-w-[75%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm bg-card border border-border text-foreground'
          }`}
        >
          {lines.map((line, i) => (
            <p key={i} className={line === '' ? 'h-2' : ''}>
              {renderContent(line)}
            </p>
          ))}
        </div>
        <span className="text-xs text-muted-foreground px-1">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar">
        <Bot className="h-4 w-4 text-sidebar-foreground" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-typing-1" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-typing-2" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-typing-3" />
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  // Conversation history for Gemini context (role/text pairs)
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { geminiApiKey } = useUser();
  const { data: slots = [] } = useGetAllSlots();
  const { data: tasks = [] } = useGetAllTasks();

  // Auto-scroll on new messages or typing indicator
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping || !geminiApiKey) return;
    setInput('');

    // Add user message to local state immediately
    const userMsg: ChatMessage = {
      id: BigInt(Date.now()),
      sender: 'user',
      content: text,
      timestamp: BigInt(Date.now()) * BigInt(1_000_000),
    };
    setLocalMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Call Gemini API directly — no ICP canister involved
      const aiText = await callGeminiApi(geminiApiKey, text, conversationHistory, slots, tasks);

      // Update conversation history for future context
      setConversationHistory((prev) => [
        ...prev,
        { role: 'user', text },
        { role: 'model', text: aiText },
      ]);

      // Add AI response to local state
      const aiMsg: ChatMessage = {
        id: BigInt(Date.now() + 1),
        sender: 'assistant',
        content: aiText,
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
      };
      setLocalMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Unknown error';
      const errorMsg: ChatMessage = {
        id: BigInt(Date.now() + 1),
        sender: 'assistant',
        content: `⚠️ Error: ${errorText}. Please check your Gemini API key and try again.`,
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
      };
      setLocalMessages((prev) => [...prev, errorMsg]);
      toast.error('Failed to get AI response');
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setLocalMessages([]);
    setConversationHistory([]);
    toast.success('Chat cleared');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar">
            <Bot className="h-5 w-5 text-sidebar-foreground" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-foreground">AI Assistant</h1>
            <p className="text-xs text-muted-foreground">
              {geminiApiKey ? 'Powered by Gemini 2.5 Flash' : 'Add your Gemini API key to start chatting'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="gap-2 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Clear Chat</span>
        </Button>
      </div>

      {/* No API key banner */}
      {!geminiApiKey && (
        <div className="px-6 pt-4">
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-300">Gemini API Key Required</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              To chat with the AI assistant, please add your Gemini API key in the{' '}
              <strong>sidebar</strong> on the left. Your key is stored locally and never sent to our servers.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef as React.RefObject<HTMLDivElement>}>
        <div className="space-y-4 pb-2">
          {localMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sidebar mb-4">
                <Bot className="h-8 w-8 text-sidebar-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {geminiApiKey
                  ? 'Ask me about your schedule, upcoming assignments, or get study tips!'
                  : 'Add your Gemini API key in the sidebar to enable AI chat.'}
              </p>
              {geminiApiKey && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {["What's my schedule today?", "What tasks are due soon?", "Give me a study tip"].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            localMessages.map((msg) => (
              <MessageBubble key={String(msg.id)} message={msg} />
            ))
          )}
          {isTyping && <TypingIndicator />}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border bg-card px-6 py-4">
        <div className="flex gap-3">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              geminiApiKey
                ? 'Ask about your schedule, tasks, or study tips...'
                : 'Add your Gemini API key in the sidebar to chat...'
            }
            disabled={isTyping || !geminiApiKey}
            className="flex-1 rounded-xl border-border bg-background"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping || !geminiApiKey}
            size="icon"
            className="rounded-xl shrink-0"
          >
            {isTyping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
