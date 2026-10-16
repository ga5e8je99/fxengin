'use client';
import { use } from 'react';
import LiveRoomPage from '../../../live/[idOrSlug]/page';

export default function UserLiveRoomPage({ params }) {
  const unwrapped = use(params);
  return <LiveRoomPage params={Promise.resolve({ idOrSlug: unwrapped?.idOrSlug || unwrapped?.id })} />;
}
