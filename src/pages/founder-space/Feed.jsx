/**
 * Founder Space — Feed (legacy placeholder — now redirects to FeedPage)
 * Route: /founder-space/feed
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Feed() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/founder-space/feed', { replace: true });
  }, [navigate]);
  return null;
}
