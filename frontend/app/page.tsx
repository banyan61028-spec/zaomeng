'use client';

import { Suspense } from 'react';
import WorkflowPanel from '@/components/WorkflowPanel';

function Loading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-(--hf-bg)">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-(--hf-accent)"></div>
        <p className="text-(--hf-text-muted)">加载中...</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <WorkflowPanel />
    </Suspense>
  );
}
