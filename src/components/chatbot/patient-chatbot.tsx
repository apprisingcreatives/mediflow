"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  X,
  Send,
  User,
  Sparkles,
  FileText,
  Phone,
  HelpCircle,
  ChevronRight,
  Loader2,
  Minimize2,
  Maximize2,
  Building2,
  Bot,
} from "lucide-react";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  quickReplies?: string[];
}

const QUICK_QUESTIONS = [
  { icon: Sparkles, label: "AI Features", query: "What AI features does MediFlow offer?" },
  { icon: FileText, label: "Pricing", query: "What are the pricing plans?" },
  { icon: Building2, label: "Partner Clinics", query: "How do I register my clinic?" },
  { icon: HelpCircle, label: "How It Works", query: "How does MediFlow work?" },
  { icon: Phone, label: "Contact", query: "How can I contact MediFlow?" },
];

const BOT_RESPONSES: Record<string, { response: string; quickReplies?: string[] }> = {
  greeting: {
    response: "Hello! 👋 I'm MediFlow Assistant!\n\nI'm here to help you learn about our **AI-powered healthcare platform** for clinics:\n\n• 🤖 AI Features & Capabilities\n• 💰 Pricing Plans\n• 🏥 Partner Clinic Registration\n• 📋 How MediFlow Works\n\nHow can I assist you today?",
    quickReplies: ["AI Features", "Pricing Plans", "Register Clinic", "How It Works"],
  },
  features: {
    response: "MediFlow offers cutting-edge AI features: 🤖✨\n\n**Standard Features (All Plans):**\n✅ AI-Powered Patient Intake\n✅ Smart Appointment Scheduling\n✅ Automated Reminders\n✅ Intelligent Queue Management\n✅ Auto Follow-up Scheduling\n\n**Premium Features:**\n⭐ AI Triage & Symptom Analysis\n⭐ Predictive No-Show Detection\n⭐ AI-Generated Visit Summaries\n⭐ Voice-to-Text Documentation\n⭐ Patient Sentiment Analysis\n\nSuper admins can enable/disable features per clinic!",
    quickReplies: ["See Pricing", "Register Clinic", "Request Demo"],
  },
  pricing: {
    response: "Here are our subscription plans: 💰\n\n**🟢 Starter Plan - ₱5,000/month**\n• Up to 500 patients\n• AI intake forms\n• Basic scheduling\n• Email support\n\n**🔵 Professional Plan - ₱10,000/month** ⭐ Popular\n• Up to 2,000 patients\n• Advanced AI features\n• Smart scheduling\n• Priority support\n• Analytics dashboard\n\n**🟣 Enterprise Plan - Custom Pricing**\n• Unlimited patients\n• All AI features\n• Dedicated support\n• Custom integrations\n\nReady to transform your clinic?",
    quickReplies: ["Register Clinic", "Talk to Sales", "Request Demo"],
  },
  register: {
    response: "Register your clinic with MediFlow! 🏥\n\n**Quick Registration (4 steps):**\n\n1️⃣ **Clinic Info** - Name, contact, location\n2️⃣ **Admin Account** - Your login credentials\n3️⃣ **Services & Pricing** - Add your offerings\n4️⃣ **Choose Plan** - Select your subscription\n\n**Benefits:**\n✓ AI-powered patient management\n✓ Online booking system\n✓ Automated reminders\n✓ Analytics dashboard\n✓ Your own clinic landing page!\n\n👉 Visit /clinic/register to get started!",
    quickReplies: ["View Pricing", "AI Features", "Contact Sales"],
  },
  howItWorks: {
    response: "How MediFlow Works: 🔄\n\n**For Clinics:**\n1. 📝 Register your clinic\n2. ⚙️ Configure services & pricing\n3. 🤖 Enable AI features\n4. 🚀 Go live with your clinic page!\n\n**For Patients:**\n1. 🔍 Browse partner clinics\n2. 📅 Book appointments online\n3. 📱 Fill AI-powered intake forms\n4. ✅ Receive automated reminders\n\n**AI Features Include:**\n• Smart scheduling optimization\n• Symptom pre-assessment\n• Queue management\n• Visit summaries\n\nIt's healthcare made simple!",
    quickReplies: ["AI Features", "Register Clinic", "View Partner Clinics"],
  },
  contact: {
    response: "Contact MediFlow Team: 📬\n\n📞 **Sales:** +63 920 478 6075\n📧 **Email:** info@apprisingcreatives.com\n\n**Response Times:**\n• Phone: Immediate (business hours)\n• Email: Within 24 hours\n• Demo Request: Within 48 hours\n\n**Office Hours:**\nMonday - Friday: 8AM - 6PM\n\nWe'd love to help transform your clinic! 💙",
    quickReplies: ["Request Demo", "Register Clinic", "View Pricing"],
  },
  demo: {
    response: "Request a Demo! 🎥\n\nSee MediFlow in action with a personalized demo:\n\n**What you'll see:**\n✓ Complete platform walkthrough\n✓ AI features demonstration\n✓ Admin dashboard tour\n✓ Patient booking experience\n✓ Q&A with our team\n\n**Schedule Options:**\n• 30-min quick overview\n• 60-min deep dive\n• Custom enterprise demo\n\n📞 Call: +63 920 478 6075\n📧 Email: info@apprisingcreatives.com\n\nOr click 'Book a Demo' at the top!",
    quickReplies: ["Register Clinic", "View Pricing", "Contact Sales"],
  },
  clinics: {
    response: "Our Partner Clinics Network: 🏥\n\nMediFlow powers healthcare providers across the Philippines!\n\n**Featured Clinics:**\n• Manila Medical Center\n• Quezon City Health Clinic\n• Makati Wellness Hub\n• And more joining daily!\n\n**Each clinic gets:**\n✓ Dedicated landing page\n✓ Online booking system\n✓ AI-powered chatbot\n✓ Service & pricing display\n✓ Doctor profiles\n\n👉 Scroll down to see our partner clinics or join the network!",
    quickReplies: ["View Partner Clinics", "Register Your Clinic", "Learn More"],
  },
  default: {
    response: "Thanks for your interest in MediFlow! 🤔\n\nI can help you with:\n\n• 🤖 **AI Features** - Our smart healthcare tools\n• 💰 **Pricing** - Subscription plans\n• 🏥 **Registration** - Join as a partner clinic\n• 📋 **How It Works** - Platform overview\n• 📞 **Contact** - Reach our team\n\nWhat would you like to know more about?",
    quickReplies: ["AI Features", "Pricing", "Register Clinic", "Contact Sales"],
  },
};

