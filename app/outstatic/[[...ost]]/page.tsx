import 'outstatic/outstatic.css'
import { Outstatic, OutstaticData } from 'outstatic'
import { OstClient } from 'outstatic/client'

export default async function Page() {
  const ostData = await Outstatic()
  return <OstClient {...ostData} />
}
