import { Context, Session } from 'koishi'
import axios from 'axios'

const BASE_URL = 'https://api.gametools.network/bf2042'

const regionCodes: Record<string, string> = {
  all: '全部', eu: '欧洲', asia: '亚洲', nam: '北美', sam: '南美', afr: '非洲', oc: '大洋洲',
  Europe: '欧洲', Asia: '亚洲', 'North America': '北美', 'South America': '南美', Africa: '非洲', Oceania: '大洋洲',
}

const mapCodes: Record<string, string> = {
  'Arica Harbor': '阿里卡港', Valparaiso: '瓦尔帕莱索', 'Battle of the Bulge': '突出部之役',
  El Alamein: '阿拉曼', 'Caspian Border': '里海边境', 'Noshahr Canals': '诺沙赫运河', Orbital: '航天发射中心',
  Hourglass: '沙漏', Kaleidoscope: '万花筒', Breakaway: '分崩离析', Discarded: '废弃之地', Manifest: '货物仓单',
  Renewal: '涅槃', Redacted: '删隐地区', Flashpoint: '闪点', Spearhead: '急先锋', Stranded: '搁浅',
  Haven: '避难所', Stadium: '体育场', Exposure: '曝光', Reclaimed: '重生',
}

const modeCodes: Record<string, string> = {
  'Breakthrough Large': '大型突破', Breakthrough: '突破', Conquest: '征服', Custom: '自定义', Rush: '突袭',
  'Conquest large': '大型征服',
}

async function fetchServers(region = 'all', limit = 10) {
  const url = `${BASE_URL}/servers/?region=${region}&limit=${limit}`
  const resp = await axios.get(url)
  return resp.data.data || resp.data
}

async function fetchServerByName(name: string) {
  const url = `${BASE_URL}/detailedserver/?name=${encodeURIComponent(name)}`
  const resp = await axios.get(url)
  return resp.data.data || resp.data
}

export const name = 'koishi-plugin-servers'

export function apply(ctx: Context) {
  ctx.command('服务器 [name]', '查询 BF2042 服务器信息')
    .example('服务器', '获取热门服务器列表')
    .example('服务器 epic', '查询名为 epic 的服务器信息')
    .action(async ({ session }: { session: Session }, name: string) => {
      try {
        if (!name) {
          const result = await fetchServers()
          const list = Array.isArray(result.servers) ? result.servers : result
          if (!list.length) return '未找到任何服务器。'
          const lines = list.slice(0, 10).map(s => {
            const region = regionCodes[s.region] || s.region
            const map = mapCodes[s.currentMap] || s.currentMap
            const mode = modeCodes[s.mode] || s.mode
            return `${s.prefix}\n${s.playerAmount}/${s.maxPlayers} - ${map} - ${mode} - ${region}`
          })
          return '当前热门服务器：\n' + lines.join('\n')
        } else {
          const s = await fetchServerByName(name)
          if (!s || Object.keys(s).length === 0) {
            return `未找到名为 ${name} 的服务器。`
          }
          const region = regionCodes[s.region] || s.region
          const map = mapCodes[s.currentMap] || s.currentMap
          // 首个 rotation 模式为准
          let mode = ''
          if (Array.isArray(s.rotation) && s.rotation.length) {
            mode = modeCodes[s.rotation[0].mode] || s.rotation[0].mode
          } else {
            mode = modeCodes[s.mode] || s.mode
          }
          const serverName = s.serverInfo?.serverName || s.prefix
          const players = `${s.playerAmount}/${s.maxPlayers}`
          const owner = s.owner?.name || ''
          let msg = `服务器名称：${serverName}\n服务器状态：${players} - ${map} - ${mode}\n服务器地区：${region}\n服务器主人：${owner}`
          if (Array.isArray(s.rotation) && s.rotation.length) {
            msg += '\n地图轮换：'
            s.rotation.forEach((r: any, i: number) => {
              const rMap = mapCodes[r.mapname] || r.mapname
              const rMode = modeCodes[r.mode] || r.mode
              msg += `\n  ${i + 1}. ${rMap} - ${rMode}`
            })
          }
          return msg
        }
      } catch (error) {
        console.error(error)
        return '获取服务器信息时出错，请稍后重试。'
      }
    })
}
