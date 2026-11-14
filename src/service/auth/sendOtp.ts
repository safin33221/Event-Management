'use server';

export async function sendOtp(): Promise<{ success: boolean; message: string }> {
  return {
    success: false,
    message: 'Password authentication is active for this workspace.',
  };
}
