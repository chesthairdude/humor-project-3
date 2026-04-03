export type Profile = {
  id: string
  email: string | null
  is_superadmin: boolean | null
  is_matrix_admin: boolean | null
}

export type HumorFlavor = {
  id: number
  slug: string
  description: string | null
  created_datetime_utc: string
  created_by_user_id?: string | null
  modified_by_user_id?: string | null
  modified_datetime_utc?: string | null
  humor_flavor_steps?: Array<{ count: number }>
  step_count?: number
}

export type HumorFlavorStep = {
  id: number
  humor_flavor_id: number
  llm_system_prompt: string | null
  llm_user_prompt: string | null
  order_by: number
  created_datetime_utc: string
  llm_temperature?: number | null
  description?: string | null
  llm_input_type_id?: number | null
  llm_output_type_id?: number | null
  llm_model_id?: number | null
  humor_flavor_step_type_id?: number | null
  created_by_user_id?: string | null
  modified_by_user_id?: string | null
  modified_datetime_utc?: string | null
}

export type LlmInputType = {
  id: number
  slug: string
  description: string
}

export type LlmOutputType = {
  id: number
  slug: string
  description: string
}

export type LlmModel = {
  id: number
  name: string
  provider_model_id: string
  is_temperature_supported: boolean
}

export type HumorFlavorStepType = {
  id: number
  slug: string
  description: string
}

export type FlavorCaption = {
  id: string
  caption_content: string
  created_at: string
  images: {
    image_url: string | null
  } | null
}
