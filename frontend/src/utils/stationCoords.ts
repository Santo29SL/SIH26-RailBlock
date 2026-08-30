export interface StationInfo {
  lat: number;
  lng: number;
  name: string;
}

export const STATION_DATA: Record<string, StationInfo> = {
  TA: { lat: 10.97954, lng: 75.880597, name: 'Tanur' },
  KGP: { lat: 22.341432, lng: 87.328456, name: 'Kharagpur Jn' },
  MV: { lat: 11.095237, lng: 79.62868, name: 'Mayiladuturai Jn' },
  NLE: { lat: 12.255885, lng: 75.13575, name: 'Nileshwar' },
  KZE: { lat: 12.320268, lng: 75.085248, name: 'Kanhangad' },
  PCO: { lat: 8.709862, lng: 77.738083, name: 'Palankottai' },
  VDL: { lat: 11.195825, lng: 79.703785, name: 'Vithisvarankol' },
  CAPE: { lat: 8.088028, lng: 77.542504, name: 'Kanyakumari' },
  MCJ: { lat: 10.792057, lng: 78.731401, name: 'Manjattidal' },
  NCJ: { lat: 8.17385, lng: 77.44347, name: 'Nagercoil Jn' },
  TCN: { lat: 8.501774, lng: 78.117118, name: 'Tiruchendur' },
  KCHV: { lat: 8.579344, lng: 78.022519, name: 'Kachchanvilai' },
  CDM: { lat: 11.391471, lng: 79.703341, name: 'Chidambaram' },
  BDJ: { lat: 11.593321, lng: 75.586941, name: 'Vadakara' },
  MAQ: { lat: 12.862325, lng: 74.844068, name: 'Mangalore Central' },
  NZT: { lat: 8.563997, lng: 77.976271, name: 'Nazareth' },
  TLY: { lat: 11.75314, lng: 75.492987, name: 'Thalassery' },
  CVP: { lat: 9.182578, lng: 77.872848, name: 'Kovilpatti' },
  MAJN: { lat: 12.866193, lng: 74.88006, name: 'Mangalore Jn' },
  CAN: { lat: 11.870694, lng: 75.368327, name: 'Kannur' },
  KDE: { lat: 10.771022, lng: 79.490035, name: 'Koradacheri' },
  CUPJ: { lat: 11.715119, lng: 79.766287, name: 'Cuddalore Port' },
  TIR: { lat: 10.917757, lng: 75.921865, name: 'Tirur' },
  FK: { lat: 11.174972, lng: 75.830285, name: 'Ferok' },
  AJJ: { lat: 13.081512, lng: 79.667991, name: 'Arakkonam Jn' },
  TRB: { lat: 10.787167, lng: 78.776419, name: 'Tiruverumbur' },
  KZY: { lat: 8.566912, lng: 78.09973, name: 'Kayalpattinam' },
  TEN: { lat: 8.73636, lng: 77.707979, name: 'Tirunelveli Jn' },
  QLD: { lat: 11.446139, lng: 75.693924, name: 'Quilandi' },
  NMJ: { lat: 10.773564, lng: 79.412736, name: 'Nidamangalam' },
  HWH: { lat: 22.584078, lng: 88.340999, name: 'Howrah Jn' },
  AVS: { lat: 9.036513, lng: 76.852807, name: 'Auvaneeswaram' },
  AGC: { lat: 27.157992, lng: 77.990153, name: 'Agra Cantt' },
  PGI: { lat: 11.04591, lng: 75.861006, name: 'Parpanangadi' },
  KMU: { lat: 10.952962, lng: 79.388644, name: 'Kumbakonam' },
  KYN: { lat: 19.234716, lng: 73.12974, name: 'Kalyan Jn' },
  AWT: { lat: 8.602296, lng: 77.941809, name: 'Alwar Tirunagri' },
  CHV: { lat: 12.213321, lng: 75.15435, name: 'Charvattur' },
  SRT: { lat: 9.357545, lng: 77.92157, name: 'Satur' },
  PTB: { lat: 10.801933, lng: 76.181337, name: 'Pattambi' },
  KTU: { lat: 10.845724, lng: 76.033397, name: 'Kuttippuram' },
  KZB: { lat: 8.585755, lng: 78.03964, name: 'Kurumbur' },
  SY: { lat: 11.240305, lng: 79.726353, name: 'Sirkazhi' },
  CLT: { lat: 11.246234, lng: 75.780407, name: 'Kozhikode' },
  MAHE: { lat: 11.699227, lng: 75.546967, name: 'Mahe' },
  ANY: { lat: 8.579144, lng: 78.091842, name: 'Arumuganeri' },
  TDPR: { lat: 11.748883, lng: 79.753349, name: 'Tirupadripulyur' },
  MAS: { lat: 13.084761, lng: 80.274856, name: 'Chennai Central' },
  PUU: { lat: 9.023336, lng: 76.916104, name: 'Punalur' },
  KGQ: { lat: 12.491175, lng: 74.987652, name: 'Kasaragod' },
  PAY: { lat: 12.092248, lng: 75.195107, name: 'Payyanur' },
  NDLS: { lat: 28.642314, lng: 77.220004, name: 'New Delhi' },
  CSMT: { lat: 18.9400, lng: 72.8353, name: 'Mumbai CSMT' },
  SRR: { lat: 10.7601, lng: 76.2755, name: 'Shoranur Jn' },
  ERS: { lat: 9.9682, lng: 76.2899, name: 'Ernakulam Town' },
  TVC: { lat: 8.4876, lng: 76.9526, name: 'Thiruvananthapuram' },
  TPJ: { lat: 10.8038, lng: 78.6856, name: 'Tiruchchirappalli' },
  MDU: { lat: 9.9179, lng: 78.1192, name: 'Madurai Jn' },
  CBE: { lat: 10.9980, lng: 76.9637, name: 'Coimbatore Jn' },
};

export function resolveSectionCoords(sectionCode: string | undefined): {
  start: [number, number];
  end: [number, number];
  startName: string;
  endName: string;
} {
  if (!sectionCode) {
    return {
      start: [STATION_DATA.TLY.lat, STATION_DATA.TLY.lng],
      end: [STATION_DATA.CAN.lat, STATION_DATA.CAN.lng],
      startName: 'Thalassery (TLY)',
      endName: 'Kannur (CAN)',
    };
  }

  const parts = sectionCode.split('-');
  const startCode = parts[0];
  const endCode = parts[1];

  const startStn = STATION_DATA[startCode];
  const endStn = STATION_DATA[endCode];

  if (startStn && endStn) {
    return {
      start: [startStn.lat, startStn.lng],
      end: [endStn.lat, endStn.lng],
      startName: `${startStn.name} (${startCode})`,
      endName: `${endStn.name} (${endCode})`,
    };
  }

  if (startStn) {
    return {
      start: [startStn.lat, startStn.lng],
      end: [startStn.lat + 0.15, startStn.lng + 0.15],
      startName: `${startStn.name} (${startCode})`,
      endName: `${endCode}`,
    };
  }

  // Fallback to default
  return {
    start: [STATION_DATA.TLY.lat, STATION_DATA.TLY.lng],
    end: [STATION_DATA.CAN.lat, STATION_DATA.CAN.lng],
    startName: startCode || 'Start Station',
    endName: endCode || 'End Station',
  };
}
