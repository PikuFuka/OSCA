import { useState } from 'react';
import { authedUrl } from '../../core/api/client';

const initialsOf = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

type ProfilePhotoProps = {
  /** Raw backend photo path/URL (e.g. `/api/storage/profiles/x.png`), data: URL, or null */
  src?: string | null;
  name?: string;
  alt?: string;
  /** Same sizing classes you'd put on the <img> (e.g. "w-full h-full object-cover") */
  className?: string;
  eager?: boolean;
  /** Custom fallback (icon, colored initials). Defaults to an initials avatar. */
  fallback?: React.ReactNode;
};

/**
 * Senior profile photo with auth + graceful fallback.
 * Appends the session token (required by the protected photo endpoint)
 * and falls back to an initials avatar when the photo is missing or fails
 * to load (deleted file, 401/404) instead of rendering a broken icon.
 */
export const ProfilePhoto = ({ src, name = '', alt, className = 'w-full h-full object-cover', eager = false, fallback }: ProfilePhotoProps) => {
  const [failed, setFailed] = useState(false);
  const url = authedUrl(src);

  if (!url || failed) {
    if (fallback) return <>{fallback}</>;
    return (
      <div
        className={`${className} flex items-center justify-center bg-slate-100 text-slate-500 font-extrabold`}
        role="img"
        aria-label={name || 'No photo'}
      >
        {initialsOf(name)}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt ?? name}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export default ProfilePhoto;
