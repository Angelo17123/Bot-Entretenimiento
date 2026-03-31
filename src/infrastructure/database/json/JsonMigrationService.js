const fs = require("fs");
const path = require("path");
const JsonStore = require("./JsonStore");

class JsonMigrationService {
  constructor() {
    this.store = new JsonStore("data/db");
  }

  async runMigrations() {
    await this.seedInitialUsers();
    await this.seedZones();
    await this.seedRanking();
  }

  async seedInitialUsers() {
    const initialAdmins = process.env.INITIAL_ADMINS
      ? process.env.INITIAL_ADMINS.split(",")
      : [];
    let users = this.store.get("users") || [];
    for (const id of initialAdmins) {
      if (!users.find((u) => u.discord_id === id.trim())) {
        users.push({
          discord_id: id.trim(),
          role: "ADM-AUX",
          username: "Kira",
          server_nickname: "Kira",
          join_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }
    }
    this.store.set("users", users);
    console.log("✅ BASE DE DATOS: Admins iniciales verificados (JSON).");
  }

  async seedSedes() {
    const rawData = [
      { name: "Verdes", coords: "-562.08, 327.27, 84.41, 85.41" },
      { name: "DriftKing", coords: "-367.04, -141.73, 38.69, 42.97" },
      { name: "TropaDo7Lc", coords: "722.40, -785.53, 24.82, 9.91" },
      { name: "Italia", coords: "894.36, 11.28, 78.88, 108.00" },
      { name: "Shahara", coords: "-1142.15, -1755.21, 4.53, 328.90" },
      { name: "Sicilia", coords: "-1805.23, 454.47, 128.30, 26.61" },
      {
        name: "Barragem",
        coords: "1359.65, 1139.28, 113.76, 76.89",
        def_coords: "1379.13, 1174.25, 114.22, 45.35",
        atk_coords: "897.87, 17.01, 78.88, 158.00",
        cap_rec: "25vs25",
      },
      {
        name: "Warlocks",
        coords: "-1895.63, 2026.71, 140.73, 159.60",
        def_coords: "-1898.70, 2027.62, 140.74, 339.35",
        atk_coords: "-1544.18, 863.84, 181.43, 70.49",
        cap_rec: "15vs15",
      },
      { name: "LaFrontera", coords: "216.02, 759.20, 204.65, 221.57" },
      { name: "Legacy", coords: "2840.46, -721.99, 7.35, 133.83" },
      {
        name: "La04",
        coords: "-1573.41, 95.68, 58.43, 133.83",
        def_coords: "-1570.13, 97.34, 58.18, 138.90",
        atk_coords: "-2308.79, 435.63, 174.47, 313.40",
        cap_rec: "15vs15",
      },
      { name: "DivineGhost", coords: "-330.51, 219.48, 87.26, 91.34" },
      { name: "BloodDiamons", coords: "-1245.38, 839.34, 193.38, 49.61" },
      { name: "Sonsofkings", coords: "-1754.91, 358.05, 89.40, 35.74" },
      { name: "LosEnroladores", coords: "-1459.66, -28.01, 54.65, 22.14" },
      { name: "LaRianxera", coords: "-1521.10, -437.25, 35.44, 238.26" },
      { name: "Vermehlos", coords: "762.81, -297.61, 59.97, 285.84" },
      { name: "A.S", coords: "110.58, -1946.17, 20.77, 55.41" },
      { name: "Carmessi", coords: "-209.10, -1294.88, 31.30, 28.46" },
      { name: "Caribe", coords: "989.56, -2494.81, 28.30, 60.06" },
      { name: "Israel", coords: "404.55, -1505.01, 29.29, 60.06" },
      {
        name: "Sindicato",
        coords: "-1550.37, 879.80, 181.32, 35.04",
        def_coords: "-1551.66, 858.45, 181.94, 272.42",
        atk_coords: "-1806.40, 454.49, 128.30, 40.63",
        cap_rec: "20vs20",
      },
      {
        name: "Anonimato",
        coords: "-126.41, 1003.46, 235.73, 338.78",
        def_coords: "-126.41, 1003.46, 235.73, 338.78",
        atk_coords: "209.86, 1225.26, 225.46, 57.17",
        cap_rec: "15vs15",
      },
      { name: "Redline", coords: "-2307.75, 425.04, 174.47, 215.67" },
      { name: "China", coords: "-3019.10, 94.52, 11.62, 332.88" },
      { name: "Candela", coords: "1259.13, -281.04, 78.23, 94.78" },
      { name: "Virtude", coords: "-549.23, -928.62, 23.86, 243.38" },
      { name: "Tequila", coords: "-820.38, 158.69, 70.47, 114.99" },
      {
        name: "Blinders",
        coords: "-3430.12, 544.17, 10.79, 183.22",
        def_coords: "-3288.93, 525.01, 12.27, 47.13",
        atk_coords: "-3021.81, 101.14, 11.63, 46.61",
        cap_rec: "30vs30",
      },
      { name: "Glyzzup", coords: "-965.51, -1478.84, 5.02, 185.20" },
    ];

    let sedes = this.store.get("sedes") || [];
    for (const sede of rawData) {
      let isRaidable = !!sede.cap_rec;
      let capacity = null;
      if (sede.cap_rec) {
        const parts = sede.cap_rec.split("vs");
        if (parts.length > 0) capacity = parseInt(parts[0]);
      }
      const idx = sedes.findIndex((s) => s.name === sede.name);
      const row = {
        name: sede.name,
        coords: sede.coords,
        is_raidable: isRaidable,
        def_coords: sede.def_coords || null,
        atk_coords: sede.atk_coords || null,
        team_capacity: capacity,
        created_at: new Date().toISOString(),
      };
      if (idx >= 0) {
        sedes[idx] = row;
      } else {
        sedes.push(row);
      }
    }
    this.store.set("sedes", sedes);
    console.log("✅ BASE DE DATOS: Sedes migradas/verificadas (JSON).");
  }

  async seedZones() {
    const rawCiudad = [
      "ZONA 1:  -845.86, -74.28, 37.87, 209.59",
      "ZONA 2:   103.59, 299.19, 110.02, 107.32",
      "ZONA 3:    87.77, -207.44, 54.49, 34.12",
      "ZONA 4:   -75.27, -435.70, 37.31, 35.37",
      "ZONA 5:    17.89, -677.25, 32.33, 191.09",
      "ZONA 6:  -315.77, -1018.77, 30.39, 150.91",
      "ZONA 7:   261.59, -1189.96, 29.52, 241.10",
      "ZONA 8:   713.78, -841.89, 24.22, 17.39",
      "ZONA 9:   -34.61, 212.35, 106.55, 107.32",
      "ZONA 10:   60.08, -1902.33, 21.69, 159.08",
      "ZONA 11: -430.57, -1704.43, 19.04, 159.08",
      "ZONA 12:  734.39, -2019.26, 29.28, 46.48",
      "ZONA 13: -244.51, -2079.75, 27.62, 45.92",
      "ZONA 14: -1670.59, -1100.07, 13.29, 321.42",
      "ZONA 15:  540.59, -140.10, 58.98, 321.41",
      "ZONA 16: -1316.34, 101.18, 56.13, 141.30",
      "ZONA 17:  614.13, 96.23, 92.48, 261.95",
      "ZONA 18:  -51.88, -1685.47, 29.49, 47.05",
      "ZONA 19: -534.23, -222.15, 37.65, 317.55",
      "ZONA 20: -1034.20, -415.63, 39.62, 47.87",
      "ZONA 21: -1175.35, -736.03, 20.19, 71.08",
      "ZONA 22: -1473.79, -176.87, 52.68, 141.30",
      "ZONA 23:  1254.28, -340.49, 69.08, 321.41",
      "ZONA 24:  464.20, -633.60, 29.00, 141.30",
      "ZONA 25:  171.04, -998.56, 29.57, 154.88",
      "ZONA 26: -694.03, -980.55, 20.39, 135.44",
      "ZONA 27:  -58.76, -1456.98, 32.09, 205.00",
      "ZONA 28: -1267.69, -1107.78, 7.67, 76.66",
      "ZONA 29: -1462.82, -654.58, 29.50, 108.56",
      "ZONA 30:  1152.97, -1526.05, 34.84, 13.22",
      "ZONA 31: -449.12, 107.02, 63.82, 107.99",
      "ZONA 32:  989.56, -2494.81, 28.30, 13.22",
      "ZONA 33:  403.28, -1529.96, 29.32, 167.17",
      "ZONA 34:  1024.41, -765.12, 57.98, 142.85",
      "ZONA 35: -603.71, -688.88, 31.23, 119.71",
    ];
    const rawCayo = [
      "Zona 1 : 5598.53,-5653.45,12.13,339.06",
      "Zona 2 : 5459.34,-5921.61,18.95,208.89",
      "Zona 3 : 4822.57,-6005.55,16.98,339.06",
      "Zona 4 : 4816.06,-4301.08,6.12,339.06",
      "Zona 5 : 5227.92,-4611.64,4.44,339.06",
      "Zona 6 : 4498.81,-4724.51,12.54,341.19",
      "Zona 7 : 4235.67,-4317.38,10.38,200.06",
      "Zona 8 : 3930.35,-4703.29,4.21,313.62",
      "Zona 9 : 4689.69,-5652.48,20.03,95.04",
      "Zona 10 : 5123.43,-5707.25,19.63,216.42",
      "Zona 11: 5594.22,-5209.63,14.34,87.30",
      "Zona 12: 4991.68,-5089.39,5.12,87.30",
      "Zona 13: 4900.13,-4909.88,3.36,85.76",
      "Zona 14: 5272.99,-5418.30,65.56,274.59",
      "Zona 15: 5124.97,-5146.43,2.31,274.59",
      "Zona 16: 4864.01,-5364.49,12.99,57.32",
      "Zona 17: 4891.16,-5738.57,26.35,331.12",
      "Zona 18: 4877.66,-5535.73,30.97,331.12",
      "Zona 19: 5116.45,-5522.73,61.07,331.12",
      "Zona 20: 5059.35,-5344.80,9.44,331.12",
      "Zona 21: 5205.20,-5785.03,15.42,172.58",
      "Zona 22: 5597.67,-5464.28,11.30,96.91",
      "Zona 23: 5430.58,-5210.66,35.16,205.55",
      "Zona 24: 4963.07,-5147.76,2.54,5.26",
      "ZONA 25: 5261.82,-4975.77,18.41,248.12",
      "Zona 26: 4765.58,-4714.17,2.73,340.96",
      "Zona 27: 4999.01,-4414.91,5.39,175.87",
    ];

    const parseZones = (list) =>
      list
        .map((item) => {
          const parts = item.split(":");
          if (parts.length < 2) return null;
          return {
            name: parts[0].trim(),
            coords: parts[1].trim(),
            created_at: new Date().toISOString(),
          };
        })
        .filter(Boolean);

    this.store.set("br_zones_ciudad", parseZones(rawCiudad));
    this.store.set("br_zones_cayo", parseZones(rawCayo));
    console.log("✅ BASE DE DATOS: Zonas BR migradas separadas (JSON).");
  }

  async seedRanking() {
    const ranking = this.store.get("sedes_ranking");
    if (!Array.isArray(ranking)) this.store.set("sedes_ranking", []);
  }
}

module.exports = new JsonMigrationService();
