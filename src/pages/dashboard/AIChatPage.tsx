import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader, Zap, MessageSquare, Lightbulb, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  "Analyze my lead conversion trends for this quarter",
  "What's the best follow-up strategy for qualified leads?",
  "Generate a marketing email for new property listings",
  "Show me insights about my top performing campaigns",
  "Help me create a lead nurturing sequence",
  "What are the latest real estate market trends in my area?"
];

const quickActions = [
  { icon: TrendingUp, label: "Analyze Performance", prompt: "Give me a detailed analysis of my business performance this month" },
  { icon: MessageSquare, label: "Draft Email", prompt: "Help me write a follow-up email for a qualified lead interested in luxury properties" },
  { icon: Lightbulb, label: "Strategy Tips", prompt: "What are 5 actionable tips to improve my lead conversion rate?" },
  { icon: Zap, label: "Market Insights", prompt: "What are the current market trends affecting real estate in my area?" }
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI copilot for real estate success. I can help you analyze your leads, optimize campaigns, draft content, and provide strategic insights. What would you like to work on today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string = inputValue) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(content),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 2000);
  };

  const generateAIResponse = (prompt: string): string => {
    // This is a mock response - replace with actual AI integration
    const responses = {
      'analyze': "Based on your recent data, I can see your lead conversion rate has improved by 15% this quarter. Your email campaigns are performing particularly well with a 23% open rate. Here are some key insights:\n\n• Your social media leads have the highest conversion rate at 32%\n• Friday afternoon is your best time for lead follow-ups\n• Luxury property inquiries convert 40% faster than standard listings\n\nWould you like me to dive deeper into any of these areas?",
      'email': "Here's a professional follow-up email template:\n\n**Subject: Your Luxury Property Inquiry - Exclusive Listings Available**\n\nHi [Lead Name],\n\nThank you for your interest in luxury properties in [Area]. I've curated a selection of exclusive listings that match your criteria:\n\n• 4BR Modern Estate - $2.8M - Private showing available\n• Waterfront Penthouse - $3.2M - Just listed\n• Historic Mansion - $2.5M - Motivated seller\n\nI'd love to schedule a private viewing this week. What day works best for you?\n\nBest regards,\n[Your Name]",
      'tips': "Here are 5 proven strategies to boost your conversion rate:\n\n1. **Speed to Lead**: Respond within 5 minutes of inquiry (increases conversion by 400%)\n2. **Personalized Follow-up**: Reference specific property details they viewed\n3. **Value-First Approach**: Share market insights before pitching services\n4. **Multi-Channel Engagement**: Combine email, phone, and text outreach\n5. **Social Proof**: Share recent success stories and testimonials\n\nImplement these gradually and track which has the biggest impact on your conversions.",
      'market': "Current market insights for your area:\n\n📈 **Market Trends:**\n• Average home prices up 8.2% YoY\n• Inventory levels at 2.1 months (seller's market)\n• Days on market: 18 days average\n\n🏠 **Hot Segments:**\n• First-time buyer programs in high demand\n• Luxury market ($1M+) seeing 25% more activity\n• Condos/townhomes outpacing single-family\n\n💡 **Opportunities:**\n• Focus on move-up buyers (strong equity positions)\n• Highlight quick closing capabilities\n• Emphasize local market expertise"
    };

    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('analyz') || lowerPrompt.includes('performance')) return responses.analyze;
    if (lowerPrompt.includes('email') || lowerPrompt.includes('draft')) return responses.email;
    if (lowerPrompt.includes('tip') || lowerPrompt.includes('conversion')) return responses.tips;
    if (lowerPrompt.includes('market') || lowerPrompt.includes('trend')) return responses.market;

    return "I understand you're looking for help with your real estate business. I can assist with lead analysis, content creation, market insights, and strategic recommendations. Could you be more specific about what you'd like to focus on?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Copilot</h1>
          <p className="text-muted-foreground">Your intelligent assistant for real estate success</p>
        </div>
        <Badge variant="secondary" className="bg-gradient-hero text-white">
          <Bot className="w-4 h-4 mr-1" />
          AI Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Chat Interface */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                AI Chat Assistant
              </CardTitle>
              <CardDescription>
                Ask questions about your business, get insights, or request help with content
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4 mb-4" style={{ height: '400px' }}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <Loader className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your real estate business..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with Quick Actions and Suggestions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common AI assistance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => handleSendMessage(action.prompt)}
                  disabled={isLoading}
                >
                  <action.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-left">{action.label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Suggested Prompts */}
          <Card>
            <CardHeader>
              <CardTitle>Suggested Prompts</CardTitle>
              <CardDescription>Try these conversation starters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="w-full text-left text-sm p-2 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
                >
                  "{prompt}"
                </button>
              ))}
            </CardContent>
          </Card>

          {/* AI Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle>AI Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span>Data Analysis & Insights</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-green-500" />
                <span>Content Creation</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span>Strategic Recommendations</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bot className="w-4 h-4 text-purple-500" />
                <span>Process Automation</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}