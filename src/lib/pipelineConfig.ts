const PIPELINE_CONFIG_KEY = 'agentorch_pipeline_config'

export interface PipelineConfig {
  leadScoreThreshold: number
  growthPackagePrice: number
  regionFocus: string
  outreachResponseWindowHours: number
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  leadScoreThreshold: 60,
  growthPackagePrice: 4997,
  regionFocus: 'Southern California',
  outreachResponseWindowHours: 48,
}

export function loadPipelineConfig(): PipelineConfig {
  try {
    const raw = localStorage.getItem(PIPELINE_CONFIG_KEY)
    if (raw) return { ...DEFAULT_PIPELINE_CONFIG, ...JSON.parse(raw) }
  } catch { /* fall through to defaults */ }
  return DEFAULT_PIPELINE_CONFIG
}

export function savePipelineConfig(config: PipelineConfig): void {
  localStorage.setItem(PIPELINE_CONFIG_KEY, JSON.stringify(config))
}
