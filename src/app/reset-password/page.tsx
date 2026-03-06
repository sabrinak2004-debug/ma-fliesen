// src/app/reset-password/page.tsx
export const dynamic = "force-dynamic";

import ResetPasswordClient from "./ResetPasswordClient";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const resolvedSearchParams = await searchParams;
  const token = (resolvedSearchParams.token ?? "").trim();

  return <ResetPasswordClient token={token} />;
}