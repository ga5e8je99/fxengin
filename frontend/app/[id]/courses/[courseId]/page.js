'use client';
import { use } from 'react';
import CourseDetailPage from '../../../courses/[id]/page';

export default function UserCourseDetailPage({ params }) {
  const unwrapped = use(params);
  return <CourseDetailPage params={Promise.resolve({ id: unwrapped?.courseId || unwrapped?.id })} />;
}
