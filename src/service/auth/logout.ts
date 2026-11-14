'use server';

import { deleteCookies } from './tokenHandler';

export async function logout(): Promise<{ success: boolean; message: string }> {
  try {
    await deleteCookies('accessToken');
    await deleteCookies('userSession');
    return { success: true, message: 'Signed out' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to sign out',
    };
  }
}
