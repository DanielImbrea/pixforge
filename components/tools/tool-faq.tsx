'use client';

import { useState } from 'react';
import type { FaqItem } from '@/types';

export function ToolFaq({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border-default border border-border-default rounded-lg">
      {items.map((item, index) => (
        <div key={item.question} className="p-4">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <span className="text-sm font-medium text-text-primary">{item.question}</span>
            <span className="text-text-tertiary">{openIndex === index ? '−' : '+'}</span>
          </button>
          {openIndex === index && <p className="mt-2 text-sm text-text-secondary">{item.answer}</p>}
        </div>
      ))}
    </div>
  );
}
