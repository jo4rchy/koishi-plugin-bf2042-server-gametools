var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Config: () => Config,
  apply: () => apply,
  fetchServerDetail: () => fetchServerDetail,
  fetchServers: () => fetchServers,
  name: () => name,
  usage: () => usage
});
module.exports = __toCommonJS(src_exports);
var import_koishi = require("koishi");
var import_axios = __toESM(require("axios"));
var name = "bf2042-server";
var usage = "查询 BF2042 服务器状态的插件";
var BASE_URL = "https://api.gametools.network/bf2042";
var regionCodes = {
  all: "全部",
  eu: "欧洲",
  asia: "亚洲",
  nam: "北美",
  sam: "南美",
  afr: "非洲",
  oc: "大洋洲",
  Europe: "欧洲",
  Asia: "亚洲",
  "North America": "北美",
  "South America": "南美",
  Africa: "非洲",
  Oceania: "大洋洲"
};
var mapCodes = {
  "Arica Harbor": "阿里卡港",
  Valparaiso: "瓦尔帕莱索",
  "Battle of the Bulge": "突出部之役",
  "El Alamein": "阿拉曼",
  "Caspian Border": "里海边境",
  "Noshahr Canals": "诺沙赫运河",
  Orbital: "航天发射中心",
  Hourglass: "沙漏",
  Kaleidoscope: "万花筒",
  Breakaway: "分崩离析",
  Discarded: "废弃之地",
  Manifest: "货物仓单",
  Renewal: "涅槃",
  Redacted: "删隐地区",
  Flashpoint: "闪点",
  Spearhead: "急先锋",
  Stranded: "搁浅",
  Haven: "避难所",
  Stadium: "体育场",
  Exposure: "曝光",
  Reclaimed: "重生"
};
var modeCodes = {
  "Breakthrough Large": "大型突破",
  Breakthrough: "突破",
  Conquest: "征服",
  Custom: "自定义",
  Rush: "突袭",
  "Conquest large": "大型征服"
};
async function fetchServerDetail(options) {
  let url = "";
  if (options.serverName) {
    url = `${BASE_URL}/detailedserver/?name=${encodeURIComponent(options.serverName)}`;
  } else if (options.serverID) {
    url = `${BASE_URL}/detailedserver/?serverid=${encodeURIComponent(options.serverID)}`;
  } else {
    throw new Error("Either serverName or serverID must be provided.");
  }
  const { data: result } = await import_axios.default.get(url);
  const mapName = mapCodes[result.currentMap] ?? result.currentMap;
  const rotation = result.rotation ?? [];
  const modeName = rotation?.[0]?.mode ? modeCodes[rotation[0].mode] ?? rotation[0].mode : modeCodes[result.mode] ?? result.mode;
  const name2 = result.serverInfo?.serverName ?? result.prefix ?? "";
  const playerAmount = result.playerAmount ?? 0;
  const maxPlayers = result.maxPlayers ?? 0;
  const regionName = regionCodes[result.region] ?? result.region;
  const owner = result.owner?.name ?? "";
  const currentMapUrl = result.currentMapImage ?? "";
  let serverStatus = `服务器名称: ${name2}
状态: ${playerAmount}/${maxPlayers} - ${modeName}
地图: ${mapName} 
地区: ${regionName}
服主: ${owner}
`;
  if (Array.isArray(rotation)) {
    serverStatus += "地图轮换:\n";
    rotation.forEach((r, idx) => {
      const rMap = mapCodes[r.mapname] ?? r.mapname;
      const rMode = modeCodes[r.mode] ?? r.mode;
      const rImg = r.image ?? "";
      serverStatus += `  ${idx + 1}. ${rMap} - ${rMode}
`;
    });
  }
  return serverStatus;
}
__name(fetchServerDetail, "fetchServerDetail");
async function fetchServers(name2 = "", region = "all", limit = 10) {
  const url = `${BASE_URL}/servers/?name=${encodeURIComponent(name2)}&region=${region}&limit=${limit}`;
  const { data: result } = await import_axios.default.get(url);
  const servers = result.servers ?? result;
  const lines = servers.map((s) => {
    const regionName = regionCodes[s.region] ?? s.region;
    const mapName = mapCodes[s.currentMap] ?? s.currentMap;
    const modeName = modeCodes[s.mode] ?? s.mode;
    const playerAmount = s.playerAmount ?? 0;
    const maxPlayers = s.maxPlayers ?? 0;
    const serverName = s.prefix ?? "None";
    const mapUrl = s.url ?? "None";
    return `${serverName}
${playerAmount}/${maxPlayers} - ${mapName} - ${modeName} - ${regionName}`;
  });
  return `当前热门服务器: 
` + lines.join("\n\n");
}
__name(fetchServers, "fetchServers");
var Config = import_koishi.Schema.object({});
function apply(ctx) {
  ctx.command("服务器 [serverName:text]", "查询 BF2042 服务器状态").action(async ({ session }, serverName) => {
    try {
      if (!serverName) {
        await fetchServers("", "all", 5).then((msg) => session.send(msg));
      } else {
        await fetchServerDetail({ serverName }).then((msg) => session.send(msg));
      }
    } catch (err) {
      console.error(err);
      return "查询出错了，请稍后再试。";
    }
  });
  ctx.command("1服", "查询 DragonMa 1服状态").action(async ({ session }) => {
    try {
      const serverId = "ce0b5f7f-dda9-4728-a415-7f025ae5623f";
      await fetchServerDetail({ serverID: serverId }).then((msg) => session.send(msg));
    } catch (err) {
      console.error(err);
      return "查询出错了，请稍后再试。";
    }
  });
  ctx.command("epic", "查询 EPIC 服状态").action(async ({ session }) => {
    try {
      const serverId = "78d78b83-32bb-4022-8b10-6ffcadf79e8a";
      await fetchServerDetail({ serverID: serverId }).then((msg) => session.send(msg));
    } catch (err) {
      console.error(err);
      return "查询出错了，请稍后再试。";
    }
  });
  ctx.command("nohack", "查询 No Hack 服状态").action(async ({ session }) => {
    try {
      const serverId = "23bd5d5a-4485-403d-b2ed-9fcdf57e91c0";
      await fetchServerDetail({ serverID: serverId }).then((msg) => session.send(msg));
    } catch (err) {
      console.error(err);
      return "查询出错了，请稍后再试。";
    }
  });
  ctx.command("机器人", "2042服务器查询机器人指令教程").action(async ({ session }) => {
    return `欢迎使用 BF2042 服务器查询机器人！

以下是可用的指令：
 /服务器  -  查询指定服务器状态，若不指定则返回热门服务器。
 /1服  -  查询 DragonMa 1服状态。
 /epic  -  查询 EPIC 服状态。
 /nohack  -  查询 No Hack 服状态。
 /机器人  -  显示此帮助信息。`;
  });
}
__name(apply, "apply");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  apply,
  fetchServerDetail,
  fetchServers,
  name,
  usage
});
