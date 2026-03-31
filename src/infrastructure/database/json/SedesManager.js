const JsonStore = require("./JsonStore");

const ROLE_ID = "1482522080972111912";

const DEFAULT_SEDES = [
  { key: "warlocks", nombre: "WARLOCKS", emoji: "🔮", capacidad: "15 vs 15", coords: { defensa: "721.85, -768.02, 25.00, 176.75", ataque: "721.85, -768.02, 25.00, 176.75" } },
  { key: "cristalpalace", nombre: "CRISTALPALACE", emoji: "💎", capacidad: "15 vs 15", coords: { defensa: "1389.56,-703.98,67.28,111.06", ataque: "1389.56,-703.98,67.28,111.06" } },
  { key: "shahara", nombre: "SHAHARA", emoji: "🏜️", capacidad: "15 vs 15", coords: { defensa: "-1149.95, -1751.39, 4.54, 289.03", ataque: "-1149.95, -1751.39, 4.54, 289.03" } },
  { key: "sicilia", nombre: "SICILIA", emoji: "🍷", capacidad: "15 vs 15", coords: { defensa: "-1807.62, 456.29, 128.29, 263.59", ataque: "-1807.62, 456.29, 128.29, 263.59" } },
  { key: "badjobs", nombre: "BADJOBS", emoji: "💼", capacidad: "15 vs 15", coords: { defensa: "-2097.92, -321.18, 13.02, 187.80", ataque: "-2097.92, -321.18, 13.02, 187.80" } },
  { key: "barragem", nombre: "BARRAGEM", emoji: "🚧", capacidad: "25 vs 25", coords: { defensa: "1367.03, 1146.34, 113.76, 78.31", ataque: "1367.03, 1146.34, 113.76, 78.31" } },
  { key: "tropado7lc", nombre: "TROPADO7LC", emoji: "🪖", capacidad: "15 vs 15", coords: { defensa: "-1892.36, 2035.24, 140.74, 157.74", ataque: "-1892.36, 2035.24, 140.74, 157.74" } },
  { key: "vendetta", nombre: "VENDETTA", emoji: "🗡️", capacidad: "15 vs 15", coords: { defensa: "205.62, 776.47, 205.63, 101.45", ataque: "205.62, 776.47, 205.63, 101.45" } },
  { key: "legacy", nombre: "LEGACY", emoji: "🏛️", capacidad: "15 vs 15", coords: { defensa: "770.38,-243.12,66.26,194.25", ataque: "770.38,-243.12,66.26,194.25" } },
  { key: "la04", nombre: "LA04", emoji: "🏙️", capacidad: "15 vs 15", coords: { defensa: "-1558.28, 111.49, 56.78, 323.29", ataque: "-1558.28, 111.49, 56.78, 323.29" } },
  { key: "divineghost", nombre: "DIVINEGHOST", emoji: "👻", capacidad: "15 vs 15", coords: { defensa: "-326.51, 221.86, 87.16, 77.61", ataque: "-326.51, 221.86, 87.16, 77.61" } },
  { key: "bloodsdiamonds", nombre: "BLOODSDIAMONDS", emoji: "🩸", capacidad: "15 vs 15", coords: { defensa: "-1254.35, 841.71, 193.38, 2.27", ataque: "-1254.35, 841.71, 193.38, 2.27" } },
  { key: "porrosfamily", nombre: "PORROSFAMILY", emoji: "🌿", capacidad: "15 vs 15", coords: { defensa: "-1459.27, -28.66, 54.65, 339.65", ataque: "-1459.27, -28.66, 54.65, 339.65" } },
  { key: "driftking", nombre: "DRIFTKING", emoji: "🏎️", capacidad: "15 vs 15", coords: { defensa: "-384.55, -113.41, 38.74, 176.94", ataque: "-384.55, -113.41, 38.74, 176.94" } },
  { key: "as", nombre: "A.S", emoji: "🛡️", capacidad: "15 vs 15", coords: { defensa: "111.28, -1944.60, 20.78, 46.04", ataque: "111.28, -1944.60, 20.78, 46.04" } },
  { key: "italia", nombre: "ITALIA", emoji: "🇮🇹", capacidad: "15 vs 15", coords: { defensa: "918.57, 48.50, 80.90, 86.53", ataque: "918.57, 48.50, 80.90, 86.53" } },
  { key: "clanreal", nombre: "CLAN REAL", emoji: "👑", capacidad: "15 vs 15", coords: { defensa: "242.04, 1178.71, 225.46, 80.80", ataque: "242.04, 1178.71, 225.46, 80.80" } },
  { key: "anonimato", nombre: "ANONIMATO", emoji: "🎭", capacidad: "15 vs 15", coords: { defensa: "999.34, -2506.11, 28.30, 177.96", ataque: "999.34, -2506.11, 28.30, 177.96" } },
  { key: "verdes", nombre: "VERDES", emoji: "🟢", capacidad: "20 vs 20", coords: { defensa: "-1532.36, 858.29, 181.56, 67.66", ataque: "-1532.36, 858.29, 181.56, 67.66" } },
  { key: "caribe", nombre: "CARIBE", emoji: "🌴", capacidad: "15 vs 15", coords: { defensa: "-131.66, 980.11, 235.84, 124.05", ataque: "-131.66, 980.11, 235.84, 124.05" } },
  { key: "redline", nombre: "REDLINE", emoji: "🔴", capacidad: "15 vs 15", coords: { defensa: "-2309.87, 433.55, 174.47, 270.94", ataque: "-2309.87, 433.55, 174.47, 270.94" } },
  { key: "china", nombre: "CHINA", emoji: "🐉", capacidad: "15 vs 15", coords: { defensa: "-3018.92, 93.77, 11.61, 330.42", ataque: "-3018.92, 93.77, 11.61, 330.42" } },
  { key: "lacandela", nombre: "LACANDELA", emoji: "🔥", capacidad: "15 vs 15", coords: { defensa: "1260.90, -283.48, 78.47, 46.89", ataque: "1260.90, -283.48, 78.47, 46.89" } },
  { key: "virtude", nombre: "VIRTUDE", emoji: "⚖️", capacidad: "15 vs 15", coords: { defensa: "-552.70, -922.31, 23.86, 252.38", ataque: "-552.70, -922.31, 23.86, 252.38" } },
  { key: "glyzzup", nombre: "GLYZZUP", emoji: "🌭", capacidad: "15 vs 15", coords: { defensa: "-974.94, -1478.23, 5.01, 92.53", ataque: "-974.94, -1478.23, 5.01, 92.53" } },
  { key: "shadowsking", nombre: "SHADOWSKING", emoji: "👑", capacidad: "15 vs 15", coords: { defensa: "-2102.51, -316.17, 13.03, 123.08", ataque: "-2102.51, -316.17, 13.03, 123.08" } },
  { key: "stk", nombre: "S.T.K", emoji: "⚔️", capacidad: "15 vs 15", coords: { defensa: "1239.99, -1936.23, 45.62, 265.37", ataque: "1239.99, -1936.23, 45.62, 265.37" } },
  { key: "uwu", nombre: "UWU", emoji: "🏰", capacidad: "20 vs 20", coords: { defensa: "123.43,23.42,-2414", ataque: "123.43,23.42,-2414" } },
  { key: "lopez", nombre: "Lopez", emoji: "🎇", capacidad: "20 vs 20", coords: { defensa: "test", ataque: "test" } },
];

