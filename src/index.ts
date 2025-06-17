
import { Context, Schema } from 'koishi'
import axios from 'axios'

export const name = 'bf2042-server'
export const usage = '查询 BF2042 服务器状态的插件，支持自定义命令列表'

const BASE_URL = 'https://api.gametools.network/bf2042'

const regionCodes: Record<string, string> = {
  all: '全部',
  eu: '欧洲',
  asia: '亚洲',
  nam: '北美',
  sam: '南美',
  afr: '非洲',
  oc: '大洋洲',
  Europe: '欧洲',
  Asia: '亚洲',
  'North America': '北美',
  'South America': '南美',
  Africa: '非洲',
  Oceania: '大洋洲',
}

const mapCodes: Record<string, string> = {
  'Arica Harbor': '阿里卡港',
  Valparaiso: '瓦尔帕莱索',
  'Battle of the Bulge': '突出部之役',
  'El Alamein': '阿拉曼',
  'Caspian Border': '里海边境',
  'Noshahr Canals': '诺沙赫运河',
  Orbital: '航天发射中心',
  Hourglass: '沙漏',
  Kaleidoscope: '万花筒',
  Breakaway: '分崩离析',
  Discarded: '废弃之地',
  Manifest: '货物仓单',
  Renewal: '涅槃',
  Redacted: '删隐地区',
  Flashpoint: '闪点',
  Spearhead: '急先锋',
  Stranded: '搁浅',
  Haven: '避难所',
  Stadium: '体育场',
  Exposure: '曝光',
  Reclaimed: '重生',
}

const modeCodes: Record<string, string> = {
  'Breakthrough Large': '大型突破',
  Breakthrough: '突破',
  Conquest: '征服',
  Custom: '自定义',
  Rush: '突袭',
  'Conquest large': '大型征服',
}

export async function fetchServerDetail(options: { serverName?: string; serverID?: string }): Promise<string> {
  let url = ''
  if (options.serverName) {
    url = `${BASE_URL}/detailedserver/?name=${encodeURIComponent(options.serverName)}`
  } else if (options.serverID) {
    url = `${BASE_URL}/detailedserver/?serverid=${encodeURIComponent(options.serverID)}`
  } else {
    throw new Error('Either serverName or serverID must be provided.')
  }

  const { data: result } = await axios.get(url)

  const mapName = mapCodes[result.currentMap] ?? result.currentMap
  const rotation = result.rotation ?? []
  const modeName = rotation?.[0]?.mode
    ? modeCodes[rotation[0].mode] ?? rotation[0].mode
    : modeCodes[result.mode] ?? result.mode

  const name = result.serverInfo?.serverName ?? result.prefix ?? ''
  const playerAmount = result.playerAmount ?? 0
  const maxPlayers = result.maxPlayers ?? 0
  const regionName = regionCodes[result.region] ?? result.region
  const owner = result.owner?.name ?? ''
  const currentMapId = result.currentMapId ?? ''

  let serverStatus = `[服务器] ${name}\n` +
                     `[地区] ${regionName}\n` +
                     `[服主] ${owner}\n`  +
                     `[状态] ${playerAmount}/${maxPlayers} - ${modeName}\n` +
                     `[当前地图] ${mapName} \n`

  let currentIndex = -1
  let rotationList = ''
  if (Array.isArray(rotation) && rotation.length > 0) {
    rotation.forEach((r, idx) => {
      const rMap = mapCodes[r.mapname] ?? r.mapname
      const rMode = modeCodes[r.mode] ?? r.mode
      rotationList += `  ${idx + 1} - ${rMap} - ${rMode}\n`
      if (r.mapname === result.currentMap || r.mapname === result.currentMapId || r.mapname === currentMapId) {
        currentIndex = idx
      }
    })
    if (currentIndex !== -1) {
      const nextIdx = (currentIndex + 1) % rotation.length
      const next = rotation[nextIdx]
      const nextMapName = mapCodes[next.mapname] ?? next.mapname
      serverStatus += `[当前轮换] ${currentIndex + 1}/${rotation.length}\n`
      serverStatus += `[下张地图] ${nextMapName}\n`
    }
    serverStatus += '[地图轮换]\n' + rotationList
  }

  return serverStatus
}

export async function fetchServers(name = '', region = 'all', limit = 10): Promise<string> {
  const url = `${BASE_URL}/servers/?name=${encodeURIComponent(name)}&region=${region}&limit=${limit}`
  const { data: result } = await axios.get(url)

  const servers = result.servers ?? result
  const lines = servers.map((s) => {
    const regionName = regionCodes[s.region] ?? s.region
    const mapName = mapCodes[s.currentMap] ?? s.currentMap
    const modeName = modeCodes[s.mode] ?? s.mode
    const playerAmount = s.playerAmount ?? 0
    const maxPlayers = s.maxPlayers ?? 0
    const serverName = s.prefix ?? 'None'
    return `[${serverName}]\n[${playerAmount}/${maxPlayers} - ${mapName} - ${modeName} - ${regionName}]`
  })

  return `当前热门服务器: \n` + lines.join('\n\n')
}

export interface Config {
  serverList: {
    name: string
    id: string
  }[]
}

export const Config: Schema<Config> = Schema.object({
  serverList: Schema.array(
    Schema.object({
      name: Schema.string().description('命令名（例如 epic）'),
      id: Schema.string().description('对应的 Server ID'),
    })
  ).description('服务器命令列表'),
})

export function apply(ctx: Context, config: Config) {
  ctx.command('机器人', '显示帮助信息')
    .action(() => {
      const dynamicCmds = (config.serverList || []).map(item => `/${item.name}`).join('  ')
      return `欢迎使用 BF2042 查询机器人！\n\n` +
             `以下指令可用：\n` +
             ` /服务器 [名字] - 查询服务器状态或热门服务器\n` +
             ` ${dynamicCmds ? dynamicCmds + '\n' : ''}`
    })

  ctx.command('服务器 [serverName:text]', '查询 BF2042 服务器状态')
    .action(async ({ session }, serverName) => {
      try {
        if (!serverName) {
          await fetchServers('', 'all', 5).then((msg) => session.send(msg))
        } else {
          await fetchServerDetail({ serverName }).then((msg: string) => session.send(msg))
        }
      } catch (err) {
        console.error(err)
        return '查询出错了，请稍后再试。'
      }
    })

  for (const { name, id } of config.serverList || []) {
    if (!name || !id) {
      console.warn(`[bf2042] 跳过无效命令项: name=${name}, id=${id}`)
      continue
    }

    ctx.command(name, `查询 ${name} 服务器状态`)
      .action(async ({ session }) => {
        try {
          console.log(`[bf2042] 执行指令 /${name} -> ${id}`)
          const msg = await fetchServerDetail({ serverID: id })
          return msg
        } catch (err) {
          console.error(`[bf2042] 查询失败: ${err}`)
          return '查询出错了，请稍后再试。'
        }
      })
  }



}
