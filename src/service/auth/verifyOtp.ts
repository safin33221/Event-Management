'use server';

export async function verifyOtp(): Promise<{ success: boolean; message: string }> {
  return {
    success: false,
    message: 'Password authentication is active for this workspace.',
  };
}
