import AuthWrapper from '../components/AuthWrapper';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthWrapper>{children}</AuthWrapper>;
} 