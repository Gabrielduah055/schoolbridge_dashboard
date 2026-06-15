export type IconName =
  | 'home'
  | 'students'
  | 'parents'
  | 'teachers'
  | 'classes'
  | 'brain'
  | 'announcements'
  | 'mail'
  | 'chat'
  | 'handover'
  | 'channels'
  | 'wallet'
  | 'report'
  | 'attendance'
  | 'exam'
  | 'events'
  | 'complaints'
  | 'ai'
  | 'analytics'
  | 'settings'
  | 'bell'
  | 'search'
  | 'arrowUp'
  | 'upload'
  | 'bot'
  | 'clock'
  | 'message'
  | 'more'
  | 'send'
  | 'megaphone'
  | 'userPlus'
  | 'check'
  | 'file'
  | 'money'
  | 'warning';

export interface NavigationItem {
  label: string;
  icon: IconName;
  path: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: 'Overview', icon: 'home', path: '/' },
  { label: 'Conversations', icon: 'chat', path: '/conversations' },
  { label: 'Handover Queue', icon: 'handover', path: '/handover-queue' },
  { label: 'Broadcasts', icon: 'megaphone', path: '/broadcasts' },
  { label: 'Students', icon: 'students', path: '/students' },
  { label: 'Parents', icon: 'parents', path: '/parents' },
  { label: 'Teachers', icon: 'teachers', path: '/teachers' },
  { label: 'Classes', icon: 'classes', path: '/classes' },
  { label: 'Knowledge Base', icon: 'brain', path: '/knowledge-base' },
  { label: 'Channels', icon: 'channels', path: '/channels' },
  { label: 'Settings', icon: 'settings', path: '/settings' }
];

export const ICON_PATHS: Record<IconName, string> = {
  home: 'M3 11.5 12 4l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z',
  students: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  parents: 'M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM18 8h4M20 6v4M19 14a3 3 0 0 1 3 3v4',
  teachers: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  classes: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16H4V5ZM8 7h8M8 11h8M8 15h4M3 21h18',
  brain: 'M9.5 2.75A3.75 3.75 0 0 0 6 6.5v.2A3.5 3.5 0 0 0 3.5 12c0 1.25.66 2.35 1.65 2.96A3.75 3.75 0 0 0 9 21h.5V2.75ZM14.5 2.75A3.75 3.75 0 0 1 18 6.5v.2A3.5 3.5 0 0 1 20.5 12c0 1.25-.66 2.35-1.65 2.96A3.75 3.75 0 0 1 15 21h-.5V2.75ZM9.5 7.5H8a2 2 0 0 0-2 2M9.5 14.5H8.25A2.25 2.25 0 0 0 6 16.75M14.5 7.5H16a2 2 0 0 1 2 2M14.5 14.5h1.25A2.25 2.25 0 0 1 18 16.75',
  announcements: 'M3 11v2a2 2 0 0 0 2 2h2l4 4v-4h4l6 3V6l-6 3H5a2 2 0 0 0-2 2Z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 3 8 6 8-6',
  chat: 'M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8ZM8 10h.01M12 10h.01M16 10h.01',
  handover: 'M8 7h8M8 11h5M7 19l-4 3V6a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v2M16 17l2 2 4-4M15 21a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z',
  channels: 'M4 12a8 8 0 0 1 8-8M4 12a8 8 0 0 0 8 8M4 12h16M12 4a8 8 0 0 1 8 8M12 20a8 8 0 0 0 8-8M8 8h8M8 16h8',
  wallet: 'M20 7H5a3 3 0 0 0 0 6h15v7H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h15v3Zm-3 6h5v4h-5a2 2 0 0 1 0-4Z',
  report: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M8 13h8M8 17h5',
  attendance: 'M9 11l2 2 4-5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  exam: 'M4 3h14l2 4v14H4V3Zm3 6h10M7 13h10M7 17h6',
  events: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  complaints: 'M12 9v4M12 17h.01M10.3 3.9 1.7-1.1 1.7 1.1a8 8 0 1 1-3.4 0Z',
  ai: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z',
  analytics: 'M3 3v18h18M8 17V9M13 17V5M18 17v-6',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.4 1.07V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.07-.4H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .4-1.07V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.24.37.6.64 1 .73.2.05.42.07.6.07h.09a2 2 0 1 1 0 4H21a1.65 1.65 0 0 0-1.6 1.2Z',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  search: 'M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  upload: 'M12 3v12M7 8l5-5 5 5M5 21h14a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2',
  bot: 'M12 8V4M8 4h8M5 10a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-5ZM8 13h.01M16 13h.01M9 17h6M3 12H1M23 12h-2',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
  message: 'M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8ZM8 10h8M8 14h5',
  more: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z',
  megaphone: 'M3 11v2a2 2 0 0 0 2 2h2l4 4v-4h4l6 3V6l-6 3H5a2 2 0 0 0-2 2Z',
  userPlus: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M17 11h6',
  check: 'M20 6 9 17l-5-5',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6',
  money: 'M3 6h18v12H3V6Zm4 8h.01M17 10h.01M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  warning: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01'
};

export function getIconPath(icon: IconName): string {
  return ICON_PATHS[icon];
}
