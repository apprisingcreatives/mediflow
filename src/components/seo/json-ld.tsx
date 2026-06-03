import React from 'react';

export function JsonLdSchema() {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://mediflow.ai/#organization',
    'name': 'MediFlow',
    'url': 'https://mediflow.ai',
    'logo': {
      '@type': 'ImageObject',
      'url': 'https://mediflow.ai/icon.png',
      'width': '192',
      'height': '192'
    },
    'sameAs': [
      'https://facebook.com/mediflow.ai',
      'https://linkedin.com/company/mediflow'
    ]
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': 'https://mediflow.ai/#software',
    'name': 'MediFlow',
    'operatingSystem': 'All',
    'applicationCategory': 'MedicalBusinessApplication',
    'offers': {
      '@type': 'AggregateOffer',
      'priceCurrency': 'PHP',
      'lowPrice': '5000',
      'highPrice': '10000',
      'offerCount': '2',
      'offers': [
        {
          '@type': 'Offer',
          'name': 'Basic Plan',
          'price': '5000.00',
          'priceCurrency': 'PHP',
          'priceModel': 'Subscription',
          'unitText': 'month'
        },
        {
          '@type': 'Offer',
          'name': 'AI Professional Plan',
          'price': '10000.00',
          'priceCurrency': 'PHP',
          'priceModel': 'Subscription',
          'unitText': 'month'
        }
      ]
    }
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': 'https://mediflow.ai/#product',
    'name': 'MediFlow AI-Powered Clinic Operations Platform',
    'description': 'The AI-powered operating system for modern clinics. Streamline patient management, automate scheduling, generate AI consultation notes, and recover lost revenue.',
    'brand': {
      '@type': 'Brand',
      'name': 'MediFlow'
    },
    'offers': {
      '@type': 'AggregateOffer',
      'priceCurrency': 'PHP',
      'lowPrice': '5000',
      'highPrice': '10000',
      'offerCount': '2'
    }
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'What is clinic management software?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Clinic management software is a digital platform designed to streamline medical practice operations. MediFlow acts as an AI-powered operating system, managing patient intake, intelligent scheduling, electronic medical records (EMR), automated reminders, billing, and clinical documentation in one place.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How does MediFlow reduce no-shows?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'MediFlow reduces patient no-shows by using an automated multi-step reminder engine via SMS and email. When appointments are booked, patients receive confirmations and timely reminders (24 hours and 2 hours before). If a patient cancels, the system automatically runs a rebooking logic, proposing alternative slots to keep the clinic schedule optimized.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Is MediFlow suitable for small clinics?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes, MediFlow is fully customizable and ideal for single-practitioner practices, dental offices, dermatology clinics, pediatricians, and larger multi-doctor medical centers. It simplifies admin workloads, meaning a clinic can operate seamlessly even with limited administrative staff.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Can multiple doctors use MediFlow?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes. MediFlow supports multi-doctor scheduling and branch configurations. Each doctor has their own secure calendar, customized consultation workflows, and personal credentials, while administrators maintain central oversight.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Is my patient data secure?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Security is our highest priority. MediFlow is built on top of secure database architectures with Default Row Level Security (RLS) enabled. It complies with HIPAA, GDPR, and local privacy guidelines to ensure all electronic health records and personal information are encrypted in transit and at rest.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Can I migrate from paper records?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes. MediFlow offers easy migration assistants and CSV import formats. Our support team can assist you in uploading your current patient rosters, and our AI scanner can digitize text directly from scanned intake documents and PDF records.'
        }
      },
      {
        '@type': 'Question',
        'name': 'What AI features are included?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'The AI Professional plan includes AI-powered features such as automated consultation summaries, AI medical notes formatting, predictive clinic analytics, custom patient follow-up recommendations, and automated transcription of clinical interactions.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Does MediFlow work on mobile devices?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Absolutely. MediFlow is built with a mobile-first responsive design. Doctors, staff, and patients can access schedules, intake forms, and records cleanly on any smartphone, tablet, or desktop computer.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How much does MediFlow cost?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'MediFlow offers two transparent pricing tiers: the Basic Plan at PHP 5,000/month for core operations, and the AI Professional Plan at PHP 10,000/month for advanced AI-driven features. Enterprise custom pricing is also available for medical groups and multi-branch networks.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Can I book a live demo?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes. You can schedule a live 1-on-1 demo with our product specialist to walk through how MediFlow can be customized to your clinic\'s exact workflows and how it will reduce your operational overhead.'
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
