import CryptoJS from "crypto-js";




const SECRET_KEY = "f0e8cfde0150ed3b667cb59ab0b9d7c371a0bf264217a8704b8434c24d6ce2ff"; // ⚠️ obfuscation, pas sécurité réelle

export const encryptData = (data) => {
  return CryptoJS.AES.encrypt(
    JSON.stringify(data),
    SECRET_KEY
  ).toString();
};

export const decryptData = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (e) {
    return null;
  }
};
