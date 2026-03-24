export type Profile = {
  id: string
  email: string | null
  is_superadmin: boolean | null
  is_matrix_admin: boolean | null
}

export type HumorFlavor = {
  id: string
  name: string
  description: string | null
  created_at: string
  humor_flavor_steps?: Array<{ count: number }>
}

export type HumorFlavorStep = {
  id: string
  flavor_id: string
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
