// src/app/reset-password/page.tsx
export const dynamic = "force-dynamic";

import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = (searchParams.token ?? "").trim();
  return <ResetPasswordClient token={token} />;
}