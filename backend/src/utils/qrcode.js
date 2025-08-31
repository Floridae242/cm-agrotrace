// backend/src/utils/qrcode.js
import QRCode from 'qrcode'
export async function createQR(text){
  return await QRCode.toBuffer(text, { type: 'png', margin: 1, scale: 6 })
}
