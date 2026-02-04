"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Clock,
  Calendar,
  FileText,
  Phone,
  HelpCircle,
  ChevronRight,
  Loader2,
  Minimize2,
  Maximize2,
  Building2,
  Stethoscope,
  MapPin,
} from "lucide-react";
import { ClinicWithDetails } from "@/types/database";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
}

interface Practitioner {
  id: string;
  name: string;
  specialization: string | null;
}



interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  quickReplies?: string[];
}

interface ClinicChatbotProps {
  clinic: ClinicWithDetails;
}

export function ClinicChatbot({ clinic }: ClinicChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const QUICK_QUESTIONS = [
    { icon: Calendar, label: "Book Appointment", query: "How do I book an appointment?" },
    { icon: Stethoscope, label: "Services", query: "What services do you offer?" },
    { icon: Clock, label: "Clinic Hours", query: "What are your clinic hours?" },
    { icon: Phone, label: "Contact", query: "How can I contact the clinic?" },
  ];

  // Generate clinic-specific responses
  const getClinicResponse = (query: string): { response: string; quickReplies?: string[] } => {
    const lowerQuery = query.toLowerCase();

    // Greeting
    if (lowerQuery.includes("hello") || lowerQuery.includes("hi") || lowerQuery.includes("hey") || lowerQuery.includes("help")) {
      return {
        response: `Hello! 👋 Welcome to ${clinic.name}!\n\nI'm your AI assistant and I'm here to help you with:\n\n• Booking appointments\n• Service information & pricing\n• Doctor availability\n• Clinic location & contact\n\nHow can I assist you today?`,
        quickReplies: ["View services", "Book appointment", "Contact clinic", "Clinic hours"],
      };
    }

    // Services
    if (lowerQuery.includes("service") || lowerQuery.includes("offer") || lowerQuery.includes("treatment") || lowerQuery.includes("available")) {
      const servicesList = clinic.clinic_services?.map((s) => `• ${s.name} - ₱${s.price.toLocaleString()} (${s.duration_minutes} min)`)
        .join("\n");

      return {
        response: `Here are the services we offer at ${clinic.name}: 🏥\n\n${servicesList || "No services listed yet."}\n\nWould you like to book any of these services?`,
        quickReplies: clinic.clinic_services?.slice(0, 3).map((s) => `Book ${s.name}`),
      };
    }

    // Pricing
    if (lowerQuery.includes("price") || lowerQuery.includes("cost") || lowerQuery.includes("fee") || lowerQuery.includes("how much")) {
      const priceList = clinic.clinic_services
        ?.map((s) => `• ${s.name}: ₱${s.price.toLocaleString()}`)
        .join("\n");

      return {
        response: `Here's our pricing at ${clinic.name}: 💰\n\n${priceList || "Pricing information coming soon."}\n\n**Payment Options:**\n✓ Cash\n✓ Credit/Debit Cards\n✓ GCash/Maya\n✓ Insurance`,
        quickReplies: ["Book appointment", "Insurance accepted", "Contact for details"],
      };
    }

    // Doctors
    if (lowerQuery.includes("doctor") || lowerQuery.includes("physician") || lowerQuery.includes("specialist") || lowerQuery.includes("who")) {
      const doctorsList = clinic.practitioners
        ?.map((p) => `• ${p.name}${p.specialization ? ` - ${p.specialization}` : ""}`)
        .join("\n");

      return {
        response: `Meet our medical team at ${clinic.name}: 👨‍⚕️👩‍⚕️\n\n${doctorsList || "Doctor information coming soon."}\n\nWould you like to book with a specific doctor?`,
        quickReplies: clinic.practitioners?.slice(0, 3).map((p) => `Book with ${p.name.split(" ")[0]}`),
      };
    }

    // Appointment / Booking
    if (lowerQuery.includes("appointment") || lowerQuery.includes("book") || lowerQuery.includes("schedule") || lowerQuery.includes("reserve")) {
      return {
        response: `Great! Let me help you book an appointment at ${clinic.name}! 📅\n\n**Booking Options:**\n\n1. 🖥️ **Online** - Use our booking system above\n2. 📞 **Phone** - Call ${clinic.phone || "us directly"}\n3. 📧 **Email** - ${clinic.email}\n\n**Available Services:**\n${clinic.clinic_services?.slice(0, 3).map((s) => `• ${s.name}`).join("\n")}\n\nWhich service would you like to book?`,
        quickReplies: ["View all services", "Call clinic", "Email us"],
      };
    }

    // Hours
    if (lowerQuery.includes("hour") || lowerQuery.includes("open") || lowerQuery.includes("close") || lowerQuery.includes("when")) {
      return {
        response: `Here are our clinic hours at ${clinic.name}: 🕐\n\n**Weekdays**\n• Monday - Friday: 8:00 AM - 6:00 PM\n\n**Weekend**\n• Saturday: 8:00 AM - 12:00 PM\n• Sunday: Closed\n\n📍 **Location:** ${clinic.address ? `${clinic.address}, ${clinic.city}` : clinic.city || "Contact us for location"}\n\n💡 We recommend booking an appointment to minimize wait time!`,
        quickReplies: ["Book appointment", "Get directions", "Contact us"],
      };
    }

    // Contact
    if (lowerQuery.includes("contact") || lowerQuery.includes("call") || lowerQuery.includes("phone") || lowerQuery.includes("email") || lowerQuery.includes("reach")) {
      return {
        response: `Here's how to reach ${clinic.name}: 📬\n\n${clinic.phone ? `📞 **Phone:** ${clinic.phone}` : ""}\n📧 **Email:** ${clinic.email}\n${clinic.address ? `📍 **Address:** ${clinic.address}${clinic.city ? `, ${clinic.city}` : ""}` : ""}\n\nOur friendly staff is ready to assist you! 😊`,
        quickReplies: ["Book appointment", "Clinic hours", "View services"],
      };
    }

    // Location
    if (lowerQuery.includes("location") || lowerQuery.includes("address") || lowerQuery.includes("where") || lowerQuery.includes("direction") || lowerQuery.includes("map")) {
      return {
        response: `Find us at ${clinic.name}: 📍\n\n**Address:**\n${clinic.address || "Address not specified"}\n${clinic.city || ""}\n\n**Getting Here:**\n• Parking available\n• Near public transportation\n\nNeed directions? Feel free to contact us!`,
        quickReplies: ["Contact clinic", "Book appointment", "Clinic hours"],
      };
    }

    // Insurance
    if (lowerQuery.includes("insurance") || lowerQuery.includes("hmo") || lowerQuery.includes("philhealth") || lowerQuery.includes("coverage")) {
      return {
        response: `Insurance information for ${clinic.name}: 💳\n\n**Accepted Insurance:**\n✓ PhilHealth\n✓ Maxicare\n✓ Medicard\n✓ Intellicare\n✓ Pacific Cross\n\n**What to bring:**\n• Valid insurance card\n• Valid ID\n• Pre-authorization (if required)\n\nContact us to verify your specific coverage!`,
        quickReplies: ["Contact billing", "Book appointment", "Payment options"],
      };
    }

    // Specific service booking (check if query mentions any service)
    const mentionedService = clinic.clinic_services?.find((s) =>
      lowerQuery.includes(s.name.toLowerCase())
    );
    if (mentionedService) {
      return {
        response: `Great choice! Here are the details for **${mentionedService.name}**: ✨\n\n💰 **Price:** ₱${mentionedService.price.toLocaleString()}\n⏱️ **Duration:** ${mentionedService.duration_minutes} minutes\n${mentionedService.description ? `📋 **Description:** ${mentionedService.description}` : ""}\n\nReady to book this service?`,
        quickReplies: ["Book now", "View other services", "Contact for questions"],
      };
    }

    // Default response
    return {
      response: `Thanks for your question! 🤔\n\nI'm here to help you with anything related to ${clinic.name}:\n\n• **Services & Pricing** - View what we offer\n• **Appointments** - Book your visit\n• **Doctors** - Meet our team\n• **Location & Hours** - Find us\n\nHow can I assist you?`,
      quickReplies: ["View services", "Book appointment", "Contact clinic", "Talk to staff"],
    };
  };

  // Initialize with greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getClinicResponse("hello");
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
  }, [isOpen, messages.length, clinic.name]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input
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

    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 800));

    const response = getClinicResponse(content);
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

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setIsMinimized(false);
        }}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-500 group ${
          isOpen
            ? "bg-clinic-navy rotate-0"
            : "bg-gradient-to-br from-clinic-teal to-clinic-ai hover:scale-110"
        }`}
        style={{
          animation: isOpen ? "none" : "bounce-gentle 2s ease-in-out infinite",
        }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-7 h-7 text-white" />
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
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm truncate max-w-[180px]">
                  {clinic.name}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/70 text-xs">AI Assistant</span>
                </div>
              </div>
            </div>
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

                    <div className={`max-w-[75%] ${message.type === "user" ? "text-right" : ""}`}>
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

                      {message.type === "bot" && message.quickReplies && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.quickReplies.map((reply) => (
                            <button
                              key={reply}
                              onClick={() => sendMessage(reply)}
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
                    placeholder="Ask about our clinic..."
                    disabled={isTyping}
                    className="flex-1 h-11 bg-clinic-bg dark:bg-slate-700 border-0 focus-visible:ring-1 focus-visible:ring-clinic-teal"
                  />
                  <Button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="h-11 w-11 p-0 bg-clinic-teal hover:bg-clinic-teal/90 text-white disabled:opacity-50"
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

      <style jsx global>{`
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
