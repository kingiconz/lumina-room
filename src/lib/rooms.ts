export interface Room {
  code: string;
  name: string;
  floor: string;
  floorOrder: number;
  capacity: number;
  amenities: string[];
}

export const ROOMS: Room[] = [
  { code: "gf-gchq", name: "Guest Connect HQ", floor: "Ground Floor", floorOrder: 0, capacity: 14, amenities: ["4K Display", "Video Conf", "Whiteboard"] },
  { code: "gf-gmr", name: "Guest Meeting Room", floor: "Ground Floor", floorOrder: 0, capacity: 8, amenities: ["Display", "Whiteboard"] },
  { code: "ff-knmr", name: "Kwame Nkrumah Meeting Room", floor: "First Floor", floorOrder: 1, capacity: 12, amenities: ["Video Conf", "Display"] },
  { code: "sf-nmmr", name: "Nelson Mandela Meeting Room", floor: "Second Floor", floorOrder: 2, capacity: 20, amenities: ["4K Display", "Video Conf", "Catering"] },
  { code: "sf-eca", name: "e-Crime Academy", floor: "Second Floor", floorOrder: 2, capacity: 30, amenities: ["Training Setup", "Multi Display"] },
  { code: "tf-ybmr", name: "Yaw Broni Meeting Room", floor: "Third Floor", floorOrder: 3, capacity: 10, amenities: ["Display", "Whiteboard"] },
];

export const FLOORS = ["Ground Floor", "First Floor", "Second Floor", "Third Floor"];

export const getRoom = (code: string) => ROOMS.find((r) => r.code === code);
