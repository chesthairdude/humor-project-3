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
  id: string
  humor_flavor_id: number
  prompt: string
  step_order: number
  created_at: string
}

export type FlavorCaption = {
  id: string
  caption_content: string
  created_at: string
  images: {
    image_url: string | null
  } | null
}
