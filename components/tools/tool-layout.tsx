'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

const stageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

interface ToolLayoutProps {
  stage: 'configure' | 'processing' | 'result' | 'error';
  configure: ReactNode;
  processing: ReactNode;
  result: ReactNode;
  error: ReactNode;
  className?: string;
}

export function ToolLayout({ stage, configure, processing, result, error, className }: ToolLayoutProps) {
  return (
    <Card className={cn('max-w-4xl mx-auto overflow-hidden', className)}>
      <AnimatePresence mode="wait">
        {stage === 'configure' && (
          <motion.div key="configure" {...stageMotion}>
            {configure}
          </motion.div>
        )}
        {stage === 'processing' && (
          <motion.div key="processing" {...stageMotion}>
            {processing}
          </motion.div>
        )}
        {stage === 'result' && (
          <motion.div key="result" {...stageMotion}>
            {result}
          </motion.div>
        )}
        {stage === 'error' && (
          <motion.div key="error" {...stageMotion}>
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

interface ToolConfigureLayoutProps {
  preview: ReactNode;
  options: ReactNode;
  actions: ReactNode;
}

export function ToolConfigureLayout({ preview, options, actions }: ToolConfigureLayoutProps) {
  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0">{preview}</div>
      <aside className="flex flex-col gap-4 lg:border-l lg:border-border-default lg:pl-6">
        <div className="flex flex-col gap-4 flex-1">{options}</div>
        <div className="pt-2 border-t border-border-default">{actions}</div>
      </aside>
    </div>
  );
}
