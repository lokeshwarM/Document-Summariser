import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#FAF3E1' }}>
      <SignIn />
    </main>
  );
}