class SedesManager {
  constructor() {
    this.store = new JsonStore("data/db");
  }

  async init() {
    let sedes = this.store.get("sedes");
    if (!Array.isArray(sedes) || sedes.length === 0) {
      sedes = DEFAULT_SEDES.map(s => ({
        ...s,
        created_at: new Date().toISOString()
      }));
      this.store.set("sedes", sedes);
      console.log(`✅ BASE DE DATOS: ${sedes.length} sedes iniciales cargadas.`);
    }
    return sedes;
  }

  getAll() {
    return this.store.get("sedes") || [];
  }

  add(sede) {
    let sedes = this.store.get("sedes") || [];
    const exists = sedes.find((s) => s.key === sede.key);
    if (exists) return { ok: false, reason: "exists" };
    sedes.push({
      key: sede.key,
      nombre: sede.nombre,
      emoji: sede.emoji || "🏰",
      capacidad: sede.capacidad || "15 vs 15",
      coords: sede.coords || { defensa: "N/A", ataque: "N/A" },
      created_at: new Date().toISOString(),
    });
    this.store.set("sedes", sedes);
    return { ok: true };
  }

  remove(key) {
    let sedes = this.store.get("sedes") || [];
    const before = sedes.length;
    sedes = sedes.filter((s) => s.key !== key);
    this.store.set("sedes", sedes);
    return { ok: before > sedes.length };
  }

  hasPermission(interaction) {
    if (!interaction.member || !interaction.member.roles) return false;
    return interaction.member.roles.cache.has(ROLE_ID);
  }
}

module.exports = new SedesManager();