function getResponseForQuery(query: string): { response: string; quickReplies?: string[] } {
  const lowerQuery = query.toLowerCase();
  
  // Greetings
  if (lowerQuery.includes("hello") || lowerQuery.includes("hi") || lowerQuery.includes("hey") || lowerQuery.includes("start") || lowerQuery.includes("help")) {
    return BOT_RESPONSES.greeting;
  }
  
  // AI Features
  if (lowerQuery.includes("ai") || lowerQuery.includes("feature") || lowerQuery.includes("capability") || lowerQuery.includes("technology") || lowerQuery.includes("smart") || lowerQuery.includes("intelligent")) {
    return BOT_RESPONSES.features;
  }
  
  // Pricing & Plans
  if (lowerQuery.includes("price") || lowerQuery.includes("pricing") || lowerQuery.includes("cost") || lowerQuery.includes("plan") || lowerQuery.includes("subscription") || lowerQuery.includes("fee") || lowerQuery.includes("how much")) {
    return BOT_RESPONSES.pricing;
  }
  
  // Registration
  if (lowerQuery.includes("register") || lowerQuery.includes("sign up") || lowerQuery.includes("join") || lowerQuery.includes("partner") || lowerQuery.includes("clinic") || lowerQuery.includes("enroll")) {
    return BOT_RESPONSES.register;
  }
  
  // How It Works
  if (lowerQuery.includes("how") || lowerQuery.includes("work") || lowerQuery.includes("process") || lowerQuery.includes("step") || lowerQuery.includes("start") || lowerQuery.includes("begin")) {
    return BOT_RESPONSES.howItWorks;
  }
  
  // Demo
  if (lowerQuery.includes("demo") || lowerQuery.includes("trial") || lowerQuery.includes("test") || lowerQuery.includes("try") || lowerQuery.includes("see")) {
    return BOT_RESPONSES.demo;
  }
  
  // Contact
  if (lowerQuery.includes("contact") || lowerQuery.includes("call") || lowerQuery.includes("phone") || lowerQuery.includes("email") || lowerQuery.includes("reach") || lowerQuery.includes("sales")) {
    return BOT_RESPONSES.contact;
  }
  
  // Partner Clinics
  if (lowerQuery.includes("partner") || lowerQuery.includes("network") || lowerQuery.includes("existing") || lowerQuery.includes("location")) {
    return BOT_RESPONSES.clinics;
  }
  
  return BOT_RESPONSES.default;
}

