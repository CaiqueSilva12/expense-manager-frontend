import AuthLayout from '../auth-layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
} 