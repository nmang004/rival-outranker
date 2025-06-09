import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Sample notification data
// In a real app, this would be fetched from an API
const initialNotifications = [
  {
    id: 1,
    title: "Welcome to SEO Best Practices!",
    message: "Start by analyzing your first website to get comprehensive SEO insights.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    read: false,
    type: "info"
  },
  {
    id: 2,
    title: "Profile Setup",
    message: "Complete your profile to save your analyses and track your SEO progress.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    read: false,
    type: "tip"
  },
  {
    id: 3,
    title: "Deep Content Analysis Available",
    message: "Try our new Deep Content Analysis feature to get detailed content recommendations.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    type: "feature"
  }
];

export function NotificationCenter() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(notification => !notification.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'tip':
        return 'bg-green-100 text-green-800';
      case 'feature':
        return 'bg-purple-100 text-purple-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost"
          size="icon"
          className="relative rounded-full text-muted-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary flex items-center justify-center text-[10px] text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              className="text-xs h-auto py-1 px-2 hover:bg-transparent hover:text-primary"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            <div className="py-2">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={cn(
                    "px-4 py-3 hover:bg-muted transition-colors cursor-pointer",
                    !notification.read && "bg-primary/5"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={cn("text-sm font-medium", !notification.read && "font-semibold")}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {getRelativeTime(notification.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1.5">{notification.message}</p>
                  <Badge 
                    variant="outline" 
                    className={cn("text-[10px] py-0 h-auto", getTypeStyle(notification.type))}
                  >
                    {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}