export function PatientChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = BOT_RESPONSES.greeting;
      setMessages([
        {
          id: "1",
          type: "bot",
          content: greeting.response,
          timestamp: new Date(),
          quickReplies: greeting.quickReplies,
        },
      ]);
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = getResponseForQuery(content);
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "bot",
      content: response.response,
      timestamp: new Date(),
      quickReplies: response.quickReplies,
    };

    setIsTyping(false);
    setMessages((prev) => [...prev, botMessage]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setHasNewMessage(false);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-500 group ${
          isOpen
            ? "bg-clinic-navy rotate-0"
            : "bg-gradient-to-br from-clinic-teal to-clinic-ai hover:scale-110 animate-bounce-gentle"
        }`}
        style={{
          animation: isOpen ? "none" : "bounce-gentle 2s ease-in-out infinite",
        }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white transition-transform duration-300" />
        ) : (
          <>
            <MessageCircle className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" />
            {hasNewMessage && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full animate-ping" />
            )}
          </>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] transition-all duration-500 transform origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
      >
        <div
          className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-clinic-navy/10 dark:border-white/10 transition-all duration-300 ${
            isMinimized ? "h-16" : "h-[550px]"
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-clinic-navy to-clinic-navy/90 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse-slow">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">MediFlow Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/70 text-xs">Online • Ready to help</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4 text-white" />
                ) : (
                  <Minimize2 className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Chat Body */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-[380px] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-clinic-bg/50 to-white dark:from-slate-900/50 dark:to-slate-800">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 animate-slide-up ${
                      message.type === "user" ? "flex-row-reverse" : ""
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === "bot"
                          ? "bg-gradient-to-br from-clinic-teal to-clinic-ai"
                          : "bg-clinic-navy"
                      }`}
                    >
                      {message.type === "bot" ? (
                        <Sparkles className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[75%] ${
                        message.type === "user" ? "text-right" : ""
                      }`}
                    >
                      <div
                        className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                          message.type === "bot"
                            ? "bg-white dark:bg-slate-700 text-clinic-navy dark:text-white shadow-sm rounded-tl-sm"
                            : "bg-gradient-to-br from-clinic-teal to-clinic-teal/90 text-white rounded-tr-sm"
                        }`}
                      >
                        {message.content}
                      </div>
                      <span className="text-xs text-clinic-text/40 dark:text-white/40 mt-1 block">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {/* Quick Replies */}
                      {message.type === "bot" && message.quickReplies && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.quickReplies.map((reply) => (
                            <button
                              key={reply}
                              onClick={() => handleQuickReply(reply)}
                              className="px-3 py-1.5 text-xs font-medium bg-clinic-teal/10 text-clinic-teal hover:bg-clinic-teal hover:text-white rounded-full transition-all duration-300 flex items-center gap-1 group"
                            >
                              {reply}
                              <ChevronRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-3 animate-slide-up">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-clinic-teal to-clinic-ai flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white dark:bg-slate-700 p-3 rounded-2xl rounded-tl-sm shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-clinic-navy/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-clinic-navy/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-clinic-navy/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              {messages.length <= 1 && (
                <div className="px-4 py-2 border-t border-clinic-navy/5 dark:border-white/5 bg-white dark:bg-slate-800">
                  <p className="text-xs text-clinic-text/50 dark:text-white/50 mb-2">Quick questions:</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q.label}
                        onClick={() => sendMessage(q.query)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-clinic-navy/5 dark:bg-white/5 hover:bg-clinic-teal/10 hover:text-clinic-teal rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300"
                      >
                        <q.icon className="w-3 h-3" />
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="p-4 border-t border-clinic-navy/5 dark:border-white/5 bg-white dark:bg-slate-800"
              >
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isTyping}
                    className="flex-1 h-11 bg-clinic-bg dark:bg-slate-700 border-0 focus-visible:ring-1 focus-visible:ring-clinic-teal"
                  />
                  <Button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="h-11 w-11 p-0 bg-clinic-teal hover:bg-clinic-teal/90 text-white disabled:opacity-50 transition-all duration-300 hover:scale-105"
                  >
                    {isTyping ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
