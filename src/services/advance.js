import { FEATURES } from '../config/features';

// Kontrak layanan ini siap dihubungkan ke Supabase Edge Function.
// Semua fungsi ditutup feature flag sehingga tidak bisa dipanggil dari UI publik.
function ensureEnabled(feature) {
  if (!FEATURES[feature]) throw new Error('Fitur ini belum tersedia.');
}

export async function submitDonationConfirmation(payload) {
  ensureEnabled('donationConfirmation');
  return { status: 'pending', payload };
}

export async function redeemActivationCode(code) {
  ensureEnabled('activationCodeRedemption');
  return { status: 'validated', code };
}
