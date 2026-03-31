const JsonStore = require("./JsonStore");

class JsonMatchRepository {
  constructor() {
    this.store = new JsonStore("data/db");
  }

  async init() {
    const matches = this.store.get("matches");
    if (!Array.isArray(matches)) this.store.set("matches", []);
    const organizers = this.store.get("match_organizers");
    if (!Array.isArray(organizers)) this.store.set("match_organizers", []);
    const ranking = this.store.get("sedes_ranking");
    if (!Array.isArray(ranking)) this.store.set("sedes_ranking", []);
    await this._importFromLocalRegistro();
    console.log("✅ BASE DE DATOS: Tablas JSON de Partidas verificadas.");
  }

  async _importFromLocalRegistro() {
    const fs = require("fs");
    const path = require("path");
    const lrDir = path.join(__dirname, "..", "..", "..", "..", "LOCALREGISTRO");
    if (!fs.existsSync(lrDir)) return;
    const files = fs.readdirSync(lrDir).filter(f => f.endsWith(".json"));
    if (files.length === 0) return;
    const existing = this.store.get("matches") || [];
    const existingIds = new Set(existing.map(r => r.id));
    let imported = 0;
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(lrDir, file), "utf8"));
        if (!Array.isArray(data)) continue;
        for (const record of data) {
          if (!existingIds.has(record.id)) {
            existing.push({
              id: record.id,
              sede_name: record.sede_name,
              def_name: record.def_name,
              atk_name: record.atk_name,
              winner_name: record.winner_name,
              score_def: record.score_def,
              score_atk: record.score_atk,
              rounds: record.rounds,
              capacity: record.capacity,
              created_at: record.savedAt || new Date().toISOString(),
              iso_year_week: record.isoYearWeek,
              event_subtype: record.event_subtype,
              source: "entretenimiento_system",
              creatorId: record.creatorId,
              staffApoyo: record.staffApoyo || [],
              fecha: record.fecha,
            });
            imported++;
          }
        }
      } catch (e) {
        console.error(`⚠️ Error importando ${file}:`, e.message);
      }
    }
    if (imported > 0) {
      this.store.set("matches", existing);
      console.log(`✅ BASE DE DATOS: ${imported} registros importados desde LOCALREGISTRO.`);
    }
  }

  async save(match) {
    const createdAt = new Date();
    const matchRow = {
      id: match.id,
      sede_name: match.location.name,
      def_name: match.defTeam.name,
      atk_name: match.atkTeam.name,
      winner_name: match.winner?.name || "Empate",
      score_def: match.scoreDef,
      score_atk: match.scoreAtk,
      rounds: match.round,
      capacity: match.capacity,
      created_at: createdAt.toISOString(),
      iso_year_week: match.isoYearWeek || null,
      event_subtype: match.eventSubtype || null,
      source: match.source || "entretenimiento_system",
      creatorId: match.creatorId || null,
      staffApoyo: match.staffApoyo || [],
      fecha: match.fecha || null,
    };
    this.store.append("matches", matchRow);

    if (match.isRanked !== false) {
      const defName = match.defTeam.name;
      const atkName = match.atkTeam.name;
      const winnerName = match.winner?.name;
      let defPoints = 0,
        atkPoints = 0;
      let defWin = 0,
        atkWin = 0;
      let defLoss = 0,
        atkLoss = 0;
      if (winnerName === defName) {
        defPoints = 1;
        defWin = 1;
        atkLoss = 1;
      } else if (winnerName === atkName) {
        atkPoints = 1;
        atkWin = 1;
        defLoss = 1;
      } else {
        defPoints = 0.5;
        atkPoints = 0.5;
      }
      this._updateRanking(defName, defWin, defLoss, defPoints);
      this._updateRanking(atkName, atkWin, atkLoss, atkPoints);
    }

    if (match.leonesIds && match.leonesIds.length > 0) {
      for (const userId of match.leonesIds) {
        this.store.append("match_organizers", {
          match_id: match.id,
          discord_id: userId,
          discord_username: "Desconocido",
          server_nickname: "Desconocido",
          assigned_at: createdAt.toISOString(),
        });
      }
    }

    console.log(`💾 Match ${match.id} guardado JSON (semana ${match.isoYearWeek || "N/A"}).`);
  }

  _updateRanking(sedeName, wins, losses, points) {
    let ranking = this.store.get("sedes_ranking");
    if (!Array.isArray(ranking)) ranking = [];
    let entry = ranking.find((r) => r.sede_name === sedeName);
    if (!entry) {
      entry = {
        sede_name: sedeName,
        wins: 0,
        losses: 0,
        ties: 0,
        points: 0,
        total_matches: 0,
        updated_at: new Date().toISOString(),
      };
      ranking.push(entry);
    }
    entry.wins += wins;
    entry.losses += losses;
    entry.points += points;
    entry.total_matches += 1;
    entry.updated_at = new Date().toISOString();
    this.store.set("sedes_ranking", ranking);
  }

  async getMatchesByIsoYearWeek(isoYearWeek) {
    return this.store.query("matches", (r) => {
      return (
        r.iso_year_week === isoYearWeek &&
        (r.id.startsWith("es_") || r.id.startsWith("match_"))
      );
    });
  }

  async getRecentAssaultWeeks(limit = 8) {
    const all = this.store.get("matches") || [];
    const weeks = new Set();
    for (const r of all) {
      if (
        r.iso_year_week &&
        (r.id.startsWith("es_") || r.id.startsWith("match_"))
      ) {
        weeks.add(r.iso_year_week);
      }
    }
    return Array.from(weeks).sort().reverse().slice(0, limit);
  }

  getMatchesByMonth(year, month) {
    const all = this.store.get("matches") || [];
    return all.filter((r) => {
      if (!r.created_at) return false;
      const d = new Date(r.created_at);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  getAllMatches() {
    return this.store.get("matches") || [];
  }
}

module.exports = new JsonMatchRepository();
