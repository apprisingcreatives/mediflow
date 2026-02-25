'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Message } from './types';
import { MOCK_MESSAGES } from './utils';

interface MessagesCardProps {
  messages?: Message[];
}

export function MessagesCard({ messages = MOCK_MESSAGES }: MessagesCardProps) {
  return (
    <Card className="border-0 shadow-glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg font-semibold text-clinic-navy dark:text-white">
          Messages
        </CardTitle>
        <Button variant="ghost" size="icon">
          <Plus className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <Button variant="outline" className="w-full mt-2">
          View All Messages
        </Button>
      </CardContent>
    </Card>
  );
}

interface MessageItemProps {
  message: Message;
}

function MessageItem({ message }: MessageItemProps) {
  return (
    <div
      className={cn(
        'p-3 rounded-xl cursor-pointer transition-colors',
        message.unread
          ? 'bg-clinic-ai/5 dark:bg-clinic-ai/10'
          : 'hover:bg-clinic-bg/50 dark:hover:bg-slate-700/50'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          {message.avatar ? <AvatarImage src={message.avatar} /> : null}
          <AvatarFallback className="bg-clinic-navy/10 dark:bg-white/10">
            {message.from[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4
              className={cn(
                'text-sm',
                message.unread
                  ? 'font-semibold text-clinic-navy dark:text-white'
                  : 'font-medium text-clinic-text/80 dark:text-white/80'
              )}
            >
              {message.from}
            </h4>
            {message.unread && <span className="w-2 h-2 bg-clinic-ai rounded-full" />}
          </div>
          <p className="text-sm text-clinic-text/60 dark:text-white/60 truncate">
            {message.preview}
          </p>
          <p className="text-xs text-clinic-text/40 dark:text-white/40 mt-1">
            {message.time}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MessagesCard;
