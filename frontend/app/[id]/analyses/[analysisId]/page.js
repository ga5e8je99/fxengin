'use client';
import { use } from 'react';
import AnalysisDetailPage from '../../../analyses/[id]/page';

export default function UserAnalysisDetailPage({ params }) {
  const unwrapped = use(params);
  return <AnalysisDetailPage params={Promise.resolve({ id: unwrapped?.analysisId || unwrapped?.id })} />;
}
