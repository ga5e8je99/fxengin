/**
 * @file routes.js
 * @description Centralized route resolution helper for guest vs authenticated user paths
 */

/**
 * Returns user-scoped route if authenticated (e.g. '/cmtk.../courses') or default guest route ('/courses')
 * @param {string} path - Target path (e.g. '/', '/courses', '/markets', '/analyses', '/profile', '/courses/1/learn')
 * @param {{ id?: string }|null} user - Current user object
 * @returns {string} User-scoped or guest path
 */
export function getAppRoute(path, user) {
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '/';
  
  const activeId = user?.id;

  if (activeId) {
    if (cleanPath === '/' || cleanPath === '') {
      return `/${activeId}`;
    }
    // If path already starts with the current active user ID, return as is
    if (cleanPath.startsWith(`/${activeId}/`) || cleanPath === `/${activeId}`) {
      return cleanPath;
    }
    // If path starts with any other CUID prefix, replace it with the current user ID
    const cuidPrefixMatch = cleanPath.match(/^\/c[a-z0-9]{20,32}(\/.*)?$/);
    if (cuidPrefixMatch) {
      const rest = cuidPrefixMatch[1] || '';
      return `/${activeId}${rest}`;
    }
    return `/${activeId}${cleanPath}`;
  }

  return cleanPath;
}
