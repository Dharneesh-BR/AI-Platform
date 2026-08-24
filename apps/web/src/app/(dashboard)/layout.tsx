import type { ReactNode } from 'react';
import { AppShell } from '../../components/platform/app-shell';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AppShell>{children}</AppShell>;
}