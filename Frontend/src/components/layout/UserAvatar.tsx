import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface UserAvatarProps {
  name?: string;
  email?: string;
  avatar_url?: string;
  size?: "sm" | "md";
  showMenu?: boolean;
  onLogout?: () => void;
}

const SIZE_CLASSES = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
} as const;

/**
 * UserAvatar Component
 * 
 * Displays user avatar with optional dropdown menu.
 * 
 * Features:
 * - Avatar with fallback initials
 * - Optional popover menu
 * - Profile and logout actions
 */
const UserAvatar = memo(function UserAvatar({
  name,
  email,
  avatar_url,
  size = "md",
  showMenu = false,
  onLogout,
}: UserAvatarProps) {
  const fallback = useMemo(() => name?.charAt(0).toUpperCase() ?? "U", [name]);
  const sizeClass = SIZE_CLASSES[size];
  const avatarAlt = name ? `${name}'s avatar` : "User avatar";

  // If no menu needed, return simple avatar
  if (!showMenu) {
    return (
      <Avatar className={sizeClass} role="img" aria-label={avatarAlt}>
        <AvatarImage src={avatar_url} alt={avatarAlt} />
        <AvatarFallback aria-hidden="true">{fallback}</AvatarFallback>
      </Avatar>
    );
  }

  // Return avatar with popover menu
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="User menu"
          className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
        >
          <Avatar className={`${sizeClass} cursor-pointer`} role="img" aria-label={avatarAlt}>
            <AvatarImage src={avatar_url} alt={avatarAlt} />
            <AvatarFallback aria-hidden="true">{fallback}</AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-56 p-2" role="menu" aria-label="User menu">
        {/* User Info */}
        <div className="px-2 py-1.5" role="none">
          <p className="text-sm font-medium">{name || "User"}</p>
          <p className="text-xs text-muted-foreground truncate" title={email}>
            {email}
          </p>
        </div>

        <div className="my-2 h-px bg-border" role="separator" />

        {/* Actions */}
        <div className="flex flex-col gap-1" role="group">
          <Link to="/profile" role="menuitem">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              aria-label="View profile"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              Profile
            </Button>
          </Link>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-red-600 hover:text-red-700"
            onClick={onLogout}
            role="menuitem"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
});

UserAvatar.displayName = "UserAvatar";

export default UserAvatar;