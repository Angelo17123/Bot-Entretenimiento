const JsonStore = require("./JsonStore");

class JsonUserRepository {
  constructor() {
    this.store = new JsonStore("data/db");
  }

  async init() {
    const users = this.store.get("users");
    if (!Array.isArray(users)) this.store.set("users", []);
    const blacklist = this.store.get("staff_blacklist");
    if (!Array.isArray(blacklist)) this.store.set("staff_blacklist", []);
    console.log("✅ BASE DE DATOS: Tablas JSON de Usuarios y Blacklist verificadas.");
  }

  async save(user) {
    let users = this.store.get("users") || [];
    const idx = users.findIndex((u) => u.discord_id === user.discordId);
    const row = {
      discord_id: user.discordId,
      role: user.role,
      username: user.username,
      server_nickname: user.serverNickname,
      join_date: user.joinDate ? new Date(user.joinDate).toISOString() : new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    if (idx >= 0) {
      users[idx] = row;
    } else {
      users.push(row);
    }
    this.store.set("users", users);
  }

  async findById(discordId) {
    const users = this.store.get("users") || [];
    const r = users.find((u) => u.discord_id === discordId);
    if (!r) return null;
    return {
      discordId: r.discord_id,
      role: r.role,
      username: r.username,
      serverNickname: r.server_nickname,
      joinDate: r.join_date,
    };
  }

  async findAll(limit = 10, offset = 0, roleFilter = null) {
    let users = this.store.get("users") || [];
    if (roleFilter && roleFilter !== "ALL") {
      users = users.filter((u) => u.role === roleFilter);
    }
    return users
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(offset, offset + limit)
      .map((r) => ({
        discordId: r.discord_id,
        role: r.role,
        username: r.username,
        serverNickname: r.server_nickname,
        joinDate: r.join_date,
      }));
  }

  async findAllUsers() {
    const users = this.store.get("users") || [];
    return users
      .sort((a, b) => (a.username || "").localeCompare(b.username || ""))
      .map((r) => ({
        discordId: r.discord_id,
        username: r.username,
        serverNickname: r.server_nickname,
      }));
  }

  async countAll(roleFilter = null) {
    let users = this.store.get("users") || [];
    if (roleFilter && roleFilter !== "ALL") {
      users = users.filter((u) => u.role === roleFilter);
    }
    return users.length;
  }

  async delete(discordId) {
    let users = this.store.get("users") || [];
    users = users.filter((u) => u.discord_id !== discordId);
    this.store.set("users", users);
  }

  async addToBlacklist(data) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + data.days);
    let blacklist = this.store.get("staff_blacklist") || [];
    const idx = blacklist.findIndex((b) => b.discord_id === data.discordId);
    const row = {
      discord_id: data.discordId,
      staff_name: data.staffName || "Desconocido",
      reasons: data.reasons,
      days: data.days,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      author_id: data.authorId,
      created_at: new Date().toISOString(),
    };
    if (idx >= 0) {
      blacklist[idx] = row;
    } else {
      blacklist.push(row);
    }
    this.store.set("staff_blacklist", blacklist);
  }

  async checkBlacklist(discordId) {
    const blacklist = this.store.get("staff_blacklist") || [];
    const now = new Date().toISOString();
    const entry = blacklist.find(
      (b) => b.discord_id === discordId && b.end_date > now
    );
    return entry || null;
  }
}

module.exports = new JsonUserRepository();
