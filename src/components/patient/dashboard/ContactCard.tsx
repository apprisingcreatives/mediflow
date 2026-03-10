'use client';

import { Phone, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ContactCardProps {
  phoneNumber?: string;
}

export function ContactCard({ phoneNumber = '(123) 456-7890' }: ContactCardProps) {
  return (
    <Card className="border-0 shadow-glass bg-gradient-to-br from-clinic-navy to-clinic-navy/90 text-white">
      <CardContent className="p-6">
        <h3 className="font-display font-semibold mb-4">Need Help?</h3>
        <div className="space-y-3">
          <a
            href={`tel:${phoneNumber.replace(/\D/g, '')}`}
            className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Phone className="w-5 h-5 text-clinic-teal" />
            <div>
              <p className="text-sm font-medium">Call Us</p>
              <p className="text-xs text-white/60">{phoneNumber}</p>
            </div>
          </a>
          <button className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors w-full text-left">
            <MessageSquare className="w-5 h-5 text-clinic-ai" />
            <div>
              <p className="text-sm font-medium">Live Chat</p>
              <p className="text-xs text-white/60">Available 24/7</p>
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ContactCard;
