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

const UserAvatar = ({
  name,
  email,
  avatar_url,
  size = "md",
  showMenu = false,
  onLogout,
}: UserAvatarProps) => {
  const fallback = name?.charAt(0).toUpperCase() ?? "U";
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  // If no menu needed, return simple avatar
  if (!showMenu) {
    return (
      <Avatar className={sizeClass}>
        <AvatarImage src={avatar_url} alt={name} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
    );
  }

  // Return avatar with popover menu
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button aria-label="User menu">
          <Avatar className={`${sizeClass} cursor-pointer`}>
            <AvatarImage src={avatar_url} alt={name} />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-56 p-2">
        {/* User Info */}
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {email}
          </p>
        </div>

        <div className="my-2 h-px bg-border" />

        {/* Actions */}
        <div className="flex flex-col gap-1">
          <Link to="/profile">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
          </Link>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-red-600"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserAvatar;