import { Suspense } from 'react';
import PipelinePage from '@/components/pipelines/PipelinePage';

export default function ActionTransferPipelinePage() {
  return (
    <Suspense fallback={null}>
      <PipelinePage
        pipeline="action_transfer"
        title="动作复刻"
        subtitle="用参考图片和动作视频生成角色动作复刻结果"
      />
    </Suspense>
  );
}
