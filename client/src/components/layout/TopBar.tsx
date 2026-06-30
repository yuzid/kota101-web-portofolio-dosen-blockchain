import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useNavigate } from 'react-router';

interface TopBarProps {
  title?: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  staf_tu: 'Staf Tata Usaha',
  dosen: 'Dosen',
  kaprodi: 'Kaprodi',
  kajur: 'Kajur',
};

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-red-500 text-white',
  staf_tu: 'bg-blue-500 text-white',
  dosen: 'bg-green-500 text-white',
  kaprodi: 'bg-purple-500 text-white',
  kajur: 'bg-orange-500 text-white',
};

export function TopBar({ title }: TopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="fixed top-0 right-0 left-60 h-16 bg-background border-b border-border z-30">
      <div className="flex items-center justify-between h-full px-6">
        {/* Page Title */}
        <div>
          {title && <h1 className="text-xl font-semibold">{title}</h1>}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <div className="flex items-center gap-1 justify-end flex-wrap">
                {user?.roles.map((role) => (
                  <Badge key={role} className={roleBadgeColors[role]}>
                    {roleLabels[role]}
                  </Badge>
                ))}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
