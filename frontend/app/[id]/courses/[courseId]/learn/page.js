'use client';
import { use } from 'react';
import CourseLearnPlayerPage from '../../../../courses/[id]/learn/page';

export default function UserCourseLearnPage({ params }) {
  const unwrapped = typeof params?.then === 'function' ? use(params) : (params || {});
  return <CourseLearnPlayerPage params={{ id: unwrapped?.courseId || unwrapped?.id }} />;
}

