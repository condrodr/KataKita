// Fondasi Advance sudah tersedia, tetapi sengaja tidak diekspos ke UI publik.
// Ubah menjadi true setelah alur donasi dan panel admin siap digunakan.
export const FEATURES = Object.freeze({
  advanceAccess: false,
  donationConfirmation: false,
  activationCodeRedemption: false,
});

export const ACCESS_LEVEL = Object.freeze({
  GUEST: 'guest',
  FREE: 'free',
  ADVANCE: 'advance',
});
